# Semantica — frontend

Next.js 16 (App Router) + Tailwind CSS v4.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

> Don't run `npm run build` while `npm run dev` is running against the same
> checkout — they share `.next/` and the dev server will start serving stale
> assets. Stop the dev server first, or build from a separate copy.

---

## Environment

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Semantica FastAPI backend | No — falls back to `http://localhost:8000` |
| `NEXT_PUBLIC_TRENDING_API_URL` | Trending-books API gateway | No — falls back to the main API |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, used for OG tags, `robots.txt`, `sitemap.xml` | Recommended in production |

The API's CORS allowlist must include whichever origin the frontend is served
from, or every authenticated call is blocked by the browser.

---

## Degrading without a backend

Every user-facing screen works with the FastAPI backend unreachable. `src/lib/api.ts`
falls back to the public Open Library API for search and book detail, and to a
`localStorage` shelf for saved books. Requests to our own API get a short (3s)
timeout so a dead backend fails fast; Open Library gets a long one (20s) because
its subject searches are genuinely slow.

What needs the backend: semantic (embedding) search, Emotional DNA, chunk
visualisations, soundtracks, and real accounts. Each of those degrades to an
explicit empty state rather than fabricated content.

---

## Routes

| Route | What it is |
|---|---|
| `/` | Marketing landing page |
| `/login`, `/signup` | Auth |
| `/onboarding` | Six-step reading-profile builder (persisted to `localStorage`) |
| `/home` | Browse — Reading DNA, picks, trending, shelf |
| `/library` | Saved books |
| `/books/[id]` | Book detail — accepts an ingested book id or an Open Library work key |
| `/profile` | Reading profile + saved books + sign out |
| `/scroll`, `/map`, `/soundtracks` | Gated behind Coming Soon until real data backs them |
| `/internal/chunk-explorer` | Internal tooling — `noindex`, not in the nav |

`src/app/map/_prototype/` holds the working pan/zoom map canvas. It's inside a
private (`_`-prefixed) folder so the App Router ignores it; it ships once the
clustering endpoint can supply real coordinates.

---

## Design system

The neo-brutalist primitives live in `src/app/globals.css` as Tailwind v4
`@utility` rules — use these rather than re-typing arbitrary values:

| Utility | Effect |
|---|---|
| `edge` / `edge-thin` | Hard black outline (2px / 1px, inset) |
| `pop` / `pop-lg` / `pop-sm` | Offset drop shadow (4px / 8px / 2px) |
| `press` | Hover/active "presses into its own shadow", with a disabled state |
| `rail` | Horizontal scroll container with hidden scrollbars |

Brand colours are CSS variables (`--brand`, `--brand-strong`, `--brand-soft`,
`--ink`) exposed to Tailwind as `bg-brand`, `text-brand-strong`, etc.

---

## Known lint state

`npm run lint` reports 11 `react-hooks/set-state-in-effect` errors. These are
on-mount hydration effects (reading `localStorage` / fetching into state) that
predate the rule; the build is unaffected. Migrating them to
`useSyncExternalStore` is tracked separately.
