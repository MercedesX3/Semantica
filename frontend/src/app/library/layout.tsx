import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your library",
  description: "Every book you've saved to your Semantica shelf.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
