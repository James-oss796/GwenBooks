"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import { Download, Loader2, AlertTriangle } from "lucide-react";

interface BookNotFoundProps {
book: {
id: string | number;
title: string;
author?: string;
coverUrl?: string;
source: "gutenberg" | "openlibrary" | "internetarchive" | "google";
downloadLinks?: {
format: string;
url: string;
}[];
};
}

export default function BookNotFound({ book }: BookNotFoundProps) {
const [downloading, setDownloading] = useState(false);
const [progress, setProgress] = useState(0);
const [links, setLinks] = useState(book.downloadLinks || []);
const [loadingLinks, setLoadingLinks] = useState(false);

// --- Auto-attempt to find missing download links ---
useEffect(() => {
async function fetchFallbackLinks() {
if (links.length || !book.title) return;
setLoadingLinks(true);
try {
const query = encodeURIComponent(book.title.trim());
const sources = [
'https://gutendex.com/books?search=${query}',
'https://openlibrary.org/search.json?title=${query}',
'https://archive.org/advancedsearch.php?q=${query}&output=json',
];

    const responses = await Promise.allSettled(
      sources.map((url) => fetch(url).then((r) => r.json()))
    );

    const foundLinks: { format: string; url: string }[] = [];

    // --- Gutenberg ---
    const gutenberg = responses[0].status === "fulfilled" ? responses[0].value : null;
    if (gutenberg?.results?.length) {
      const match = gutenberg.results[0];
      if (match.formats["application/pdf"]) {
        foundLinks.push({ format: "PDF", url: match.formats["application/pdf"] });
      } else if (match.formats["text/plain"]) {
        foundLinks.push({ format: "TXT", url: match.formats["text/plain"] });
      }
    }

    // --- OpenLibrary ---
    const openlib = responses[1].status === "fulfilled" ? responses[1].value : null;
    if (openlib?.docs?.length) {
      const doc = openlib.docs[0];
      if (doc.ebook_access === "public" && doc.key) {
        foundLinks.push({
          format: "OL_READ",
          url: `https://openlibrary.org${doc.key}`,
        });
      }
    }

    // --- Internet Archive ---
    const archive = responses[2].status === "fulfilled" ? responses[2].value : null;
    if (archive?.response?.docs?.length) {
      const doc = archive.response.docs[0];
      if (doc.identifier) {
        foundLinks.push({
          format: "IA",
          url: `https://archive.org/download/${doc.identifier}`,
        });
      }
    }

    if (foundLinks.length) setLinks(foundLinks);
  } catch (e) {
    console.warn("Fallback link search failed", e);
  } finally {
    setLoadingLinks(false);
  }
}

fetchFallbackLinks();


}, [book.title, links.length]);

async function handleDownload(url: string, format: string) {
try {
setDownloading(true);
setProgress(10);

  const response = await fetch(url);
  const blob = await response.blob();

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${book.title}.${format.toLowerCase()}`;
  link.click();

  // Simulate progress
  let fakeProgress = 10;
  const interval = setInterval(() => {
    fakeProgress += 10;
    setProgress(fakeProgress);
    if (fakeProgress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        setDownloading(false);
        setProgress(0);
      }, 600);
    }
  }, 150);
} catch (error) {
  console.error("Download failed:", error);
  setDownloading(false);
}


}

return (
<div className="root-container flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-b from-dark-800 to-dark-950">
{/* Header Section */}
<motion.div
className="flex flex-col items-center"
initial={{ opacity: 0, y: -30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
>
<AlertTriangle className="text-red-500 w-10 h-10 mb-4" />
<h1 className="text-white text-3xl font-bold">Book Not Found</h1>
<p className="text-light-200 mt-2 max-w-md">
We couldn’t open this book for reading. It might be restricted or missing,
but you can still try downloading it below.
</p>
</motion.div>

  {/* Book Card Section */}
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="mt-12 w-full flex justify-center"
  >
    <ul className="book-list justify-center">
      <BookCard
        id={book.id}
        title={book.title || "Unknown Title"}
        author={book.author || "Unknown Author"}
        coverUrl={
          book.coverUrl ||
          `/api/placeholder/cover?title=${encodeURIComponent(book.title)}`
        }
        source={book.source}
      />
    </ul>
  </motion.div>

  {/* Download Section */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="mt-10 flex flex-col gap-4 items-center w-full max-w-sm"
  >
    {loadingLinks ? (
      <p className="text-light-200 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Searching for available links...
      </p>
    ) : links.length ? (
      links.map((link) => (
        <Button
          key={link.format}
          onClick={() => handleDownload(link.url, link.format)}
          disabled={downloading}
          className="bg-primary text-dark-100 hover:bg-primary/90 w-full flex items-center justify-center gap-2 font-bold shadow-md"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading
            ? "Downloading..."
            : `Download ${link.format.toUpperCase()}`}
        </Button>
      ))
    ) : (
      <p className="text-light-100 italic">
  No direct download links available.
  <br />
  You can try visiting:
  <br />
  <a
    href={`https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-400 hover:underline"
  >
    Open Library
  </a>{" "}
  or{" "}
  <a
    href={`https://archive.org/search.php?query=${encodeURIComponent(book.title)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-400 hover:underline"
  >
    Internet Archive
  </a>
</p>

    )}

    {/* Progress Bar */}
    {downloading && (
      <div className="w-full bg-dark-600 rounded-full mt-3 h-2 overflow-hidden">
        <div
          className="bg-green-600 h-2 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    )}
  </motion.div>
</div>


);
}