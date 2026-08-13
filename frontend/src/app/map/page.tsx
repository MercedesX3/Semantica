"use client";

import AppShell from "@/components/AppShell";
import ComingSoon from "@/components/ComingSoon";

export default function MapPage() {
  return (
    <AppShell>
      <ComingSoon
        eyebrow="In development"
        title="The Book Map"
        body="Every book Semantica has read, plotted by meaning rather than genre — so neighbouring books actually feel alike. The canvas is built; we're waiting on real clustering coordinates before we show it, rather than plotting books we've made up."
        bullets={[
          "Books positioned by their embedding, clustered into named regions",
          "Zoom from “dystopian” down to “slow-burning longing”",
          "Pick any book to see the shared DNA behind each neighbour",
        ]}
      />
    </AppShell>
  );
}
