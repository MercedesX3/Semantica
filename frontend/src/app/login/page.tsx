"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/api";
import { cacheUser } from "@/lib/session";
import AuthLayout from "@/components/AuthLayout";
import Btn from "@/components/ui/Btn";

const FIELD =
  "h-12 px-4 bg-stone-50 rounded-lg edge pop text-base font-semibold font-sans placeholder:text-black/30";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const user = await loginUser({ email, password });
      cacheUser(user);

      // Return people to wherever the auth gate interrupted them.
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/home");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate={false}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-base font-semibold font-sans">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-base font-semibold font-sans">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          className={FIELD}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 border-2 border-red-500 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <Btn type="submit" variant="primary" size="lg" className="w-full mt-1" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Btn>
    </form>
  );
}

export default function Login() {
  return (
    <AuthLayout
      title="Sign in to Semantica"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold underline decoration-2 underline-offset-4 decoration-brand">
            Create one
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-base font-semibold text-zinc-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
