"use client";

import { X } from "lucide-react";
import { GENE_MEANINGS, GenomeBook } from "@/lib/bookGenome";
import { textOn, Neighbour } from "@/lib/bookGraph";

/**
 * Slide-in panel for the selected book: its genome, and the books it bonds to.
 */
export default function BookDetailPanel({
  book,
  color,
  neighbours,
  onClose,
  onSelect,
}: {
  book: GenomeBook;
  color: string;
  neighbours: Neighbour[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const headerText = textOn(color);

  return (
    <aside
      // Bottom sheet on small screens, right-hand rail from md up.
      className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 flex max-h-[72%] flex-col overflow-hidden rounded-lg bg-stone-50 edge pop-lg motion-safe:animate-[panelIn_.22s_ease-out] md:inset-x-auto md:right-4 md:top-4 md:bottom-4 md:max-h-none md:w-[22rem]"
      aria-label={`Details for ${book.title}`}
    >
      <header
        className="shrink-0 border-b-2 border-black p-5"
        style={{ backgroundColor: color }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          {/* Neutral rather than a GenreTag: the header is already the genre
              colour, so a same-colour chip would sit invisibly on top of it. */}
          <span className="inline-flex h-8 items-center rounded-md bg-white px-4 font-mono text-sm font-semibold edge pop-sm">
            {book.genre}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-white text-black edge pop-sm press"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>

        <h2
          className="font-sans text-3xl font-bold leading-[1.05] tracking-tight text-balance"
          style={{ color: headerText }}
        >
          {book.title}
        </h2>
        <p className="mt-2 font-sans text-sm font-semibold opacity-80" style={{ color: headerText }}>
          {book.author}
        </p>
        <p
          className="mt-3 font-mono text-[0.65rem] font-bold uppercase tracking-wider opacity-75"
          style={{ color: headerText }}
        >
          {book.year} &nbsp;/&nbsp; {book.pages} pages &nbsp;/&nbsp; {book.genes.length} genes
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="py-5 font-sans text-base font-semibold leading-relaxed text-zinc-700">
          {book.blurb}
        </p>

        <SectionHeading>The genome</SectionHeading>
        <ul className="mb-7 flex flex-wrap gap-2">
          {book.genes.map((gene) => (
            <li key={gene}>
              <span
                title={GENE_MEANINGS[gene] ?? gene}
                className="inline-flex h-8 cursor-help items-center rounded-md bg-white px-4 font-mono text-sm font-semibold edge pop-sm"
              >
                {gene}
              </span>
            </li>
          ))}
        </ul>

        <SectionHeading>
          Shared DNA {neighbours.length > 0 && `(${neighbours.length})`}
        </SectionHeading>

        {neighbours.length === 0 ? (
          <p className="font-sans text-sm font-semibold text-zinc-600">
            No strong bonds at the current threshold — this one sits on its own.
          </p>
        ) : (
          <ul>
            {neighbours.map(({ node, shared, sameAuthor }) => (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => onSelect(node.id)}
                  className="mb-3 block w-full cursor-pointer rounded-md bg-white p-3 text-left edge pop-sm press"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-black"
                      style={{ backgroundColor: node.color }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm font-bold">
                        {node.book.title}
                      </span>
                      <span className="block truncate font-sans text-xs font-semibold text-zinc-600">
                        {node.book.author}
                      </span>
                    </span>
                  </span>

                  <span className="mt-2.5 flex flex-wrap gap-1.5">
                    {shared.slice(0, 4).map((gene) => (
                      <span
                        key={gene}
                        className="rounded border border-black bg-stone-50 px-2 py-0.5 font-mono text-[0.65rem] font-semibold"
                      >
                        {gene}
                      </span>
                    ))}
                    {sameAuthor && (
                      <span className="rounded bg-brand px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-white">
                        same author
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h3 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-500">
        {children}
      </h3>
      <span className="h-px flex-1 bg-black/20" aria-hidden />
    </div>
  );
}
