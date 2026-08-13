import Link from "next/link";
import Logo from "./Logo";

const QUOTES = [
  { mood: "Slow-burn longing", books: "Circe · Normal People · The Remains of the Day" },
  { mood: "Dread that builds", books: "Rebecca · The Haunting of Hill House" },
  { mood: "Quietly hopeful", books: "The Midnight Library · Klara and the Sun" },
];

/**
 * Two-pane auth chrome. The right pane used to be an empty grey rectangle;
 * it now previews the thing the product actually does — matching on mood.
 */
export default function AuthLayout({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-8 lg:py-12">
        <Link href="/" aria-label="Semantica home" className="self-start">
          <Logo size={34} withWordmark />
        </Link>

        <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto lg:mx-0 mt-8 lg:mt-10">
          <h1 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight mb-8">{title}</h1>
          {children}
          <div className="mt-8 text-base font-sans">{footer}</div>
        </div>
      </div>

      {/* Brand panel — hidden on small screens where it would only push the form down */}
      <aside className="hidden lg:flex w-[42%] shrink-0 bg-brand border-l-2 border-black flex-col justify-center gap-6 px-12">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/80">
          Matched on feeling, not genre
        </p>
        <p className="font-serif italic text-4xl xl:text-5xl text-white leading-tight">
          Books that sound like the one you couldn&apos;t put down.
        </p>

        <ul className="flex flex-col gap-3 mt-2">
          {QUOTES.map(({ mood, books }) => (
            <li key={mood} className="bg-white edge pop p-4">
              <p className="text-sm font-mono uppercase tracking-wider text-brand-strong mb-1">
                {mood}
              </p>
              <p className="text-sm font-semibold font-sans text-zinc-700">{books}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
