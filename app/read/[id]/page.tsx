import React from "react";
import Reader from "@/components/Render";
import { notFound } from "next/navigation";
import { fetchBookBySource } from "@/lib/fetchBooks";
import Image from "next/image";
import Link from "next/link";

type ReadPageProps = {
params: { id: string };
};

function chunkTextIntoPages(text: string, approxCharsPerPage = 4000) {
const paragraphs = text
.split(/\n\s*\n/)
.map((p) => p.trim())
.filter(Boolean);

const pages: string[] = [];
let buffer = "";

for (const p of paragraphs) {
if ((buffer + "\n\n" + p).length > approxCharsPerPage && buffer.length > 0) {
pages.push(buffer.trim());
buffer = p;
} else {
buffer = buffer ? buffer + "\n\n" + p : p;
}
}

if (buffer.trim()) pages.push(buffer.trim());
return pages;
}

export default async function Page({ params }: ReadPageProps) {
const decodedId = decodeURIComponent(params.id);
const book = await fetchBookBySource(decodedId);

if (!book) return notFound();

// If the book has no internal readable format (Google/OpenLibrary/Archive fallback)
const externalSources = ["google", "openlibrary", "internetarchive"];
if (externalSources.includes(book.source) && !book.readUrl?.endsWith(".txt") && !book.readUrl?.endsWith(".htm") && !book.readUrl?.endsWith(".html")) {
return (
<div className="min-h-screen flex flex-col items-center justify-center bg-[#fff7e8] text-gray-900 p-6 text-center">
<div className="max-w-md w-full rounded-2xl bg-white shadow-lg border border-gray-200 p-6">
<Image
src={book.coverUrl || "/placeholder-book.jpg"}
alt={book.title}
width={180}
height={250}
className="rounded-lg mx-auto mb-4"
/>
<h1 className="text-2xl font-semibold mb-1">{book.title}</h1>
<p className="text-gray-500 mb-6">by {book.author}</p>

      <p className="text-gray-600 mb-6">
        This book is available from our trusted partner{" "}
        <span className="font-semibold capitalize">{book.source}</span>.  
        To ensure the best reading experience, please open it directly on the official site.
      </p>

      <Link
        href={book.readUrl || "#"}
        target="_blank"
        className="inline-block bg-amber-400 hover:bg-amber-500 text-black font-medium px-6 py-3 rounded-lg transition-colors"
      >
        Open on {book.source === "google" ? "Google Books" : book.source === "openlibrary" ? "Open Library" : "Internet Archive"}
      </Link>

      <p className="text-xs text-gray-400 mt-6">
        You’re being redirected to a verified source. GwenBooks never hosts pirated or unsafe content.
      </p>
    </div>
  </div>
);


}

if (!book.readUrl) return notFound();

let raw: string;
try {
const textRes = await fetch(book.readUrl);
if (!textRes.ok) throw new Error(`Failed to fetch text: ${textRes.status}`);
raw = await textRes.text();
} catch (err) {
console.error("Error fetching readable content:", err);
return (
<div className="min-h-screen flex flex-col items-center justify-center bg-[#fff7e8] text-gray-900 p-6 text-center">
<div className="max-w-md w-full rounded-2xl bg-white shadow-lg border border-gray-200 p-6">
<h2 className="text-xl font-semibold mb-4">Reading Unavailable</h2>
<p className="text-gray-600 mb-6">
We couldn’t load this book directly inside GwenBooks. You can still open it on its official source below.
</p>
<Link
href={book.readUrl || "#"}
target="_blank"
className="inline-block bg-amber-400 hover:bg-amber-500 text-black font-medium px-6 py-3 rounded-lg transition-colors"
>
Visit Original Page
</Link>
</div>
</div>
);
}

// 🧹 Convert HTML → plain text safely
if (/<\s*html/i.test(raw)) {
  raw = raw
    // 1️⃣ Remove everything between <script>...</script>
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    
    // 2️⃣ Remove everything between <style>...</style>
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    
    // 3️⃣ Replace paragraph ends </p> with a double newline
    .replace(/<\/p>/gi, "\n\n")
    
    // 4️⃣ Replace <br> or <br/> tags with a single newline
    .replace(/<br\s*\/?>/gi, "\n")
    
    // 5️⃣ Replace closing header tags like </h1> or </h2> with a newline
    .replace(/<\/h\d>/gi, "\n\n")
    
    // 6️⃣ Remove any remaining HTML tags
    .replace(/<[^>]+>/g, "")
    
    // 7️⃣ Decode basic HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}


const pages = chunkTextIntoPages(raw, 3500);

if (pages.length === 0) {
return (
<div className="min-h-screen flex flex-col items-center justify-center bg-[#fff7e8] text-gray-900 p-6 text-center">
<div className="max-w-md w-full rounded-2xl bg-white shadow-lg border border-gray-200 p-6">
<Image
src={book.coverUrl || "/placeholder-book.jpg"}
alt={book.title}
width={160}
height={220}
className="rounded-lg mx-auto mb-4"
/>
<h1 className="text-2xl font-semibold mb-1">{book.title}</h1>
<p className="text-gray-500 mb-6">by {book.author}</p>
<p className="text-gray-600 mb-6">
This book’s full text isn’t available for in-app reading. You can open it on the official site below.
</p>
<Link
href={book.readUrl || "#"}
target="_blank"
className="inline-block bg-amber-400 hover:bg-amber-500 text-black font-medium px-6 py-3 rounded-lg transition-colors"
>
Open on {book.source === "google" ? "Google Books" : "Source Website"}
</Link>
</div>
</div>
);
}

return (
<Reader
book={{
id: book.id,
title: book.title,
author: book.author,
coverUrl: book.coverUrl,
}}
pages={pages}
/>
);
}