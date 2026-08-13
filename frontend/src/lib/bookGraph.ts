import type { BookGenomeData, GenomeBook } from "./bookGenome";

/**
 * Force-directed book-genome graph: simulation + canvas renderer.
 *
 * Deliberately framework-agnostic — it owns the canvas, the RAF loop and all
 * pointer handling, and reports changes back through callbacks. React only
 * mounts it, feeds it props, and renders the surrounding chrome. Keeping the
 * per-frame work out of React state avoids re-rendering the whole page 60
 * times a second.
 */

/** Mirrors --ink and --surface-raised from globals.css. Canvas can't read
 *  CSS custom properties directly, so the values are restated here. */
export const INK = "#000000";
export const PAPER = "#fafaf9";

export type Layout = "web" | "orbit" | "cluster";
export type NodeSizeBy = "length" | "connections";

export interface GraphNode {
  id: string;
  book: GenomeBook;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  /** Layout target, used by orbit mode. */
  tx: number;
  ty: number;
  r: number;
  degree: number;
  cluster: { x: number; y: number };
}

export interface GraphEdge {
  a: GraphNode;
  b: GraphNode;
  weight: number;
  shared: string[];
  sameAuthor: boolean;
  rest: number;
}

export interface Neighbour {
  node: GraphNode;
  weight: number;
  shared: string[];
  sameAuthor: boolean;
}

export interface EngineOptions {
  data: BookGenomeData;
  layout?: Layout;
  nodeSizeBy?: NodeSizeBy;
  /** Minimum shared genes required to draw a bond. */
  linkDensity?: number;
  hardShadow?: boolean;
  onSelect?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  onStats?: (stats: { nodeCount: number; linkCount: number }) => void;
}

/** Perceived luminance, to pick readable ink over a coloured fill. */
function textOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? INK : PAPER;
}

export { textOn };

export class BookGraphEngine {
  private data: BookGenomeData;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  nodes: GraphNode[] = [];
  edges: GraphEdge[] = [];
  adj: Record<string, Neighbour[]> = {};
  nodeById: Record<string, GraphNode> = {};

  private maxWeight = 1;
  private maxDegree = 1;
  private genreCenter: Record<string, { x: number; y: number }> = {};

  private layout: Layout;
  private nodeSizeBy: NodeSizeBy;
  private linkDensity: number;
  private hardShadow: boolean;

  private view = { scale: 0.82, tScale: 0.82, panX: 0, panY: 0, tPanX: 0, tPanY: 0 };
  private css = { w: 1, h: 1 };
  private dpr = 1;
  private t = 0;
  private raf = 0;

  private hoveredId: string | null = null;
  private selectedId: string | null = null;
  private focusId: string | null = null;
  private highlightGenre: string | null = null;

  private dragNode: GraphNode | null = null;
  private isPanning = false;
  private down: { sx: number; sy: number; moved: boolean; node?: GraphNode; panX: number; panY: number } | null =
    null;

  private opts: EngineOptions;
  private resizeObserver: ResizeObserver | null = null;
  private prefersReducedMotion = false;
  /**
   * ctx.font is parsed by the canvas, not CSS — it can't resolve
   * `var(--font-dm-sans)`, and silently falls back to the default font when
   * given one. Resolve the real family from computed style at mount.
   */
  private labelFont = '700 11px system-ui, sans-serif';

  constructor(opts: EngineOptions) {
    this.opts = opts;
    this.data = opts.data;
    this.layout = opts.layout ?? "web";
    this.nodeSizeBy = opts.nodeSizeBy ?? "length";
    this.linkDensity = opts.linkDensity ?? 2;
    this.hardShadow = opts.hardShadow ?? true;

    this.buildGraph();
    this.computeGenreCenters();
    // Settle the layout before the first paint so it doesn't visibly explode.
    for (let i = 0; i < 170; i++) this.tick();
  }

  // ── graph construction ────────────────────────────────────────────

