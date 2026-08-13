import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Internal tooling and per-user screens have nothing to index.
      disallow: ["/internal/", "/profile", "/onboarding"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://semantica.app"}/sitemap.xml`,
  };
}
