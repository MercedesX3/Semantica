import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="px-4 sm:px-8 pb-6 pt-16">
      <div className="mx-auto max-w-6xl bg-stone-50 edge pop">
        <div className="px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Logo size={28} withWordmark />
            <p className="text-sm font-semibold font-sans text-zinc-600 max-w-xs">
              Find your next book by how it makes you feel.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold font-sans">
            <Link href="/#how-it-works" className="hover:text-brand-strong transition-colors">
              How it works
            </Link>
            <Link href="/#features" className="hover:text-brand-strong transition-colors">
              Features
            </Link>
            <Link href="/login" className="hover:text-brand-strong transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-brand-strong transition-colors">
              Get started
            </Link>
          </nav>
        </div>

        <div className="border-t-2 border-black px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-600">
            &copy; {new Date().getFullYear()} Semantica
          </p>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-600">
            Book data from Open Library
          </p>
        </div>
      </div>
    </footer>
  );
}
