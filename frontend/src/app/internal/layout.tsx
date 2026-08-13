import type { Metadata } from "next";

/**
 * Internal tooling (chunk explorer, book ingestion). Not part of the product
 * surface — kept out of search indexes and off the main nav.
 */
export const metadata: Metadata = {
  title: "Internal tools",
  robots: { index: false, follow: false, nocache: true },
};

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
