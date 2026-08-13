"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/api";
import { cacheUser } from "@/lib/session";
import AuthLayout from "@/components/AuthLayout";
import Btn from "@/components/ui/Btn";

const FIELD =
  "h-12 px-4 bg-stone-50 rounded-lg edge pop text-base font-semibold font-sans placeholder:text-black/30";

export default function Signup() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const user = await registerUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      cacheUser(user);

      // The backend creates the HttpOnly authentication cookie.
      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold underline decoration-2 underline-offset-4 decoration-brand">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="first-name" className="text-base font-semibold font-sans">
              First name
            </label>
            <input
              id="first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ada"
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="last-name" className="text-base font-semibold font-sans">
              Last name
            </label>
            <input
              id="last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Lovelace"
              className={FIELD}
            />
          </div>
        </div>

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
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            aria-describedby="password-hint"
            className={FIELD}
          />
          <p id="password-hint" className="text-sm font-medium text-zinc-500">
            Use at least 8 characters.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm font-semibold text-red-600 bg-red-50 border-2 border-red-500 px-3 py-2 rounded-md"
          >
            {error}
          </p>
        )}

        <Btn type="submit" variant="primary" size="lg" className="w-full mt-1" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Btn>

        <p className="text-sm font-medium text-zinc-500">
          Next you&apos;ll answer six quick questions so we can build your reading profile.
        </p>
      </form>
    </AuthLayout>
  );
}
