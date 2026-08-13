import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Soundtracks",
  description: "Chapter-synced playlists built from a book's emotional DNA.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
