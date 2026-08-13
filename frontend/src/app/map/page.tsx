"use client";

import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";

// Canvas-only component with no server-rendered output — skip SSR so the
// engine never touches `window` during prerender.
const BookMap = dynamic(() => import("@/components/map/BookMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-background">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
        Plotting the genome…
      </p>
    </div>
  ),
});

export default function MapPage() {
  return (
    <AppShell fixedHeight>
      <BookMap />
    </AppShell>
  );
}
