"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-8 pt-4">
      <div className="mx-auto max-w-6xl bg-stone-50 edge pop">
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Semantica home">
            <Logo size={30} withWordmark />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-base font-semibold font-sans hover:text-brand-strong transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-base font-semibold font-sans hover:text-brand-strong transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="h-10 px-5 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-1.5 cursor-pointer"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t-2 border-black px-4 py-4 flex flex-col gap-4">
            {LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="text-base font-semibold font-sans"
              >
                {label}
              </a>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/login"
                className="h-10 px-5 rounded-lg bg-white text-black edge pop press inline-flex items-center text-base font-semibold font-sans"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="h-10 px-5 rounded-lg bg-brand text-white edge pop press inline-flex items-center text-base font-semibold font-sans"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
