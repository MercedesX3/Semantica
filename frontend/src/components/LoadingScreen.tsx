"use client";

import { useEffect, useState } from "react";
import { RingLoader } from "react-spinners";

interface LoadingScreenProps {
  onComplete: () => void;
  displayMs?: number;
  exitDurationMs?: number;
}

export default function LoadingScreen({
  onComplete,
  displayMs = 3000,
  exitDurationMs = 700,
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
      style={{ transitionDuration: `${exitDurationMs}ms` }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-linear-to-b from-fuchsia-600 via-pink-400 to-orange-200 ease-in-out transition-all ${
        exiting ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="font-serif italic text-4xl text-white tracking-widest">
          SEMANTICA
        </span>

        <RingLoader color="#fff" size={60} />
      </div>
    </div>
  );
}
