import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Scroll",
  description: "A passage-at-a-time feed for finding your next read.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