  private buildGraph() {
    const books = this.data.books;
    const n = books.length;

    this.nodes = books.map((b) => ({
      id: b.id,
      book: b,
      color: this.data.genres[b.genre] ?? "#9ca3af",
      // Deterministic scatter: a seeded ring beats Math.random() here, because
      // a random start makes the settled layout different on every mount (and
      // mismatched between server and client).
      x: Math.cos(hash(b.id)) * 160,
      y: Math.sin(hash(b.id) * 1.7) * 160,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      tx: 0,
      ty: 0,
      r: 18,
      degree: 0,
      cluster: { x: 0, y: 0 },
    }));

    this.nodeById = {};
    this.adj = {};
    for (const nd of this.nodes) {
      this.nodeById[nd.id] = nd;
      this.adj[nd.id] = [];
    }

    this.edges = [];
    for (let i = 0; i < n; i++) {
      const genesI = new Set(books[i].genes);
      for (let j = i + 1; j < n; j++) {
        const shared = books[j].genes.filter((g) => genesI.has(g));
        const sameAuthor = books[i].author === books[j].author;
        if (shared.length < this.linkDensity && !sameAuthor) continue;

        const weight = shared.length + (sameAuthor ? 1 : 0);
        const a = this.nodes[i];
        const b = this.nodes[j];
        this.edges.push({ a, b, weight, shared, sameAuthor, rest: 0 });
        this.adj[a.id].push({ node: b, weight, shared, sameAuthor });
        this.adj[b.id].push({ node: a, weight, shared, sameAuthor });
        a.degree++;
        b.degree++;
      }
    }

    this.maxWeight = Math.max(1, ...this.edges.map((e) => e.weight));
    this.maxDegree = Math.max(1, ...this.nodes.map((nd) => nd.degree));
    // Stronger bonds rest closer together.
    for (const e of this.edges) e.rest = 66 + (1 - e.weight / this.maxWeight) * 150;

    this.computeRadii();
    this.opts.onStats?.({ nodeCount: this.nodes.length, linkCount: this.edges.length });
  }

  private computeRadii() {
    for (const nd of this.nodes) {
      nd.r =
        this.nodeSizeBy === "connections"
          ? 14 + (nd.degree / this.maxDegree) * 32
          : Math.max(15, Math.min(46, 13 + nd.book.pages / 42));
    }
  }

  private computeGenreCenters() {
    const keys = Object.keys(this.data.genres);
    const R = 330;
    this.genreCenter = {};
    keys.forEach((k, i) => {
      const ang = (i / keys.length) * Math.PI * 2 - Math.PI / 2;
      this.genreCenter[k] = { x: Math.cos(ang) * R, y: Math.sin(ang) * R };
    });
    for (const nd of this.nodes) {
      nd.cluster = this.genreCenter[nd.book.genre] ?? { x: 0, y: 0 };
    }
  }

  private computeOrbitTargets(fid: string) {
    const focus = this.nodeById[fid];
    if (!focus) return;
    focus.tx = 0;
    focus.ty = 0;

    const nb = (this.adj[fid] ?? []).slice().sort((a, b) => b.weight - a.weight);
    const nbSet = new Set(nb.map((x) => x.node.id));

    nb.forEach((x, i) => {
      const ang = (nb.length > 1 ? i / nb.length : 0) * Math.PI * 2 - Math.PI / 2;
      const radius = 155 + (1 - x.weight / this.maxWeight) * 215;
      x.node.tx = Math.cos(ang) * radius;
      x.node.ty = Math.sin(ang) * radius;
    });

    const others = this.nodes.filter((nd) => nd.id !== fid && !nbSet.has(nd.id));
    others.forEach((nd, i) => {
      const ang = (i / Math.max(1, others.length)) * Math.PI * 2;
      const radius = 545 + (i % 2) * 48;
      nd.tx = Math.cos(ang) * radius;
      nd.ty = Math.sin(ang) * radius;
    });
  }

  // ── simulation ────────────────────────────────────────────────────

