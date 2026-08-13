"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

interface LoadingScreenProps {
  onComplete: () => void;
  displayMs?: number;
  exitDurationMs?: number;
}

/**
 * Brand splash on first landing-page visit only. It used to run for three
 * seconds on every single visit, which is a long time to withhold a page
 * from someone who already knows what the site is.
 */
export default function LoadingScreen({
  onComplete,
  displayMs = 1200,
  exitDurationMs = 500,
}: LoadingScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), displayMs);
    const removeTimer = setTimeout(onComplete, displayMs + exitDurationMs);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [displayMs, exitDurationMs, onComplete]);

  return (
    <div
      aria-hidden
      style={{ transitionDuration: `${exitDurationMs}ms` }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-linear-to-b from-fuchsia-600 via-pink-400 to-orange-200 ease-in-out transition-all ${
        exiting ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="animate-[spin_2.4s_linear_infinite]">
          <LogoMark size={64} />
        </div>
        <span className="font-sans font-bold text-3xl sm:text-4xl text-white tracking-[0.3em] pl-[0.3em]">
          SEMANTICA
        </span>
      </div>
    </div>
  );
}
