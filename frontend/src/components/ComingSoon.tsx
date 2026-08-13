import Link from "next/link";

/**
 * Honest placeholder for a screen that is designed but not yet backed by
 * real data. Preferable to shipping a page full of invented books.
 */
export default function ComingSoon({
  eyebrow,
  title,
  body,
  bullets = [],
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl bg-white edge pop-lg p-8 sm:p-10 flex flex-col gap-5">
        <span className="inline-flex self-start items-center gap-2 h-8 px-4 rounded-md bg-amber-400 edge pop-sm text-xs font-mono uppercase tracking-wider text-black">
          <span className="w-2 h-2 rounded-full bg-black" aria-hidden />
          {eyebrow}
        </span>

        <h1 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight leading-tight">
          {title}
        </h1>

        <p className="text-base font-semibold text-zinc-600 leading-relaxed">{body}</p>

        {bullets.length > 0 && (
          <ul className="flex flex-col gap-2">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 w-2 h-2 rounded-full bg-brand shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-zinc-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/home"
            className="h-11 px-6 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
          >
            Back to Browse
          </Link>
          <Link
            href="/library"
            className="h-11 px-6 rounded-lg bg-white text-black edge pop press inline-flex items-center text-base font-semibold font-sans"
          >
            Open my library
          </Link>
        </div>
      </div>
    </main>
  );
}
