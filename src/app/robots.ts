import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://xn--80aapko5acgl.xn--p1ai"; // алирасерт.рф

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/_next/*",
        "/api/*",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
