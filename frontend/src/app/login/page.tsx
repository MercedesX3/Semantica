"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Auth is not implemented yet — proceed straight to the app.
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-serif italic text-2xl font-bold text-zinc-900">Welcome back</h1>
            <p className="text-sm text-zinc-500 mt-1">Log in to continue to Semantica</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Log In
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-zinc-900 hover:underline">
              Get Started
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
