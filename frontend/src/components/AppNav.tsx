"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import Logo from "./Logo";

const NAV_LINKS = [
  { label: "Browse", href: "/home" },
  { label: "Book Scroll", href: "/home#scroll" },
  { label: "Map", href: "/map" },
  { label: "Library", href: "/home#library" },
  { label: "Soundtracks", href: "/soundtracks" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-white outline outline-2 outline-offset-[-2px] outline-black px-6 py-2.5 flex items-center justify-between shrink-0">
      <Link href="/home" aria-label="Home">
        <Logo size={32} />
      </Link>

      <nav className="flex items-center gap-8">
        {NAV_LINKS.map(({ label, href }) => {
          const base = href.split("#")[0];
          const active = pathname === base;
          return (
            <Link
              key={label}
              href={href}
              className={`text-lg font-semibold font-sans text-black ${active ? "underline" : ""}`}
            >
              {label}
            </Link>
          );
        })}

        <button aria-label="Search" className="p-1">
          <Search className="w-5 h-5 text-black" />
        </button>

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
      </nav>
    </header>
  );
}
