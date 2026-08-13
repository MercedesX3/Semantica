"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X, Menu } from "lucide-react";
import { LogoMark } from "./Logo";
import BookSearch from "./BookSearch";
import { initials, readCachedUser } from "@/lib/session";
import type { User } from "@/lib/api";

export const NAV_LINKS = [
  { label: "Browse", href: "/home" },
  { label: "Library", href: "/library" },
  { label: "Book Scroll", href: "/scroll", soon: true },
  { label: "Map", href: "/map", soon: true },
  { label: "Soundtracks", href: "/soundtracks", soon: true },
];

export default function AppNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => setUser(readCachedUser()), []);

  // Close the mobile menu whenever we land on a new route.
  useEffect(() => setMenuOpen(false), [pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="w-full bg-stone-50 edge px-3 sm:px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 relative z-30">
      <Link href="/home" aria-label="Semantica home" className="shrink-0 inline-flex items-center gap-2">
        <LogoMark size={30} />
        {/* Wordmark drops away on small screens so the nav controls keep room */}
        <span className="hidden sm:inline font-sans font-bold text-xl tracking-tight">Semantica</span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center gap-6 xl:gap-8 min-w-0">
        {NAV_LINKS.map(({ label, href, soon }) => (
          <Link
            key={label}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`text-base xl:text-lg font-semibold font-sans whitespace-nowrap inline-flex items-center gap-1.5 hover:text-brand-strong transition-colors ${
              isActive(href) ? "underline decoration-2 underline-offset-4 decoration-brand" : ""
            }`}
          >
            {label}
            {soon && (
              <span className="text-[0.6rem] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-300 border border-black text-black">
                soon
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          aria-label={searchOpen ? "Close search" : "Search books"}
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((v) => !v)}
          className={`p-2 rounded-md transition-colors cursor-pointer ${
            searchOpen ? "text-brand-strong bg-white edge" : "text-black hover:bg-black/5"
          }`}
        >
          {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>

        <Link
          href="/profile"
          className="h-9 w-9 bg-brand rounded-md edge inline-flex items-center justify-center text-white text-sm font-bold font-sans"
          aria-label="Your profile"
        >
          {initials(user)}
        </Link>

        <button
          type="button"
          className="lg:hidden p-2 rounded-md hover:bg-black/5 cursor-pointer"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Search drawer — full width so results have room on every breakpoint */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-stone-50 border-x-2 border-b-2 border-black px-3 sm:px-4 py-3 z-30">
          <div className="max-w-xl">
            <BookSearch autoFocus placeholder="Search books…" onNavigate={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav className="lg:hidden absolute top-full left-0 right-0 bg-stone-50 border-x-2 border-b-2 border-black px-3 sm:px-4 py-3 flex flex-col z-20">
          {NAV_LINKS.map(({ label, href, soon }) => (
            <Link
              key={label}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`py-2.5 text-base font-semibold font-sans inline-flex items-center gap-2 ${
                isActive(href) ? "text-brand-strong" : ""
              }`}
            >
              {label}
              {soon && (
                <span className="text-[0.6rem] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-300 border border-black text-black">
                  soon
                </span>
              )}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
