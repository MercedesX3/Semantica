"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function BookScrollPage() {
  return (
    <AppShell>
      <ComingSoon
        eyebrow="In development"
        title="Book Scroll"
        body="A vertical feed of single passages — one page at a time, swipe to keep or skip. We're tuning how passages get chosen before we put it in front of readers."
        bullets={[
          "One striking passage per card, pulled from the book itself",
          "Swipe right to save the book to your library, left to move on",
          "Every swipe feeds back into your reading profile",
        ]}
      />
    </AppShell>
  );
}
