import Link from "next/link";

export default function Header() {
  return (
    <header className="w-1/2 border border-zinc-200 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.06)] mt-6 mx-auto">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif italic text-xl font-bold text-zinc-900 tracking-tight">
          Semantica
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-600">
          <a href="/#features" className="hover:text-zinc-900 transition-colors font-semibold">
            Features
          </a>
          <a href="/#learn-more" className="hover:text-zinc-900 transition-colors font-semibold">
            Learn More
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors font-semibold"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 rounded-lg bg-linear-to-b from-[#FF6FAA] via-[#F05393] to-[#E1367C] text-white hover:opacity-90 transition-opacity font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
