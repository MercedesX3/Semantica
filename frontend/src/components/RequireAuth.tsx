"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resolveSession, SessionState } from "@/lib/session";

/**
 * Client-side gate for signed-in screens.
 *
 * A Next middleware guard isn't possible here: the auth cookie is HttpOnly and
 * set by the API on a different origin, so the edge runtime can't see it. The
 * backend remains the real enforcement point for data; this only stops signed
 * out visitors landing on an app screen that will never fill in.
 *
 * If the API is unreachable we deliberately let people through rather than
 * bouncing everyone to /login when the only thing that's wrong is the server.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void resolveSession().then((next) => {
      if (!cancelled) setSession(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [session.status, router, pathname]);

  if (session.status === "anonymous") {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <p className="text-base font-semibold font-sans text-zinc-500">Redirecting to sign in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
