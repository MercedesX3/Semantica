import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Book Map",
  description: "Books plotted by meaning rather than genre.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
