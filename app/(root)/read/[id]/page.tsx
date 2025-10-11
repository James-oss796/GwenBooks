// app/(root)/library/[id]/page.tsx
import { notFound } from "next/navigation";
import React from "react";

type FetchedBook = {
  title: string;
  author: string;
  description?: string | null;
  readUrl: string;
};

async function fetchBookById(id: string): Promise<FetchedBook | null> {
  try {
    // 1) fetch work metadata
    const workRes = await fetch(`https://openlibrary.org/works/${id}.json`, { next: { revalidate: 60 } });
    if (!workRes.ok) return null;
    const work = await workRes.json();

    // 2) author: try to resolve a friendly author name if possible
    let author = "Unknown Author";
    if (work.by_statement) {
      author = work.by_statement;
    } else if (Array.isArray(work.authors) && work.authors.length > 0) {
      // try to fetch the first author record (best-effort)
      try {
        const authorKey = work.authors[0]?.author?.key; // e.g. "/authors/OL1A"
        if (authorKey) {
          const aRes = await fetch(`https://openlibrary.org${authorKey}.json`, { next: { revalidate: 60 } });
          if (aRes.ok) {
            const aData = await aRes.json();
            author = aData.name ?? author;
          }
        }
      } catch {
        // ignore author fetch errors and fallback to by_statement or Unknown Author
      }
    }

    // 3) description handling (work.description can be string or { value })
    let description: string | null = null;
    if (typeof work.description === "string") description = work.description;
    else if (work.description?.value) description = work.description.value;

    // 4) try to determine a readable URL:
    // - prefer Internet Archive embed URLs if available (editions.ocaid or links to archive.org)
    // - fallback to the Open Library work page
    let readUrl = `https://openlibrary.org/works/${id}`;

    // Check work.links for archive.org links
    if (Array.isArray(work.links)) {
      const archiveLink = work.links.find((l: any) => typeof l.url === "string" && l.url.includes("archive.org"));
      if (archiveLink?.url) {
        readUrl = archiveLink.url;
      }
    }

    // If no archive link on the work itself, try editions to find 'ocaid' (ocaid → archive.org stream/embed)
    if (!readUrl.includes("archive.org")) {
      try {
        const editionsRes = await fetch(`https://openlibrary.org/works/${id}/editions.json?limit=10`, { next: { revalidate: 60 } });
        if (editionsRes.ok) {
          const editions = await editionsRes.json();
          if (Array.isArray(editions?.entries)) {
            // prefer an edition with 'ocaid'
            const withOca = editions.entries.find((e: any) => e.ocaid);
            if (withOca?.ocaid) {
              // archive.org stream/embed URL pattern
              readUrl = `https://archive.org/stream/${withOca.ocaid}`;
            } else {
              // fallback: some editions include identifiers array with archive identifiers
              const maybeIdentifier = editions.entries.find((e: any) => Array.isArray(e.identifier) && e.identifier.some((id: any) => typeof id === "string" && id.length > 2));
              if (maybeIdentifier?.identifier?.length) {
                // attempt to use the first identifier to build an archive details url
                const candidate = maybeIdentifier.identifier[0];
                if (typeof candidate === "string" && !candidate.includes(" ")) {
                  readUrl = `https://archive.org/details/${candidate}`;
                }
              }
            }
          }
        }
      } catch {
        // ignore edition errors and keep fallback
      }
    }

    return {
      title: work.title ?? "Untitled",
      author,
      description,
      readUrl,
    };
  } catch (err) {
    console.error("fetchBookById error:", err);
    return null;
  }
}

interface Props {
  params: { id: string }; // expects a work id like "OL27482W"
}

const ReaderPage = async ({ params }: Props) => {
  const rawId = params.id;
  const id = decodeURIComponent(rawId);
  const book = await fetchBookById(id);

  if (!book) return notFound();

  const isArchiveEmbed = book.readUrl.includes("archive.org") || book.readUrl.includes("/stream/") || book.readUrl.includes("/details/");

  return (
    <main className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
      <h1 className="text-3xl font-bold text-white">{book.title}</h1>
      <p className="text-light-200">{book.author}</p>
      {book.description && <p className="text-light-400 max-w-2xl">{book.description}</p>}

      <div className="rounded-lg overflow-hidden shadow-lg">
        {isArchiveEmbed ? (
          // embed the archive reader/stream when we detected an archive link
          <iframe
            src={book.readUrl}
            className="w-full h-[80vh] rounded"
            title={book.title}
          />
        ) : (
          // fallback: link out to the OpenLibrary/work page (or other readUrl)
          <div className="p-8 text-center">
            <p className="mb-4 text-light-200">This work does not have an embeddable reader.</p>
            <a
              href={book.readUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Open on Open Library / Archive
            </a>
          </div>
        )}
      </div>

      {/* Future AI Features */}
      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold text-light-100">AI Reading Tools</h2>
        <ul className="list-disc list-inside text-light-200">
          <li>AI Summary of this book</li>
          <li>Highlight and annotate text</li>
          <li>Personalized reading experience</li>
        </ul>
      </section>
    </main>
  );
};

export default ReaderPage;