  private tick() {
    this.t++;
    const v = this.view;
    v.scale += (v.tScale - v.scale) * 0.12;
    v.panX += (v.tPanX - v.panX) * 0.12;
    v.panY += (v.tPanY - v.panY) * 0.12;

    const N = this.nodes;
    if (N.length === 0) return;

    // Orbit is a laid-out mode, not a simulated one: nodes ease to fixed slots.
    if (this.layout === "orbit") {
      for (const nd of N) {
        if (nd === this.dragNode) continue;
        nd.x += (nd.tx - nd.x) * 0.1;
        nd.y += (nd.ty - nd.y) * 0.1;
        nd.vx = 0;
        nd.vy = 0;
      }
      return;
    }

    const krep = this.layout === "cluster" ? 8200 : 18500;
    for (const nd of N) {
      nd.ax = 0;
      nd.ay = 0;
    }

    // O(n²) repulsion. Fine at this scale (35 nodes ≈ 600 pairs/frame); would
    // need a quadtree before this dataset grows past a few hundred books.
    for (let i = 0; i < N.length; i++) {
      const a = N[i];
      for (let j = i + 1; j < N.length; j++) {
        const b = N[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = Math.max(1, dx * dx + dy * dy);
        const d = Math.sqrt(d2);
        const f = krep / d2;
        const ux = dx / d;
        const uy = dy / d;
        a.ax -= f * ux;
        a.ay -= f * uy;
        b.ax += f * ux;
        b.ay += f * uy;
      }
    }

    const ks = this.layout === "cluster" ? 0.006 : 0.022;
    for (const e of this.edges) {
      const dx = e.b.x - e.a.x;
      const dy = e.b.y - e.a.y;
      const d = Math.hypot(dx, dy) || 1;
      const rest = this.layout === "cluster" ? e.rest * 0.7 : e.rest;
      const f = ks * (d - rest);
      const ux = dx / d;
      const uy = dy / d;
      e.a.ax += f * ux;
      e.a.ay += f * uy;
      e.b.ax -= f * ux;
      e.b.ay -= f * uy;
    }

    if (this.layout === "cluster") {
      for (const nd of N) {
        nd.ax += (nd.cluster.x - nd.x) * 0.021;
        nd.ay += (nd.cluster.y - nd.y) * 0.021;
      }
    } else {
      for (const nd of N) {
        nd.ax += -nd.x * 0.0016;
        nd.ay += -nd.y * 0.0016;
      }
    }

    for (const nd of N) {
      if (nd === this.dragNode) {
        nd.vx = 0;
        nd.vy = 0;
        continue;
      }
      nd.vx = (nd.vx + nd.ax) * 0.85;
      nd.vy = (nd.vy + nd.ay) * 0.85;
      const sp = Math.hypot(nd.vx, nd.vy);
      if (sp > 14) {
        nd.vx *= 14 / sp;
        nd.vy *= 14 / sp;
      }
      nd.x += nd.vx;
      nd.y += nd.vy;
    }
  }

  // ── rendering ─────────────────────────────────────────────────────

  private draw() {
    const ctx = this.ctx;
    if (!ctx) return;

    const { w, h } = this.css;
    const v = this.view;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2 + v.panX, h / 2 + v.panY);
    ctx.scale(v.scale, v.scale);

    const activeId = this.hoveredId ?? (this.layout === "orbit" ? this.focusId : this.selectedId);
    const nbSet = activeId ? new Set((this.adj[activeId] ?? []).map((x) => x.node.id)) : null;
    const gf = this.highlightGenre;

    // Bonds
    ctx.lineCap = "round";
    for (const e of this.edges) {
      const strong = activeId != null && (e.a.id === activeId || e.b.id === activeId);
      let alpha: number;
      let lw: number;

      if (strong) {
        alpha = 0.95;
        lw = 2.2 + (e.weight / this.maxWeight) * 3;
      } else if (activeId) {
        alpha = 0.05;
        lw = 1;
      } else if (gf) {
        const inGenre = e.a.book.genre === gf || e.b.book.genre === gf;
        alpha = inGenre ? 0.55 : 0.04;
        lw = 1.4 + (e.weight / this.maxWeight) * 1.4;
      } else {
        alpha = 0.2;
        lw = 1.1 + (e.weight / this.maxWeight) * 1.5;
      }

      if (alpha <= 0.02) continue;
      ctx.strokeStyle = INK;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const showAllLabels = v.scale > 1.5;

    for (const nd of this.nodes) {
      let alpha: number;
      if (gf) alpha = nd.book.genre === gf ? 1 : 0.22;
      else if (activeId) alpha = nd.id === activeId || nbSet?.has(nd.id) ? 1 : 0.24;
      else alpha = 1;

      const isActive = nd.id === activeId;
      ctx.globalAlpha = alpha;

      if (this.hardShadow) {
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(nd.x + 4, nd.y + 5, nd.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = nd.color;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = isActive ? 3.5 : 2;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
      ctx.stroke();

      // Nucleus
      ctx.fillStyle = textOn(nd.color);
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, Math.max(3, nd.r * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // Selection: rotating dashed ring
      if (nd.id === this.selectedId) {
        ctx.save();
        ctx.translate(nd.x, nd.y);
        ctx.rotate(this.prefersReducedMotion ? 0 : this.t * 0.018);
        ctx.setLineDash([7, 8]);
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = INK;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(0, 0, nd.r + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.setLineDash([]);
      }

      const showLabel =
        isActive ||
        nbSet?.has(nd.id) ||
        nd.id === this.selectedId ||
        showAllLabels ||
        (gf != null && nd.book.genre === gf);
      if (showLabel) this.drawLabel(ctx, nd, alpha);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawLabel(ctx: CanvasRenderingContext2D, nd: GraphNode, alpha: number) {
    const title = nd.book.title.length > 26 ? `${nd.book.title.slice(0, 24)}…` : nd.book.title;
    ctx.font = this.labelFont;
    const tw = ctx.measureText(title).width;
    const px = nd.x;
    const py = nd.y + nd.r + 15;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(px - tw / 2 - 8, py - 11, tw + 16, 20, 6);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, px, py - 0.5);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  // ── pointer interaction ───────────────────────────────────────────

  private toWorld(e: { clientX: number; clientY: number }) {
    const rect = this.canvas!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const v = this.view;
    return {
      sx,
      sy,
      wx: (sx - (rect.width / 2 + v.panX)) / v.scale,
      wy: (sy - (rect.height / 2 + v.panY)) / v.scale,
      rw: rect.width,
      rh: rect.height,
    };
  }

  private pickNode(wx: number, wy: number): GraphNode | null {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const nd = this.nodes[i];
      if (Math.hypot(wx - nd.x, wy - nd.y) <= nd.r + 5) return nd;
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.canvas) return;
    const p = this.toWorld(e);
    const nd = this.pickNode(p.wx, p.wy);
    this.down = {
      sx: p.sx,
      sy: p.sy,
      moved: false,
      node: nd ?? undefined,
      panX: this.view.panX,
      panY: this.view.panY,
    };
    if (nd) {
      if (this.layout === "web") this.dragNode = nd;
    } else {
      this.isPanning = true;
    }
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.canvas) return;
    const p = this.toWorld(e);

    if (this.down) {
      if (Math.hypot(p.sx - this.down.sx, p.sy - this.down.sy) > 4) this.down.moved = true;
      if (this.dragNode) {
        this.dragNode.x = p.wx;
        this.dragNode.y = p.wy;
        this.dragNode.vx = 0;
        this.dragNode.vy = 0;
      } else if (this.isPanning) {
        const v = this.view;
        v.panX = this.down.panX + (p.sx - this.down.sx);
        v.panY = this.down.panY + (p.sy - this.down.sy);
        v.tPanX = v.panX;
        v.tPanY = v.panY;
      }
      return;
    }

    const nd = this.pickNode(p.wx, p.wy);
    const id = nd?.id ?? null;
    if (id !== this.hoveredId) {
      this.hoveredId = id;
      this.canvas.style.cursor = nd ? "pointer" : "grab";
      this.opts.onHover?.(id);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.down) {
      if (this.down.node && !this.down.moved) {
        this.select(this.down.node.id);
        this.opts.onSelect?.(this.down.node.id);
      } else if (!this.down.node && !this.down.moved && this.selectedId) {
        this.select(null);
        this.opts.onSelect?.(null);
      }
    }
    this.dragNode = null;
    this.isPanning = false;
    this.down = null;
    if (this.canvas) {
      this.canvas.style.cursor = "grab";
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const p = this.toWorld(e);
    const v = this.view;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const ns = Math.max(0.4, Math.min(3.4, v.scale * factor));
    const wx = (p.sx - (p.rw / 2 + v.panX)) / v.scale;
    const wy = (p.sy - (p.rh / 2 + v.panY)) / v.scale;
    v.scale = ns;
    v.tScale = ns;
    v.panX = p.sx - p.rw / 2 - wx * ns;
    v.tPanX = v.panX;
    v.panY = p.sy - p.rh / 2 - wy * ns;
    v.tPanY = v.panY;
  };

  // ── public API ────────────────────────────────────────────────────

  mount(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";

    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const family = getComputedStyle(canvas).fontFamily;
    if (family) this.labelFont = `700 11px ${family}`;

    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    const loop = () => {
      this.tick();
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private onPointerLeave = () => {
    if (this.down) return;
    if (this.hoveredId !== null) {
      this.hoveredId = null;
      this.opts.onHover?.(null);
    }
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    const c = this.canvas;
    if (!c) return;
    c.removeEventListener("pointerdown", this.onPointerDown);
    c.removeEventListener("pointermove", this.onPointerMove);
    c.removeEventListener("pointerup", this.onPointerUp);
    c.removeEventListener("pointercancel", this.onPointerUp);
    c.removeEventListener("pointerleave", this.onPointerLeave);
    c.removeEventListener("wheel", this.onWheel);
    this.canvas = null;
    this.ctx = null;
  }

  resize() {
    const c = this.canvas;
    if (!c) return;
    const w = c.clientWidth || 1;
    const h = c.clientHeight || 1;
    this.dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * this.dpr);
    c.height = Math.round(h * this.dpr);
    this.css = { w, h };
  }

  setLayout(mode: Layout) {
    if (mode === this.layout) return;
    this.layout = mode;
    if (mode === "orbit") {
      const fid = this.selectedId ?? this.focusId ?? this.nodes[0]?.id;
      if (fid) {
        this.focusId = fid;
        this.computeOrbitTargets(fid);
      }
    } else {
      // A small kick stops the web from re-settling into the identical shape.
      for (const nd of this.nodes) {
        nd.vx = (Math.random() - 0.5) * 2;
        nd.vy = (Math.random() - 0.5) * 2;
      }
    }
    const v = this.view;
    v.tScale = 0.82;
    v.tPanX = 0;
    v.tPanY = 0;
  }

  setHighlightGenre(genre: string | null) {
    this.highlightGenre = genre;
  }

  setNodeSizeBy(by: NodeSizeBy) {
    if (by === this.nodeSizeBy) return;
    this.nodeSizeBy = by;
    this.computeRadii();
  }

  /** Select a node and bring it into view. Does not fire onSelect. */
  select(id: string | null) {
    this.selectedId = id;
    if (!id) return;
    const nd = this.nodeById[id];
    if (!nd) return;
    if (this.layout === "orbit") {
      this.focusId = id;
      this.computeOrbitTargets(id);
    } else {
      const v = this.view;
      v.tScale = Math.max(v.scale, 1.05);
      v.tPanX = -nd.x * v.tScale;
      v.tPanY = -nd.y * v.tScale;
    }
  }

  zoomBy(factor: number) {
    const v = this.view;
    v.tScale = Math.max(0.4, Math.min(3.4, v.tScale * factor));
  }

  resetView() {
    const v = this.view;
    v.tScale = 0.82;
    v.tPanX = 0;
    v.tPanY = 0;
  }

  neighboursOf(id: string): Neighbour[] {
    return (this.adj[id] ?? []).slice().sort((a, b) => b.weight - a.weight);
  }

  get stats() {
    return { nodeCount: this.nodes.length, linkCount: this.edges.length };
  }
}

/** Small deterministic string hash, used to seed reproducible start positions. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295 * Math.PI * 2;
}
