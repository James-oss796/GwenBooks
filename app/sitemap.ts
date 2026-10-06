import type { MetadataRoute } from "next";

const site = "https://gwen-books.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/library`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/books/search`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
