import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build your reading profile",
  description: "Six quick questions to teach Semantica how you read.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
