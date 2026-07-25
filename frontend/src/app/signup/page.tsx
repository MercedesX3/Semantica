"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Logo from "@/components/Logo";
import Btn from "@/components/ui/Btn";
import { registerUser } from "@/lib/api";

export default function Signup() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await registerUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // The backend creates the HttpOnly authentication cookie.
      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col px-16 py-12">
        <Logo size={40} />

        <div className="flex-1 flex flex-col justify-center max-w-md mt-10">
          <h1 className="text-4xl font-bold font-sans mb-8">
            Sign up for Semantica
          </h1>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="first-name"
                  className="text-base font-semibold font-sans"
                >
                  First name*
                </label>

                <input
                  id="first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="first name"
                  className="h-12 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black text-base font-semibold font-sans placeholder:text-black/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="last-name"
                  className="text-base font-semibold font-sans"
                >
                  Last name*
                </label>

                <input
                  id="last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="last name"
                  className="h-12 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black text-base font-semibold font-sans placeholder:text-black/30"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-base font-semibold font-sans"
              >
                Email*
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                className="h-12 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black text-base font-semibold font-sans placeholder:text-black/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-base font-semibold font-sans"
              >
                Password*
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="h-12 px-4 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-2 -outline-offset-2 outline-black text-base font-semibold font-sans placeholder:text-black/30"
              />

              <p className="text-sm font-medium text-zinc-500">
                Use at least 8 characters.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm font-semibold text-red-600"
              >
                {error}
              </p>
            )}

            <Btn
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Btn>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-300" />

              <span className="text-sm font-semibold font-sans text-zinc-400">
                OR
              </span>

              <div className="flex-1 h-px bg-zinc-300" />
            </div>

            <Btn
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Sign up with Google
            </Btn>

            <Btn
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Sign up with ____
            </Btn>
          </form>

          <p className="mt-8 text-base font-sans">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      <div className="w-[42%] bg-neutral-200 shrink-0" />
    </div>
  );
}