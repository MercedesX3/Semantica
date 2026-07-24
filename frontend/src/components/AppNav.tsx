"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import Logo from "./Logo";

const NAV_LINKS = [
  { label: "Browse", href: "/home" },
  { label: "Book Scroll", href: "/scroll" },
  { label: "Map", href: "/map" },
  { label: "Library", href: "/library" },
  { label: "Soundtracks", href: "/soundtracks" },
];

export default function AppNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="w-full bg-stone-50 outline outline-2 outline-offset-[-2px] outline-black p-2.5 flex items-center justify-between shrink-0">

      {/* Logo */}
      <Link href="/home" aria-label="Home">
        <Logo size={32} />
      </Link>

      {/* Right group */}
      <div className="flex items-center gap-8">

        {/* Nav links — collapse when search is open */}
        <nav
          className="flex items-center gap-8 overflow-hidden"
          style={{
            maxWidth: searchOpen ? 0 : 600,
            opacity: searchOpen ? 0 : 1,
            pointerEvents: searchOpen ? "none" : "auto",
            transition: "max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
          }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const base = href.split("#")[0];
            const active = pathname === base || (base !== "/home" && pathname.startsWith(base + "/"));
            return (
              <Link
                key={label}
                href={href}
                className={`text-lg font-semibold font-sans text-black whitespace-nowrap ${active ? "underline decoration-2 underline-offset-4" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Expanding search input */}
        <div
          className="overflow-hidden"
          style={{
            width: searchOpen ? 240 : 0,
            opacity: searchOpen ? 1 : 0,
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
          }}
        >
          <div className="flex items-center gap-2 bg-white outline outline-2 outline-offset-[-2px] outline-black px-3 h-9 w-60">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search books..."
              className="bg-transparent outline-none text-base font-semibold font-sans placeholder:text-black/40 flex-1 min-w-0"
            />
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="shrink-0 text-black/40 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search icon toggle */}
        <button
          aria-label={searchOpen ? "Close search" : "Open search"}
          onClick={() => setSearchOpen((v) => !v)}
          className={`p-1 transition-colors duration-200 ${searchOpen ? "text-pink-500" : "text-black"}`}
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Profile */}
        <Link
          href="/profile"
          className="p-1 bg-pink-400 rounded-sm inline-flex items-center justify-center"
          aria-label="Profile"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="2" width="14" height="18" rx="1" stroke="white" strokeWidth="2" />
            <circle cx="10" cy="8" r="2.5" stroke="white" strokeWidth="1.5" />
            <path d="M5.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>

      </div>
    </header>
  );
}
