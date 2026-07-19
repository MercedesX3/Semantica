"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import Btn from "@/components/ui/Btn";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/home");
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col px-16 py-12">
        <Logo size={40} />

        <div className="flex-1 flex flex-col justify-center max-w-md mt-10">
          <h1 className="text-4xl font-bold font-sans mb-8">Sign into Semantica</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-base font-semibold font-sans">Email*</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                className="h-12 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black text-base font-semibold font-sans placeholder:text-black/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-base font-semibold font-sans">Password*</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="h-12 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black text-base font-semibold font-sans placeholder:text-black/30"
              />
            </div>

            <Btn type="submit" variant="primary" size="lg" className="w-full mt-2">
              Sign In
            </Btn>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-300" />
              <span className="text-sm font-semibold font-sans text-zinc-400">OR</span>
              <div className="flex-1 h-px bg-zinc-300" />
            </div>

            <Btn type="button" variant="primary" size="lg" className="w-full">
              Sign In with Google
            </Btn>

            <Btn type="button" variant="primary" size="lg" className="w-full">
              Sign In with ____
            </Btn>
          </form>

          <p className="mt-8 text-base font-sans">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <div className="w-[42%] bg-neutral-200 shrink-0" />
    </div>
  );
}
