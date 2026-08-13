import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your reading profile and saved books.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
