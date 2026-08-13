import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse",
  description: "Book recommendations matched to your reading profile.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
