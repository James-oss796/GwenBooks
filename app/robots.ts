import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/library", "/books/search"],
      disallow: ["/admin/", "/my-profile", "/users/", "/read/", "/api/"],
    },
    sitemap: "https://gwen-books.vercel.app/sitemap.xml",
    host: "https://gwen-books.vercel.app",
  };
}
