import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BookCover from "@/components/BookCover";
import SaveBookButton from "@/components/SaveBookButton";
import { fetchBookBySource } from "@/lib/fetchBooks";
import { getUploadedBookForViewer } from "@/lib/uploadedBookAccess";
import type { Book } from "@/types";

type Props = {
  params: { id: string };
  searchParams?: { title?: string; author?: string; coverUrl?: string; textUrl?: string; downloadId?: string };
};

export default async function BookDetailsPage({ params, searchParams }: Props) {
  const id = decodeURIComponent(params.id);
  let book: Book | null;
  if (id.startsWith("uploaded:")) {
    const match = id.match(/^uploaded:(\d+)$/);
    if (!match) notFound();
    const access = await getUploadedBookForViewer(Number(match[1]));
    if ("error" in access && access.error === "unauthenticated") redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/books/details/${encodeURIComponent(id)}`)}`);
    if ("error" in access) notFound();
    book = {
      id, source: "uploaded", title: access.book.title, author: access.book.author || undefined,
      description: access.book.description || undefined, coverUrl: access.book.coverUrl || "", coverColor: "#f4efe6",
      genre: access.book.genre || undefined, language: access.book.language || undefined, fileType: access.book.fileType === "epub" ? "epub" : "pdf",
      isFullyReadable: true, availability: "readable_in_app", sourceUrl: `/books/shared/${match[1]}`,
      sources: [{ name: access.isOwner ? "Your upload" : "GwenBooks community library", availability: "readable_in_app" }],
    };
  } else {
    book = await fetchBookBySource(id, {
      title: searchParams?.title, author: searchParams?.author, coverUrl: searchParams?.coverUrl,
      readUrl: searchParams?.textUrl, downloadId: searchParams?.downloadId,
    });
  }
  if (!book) notFound();

  const readerUrl = `/read/${encodeURIComponent(book.id)}?${new URLSearchParams({
    title: book.title, author: book.author || "", coverUrl: book.coverUrl || "",
    textUrl: book.readUrl || "", downloadId: book.downloadId || "",
  }).toString()}`;
  const structuredData = {
    "@context": "https://schema.org", "@type": "Book", name: book.title,
    ...(book.author ? { author: { "@type": "Person", name: book.author } } : {}),
    ...(book.description ? { description: book.description } : {}),
    ...(book.coverUrl ? { image: book.coverUrl } : {}),
    ...(book.isbn?.length ? { isbn: book.isbn } : {}),
    ...(book.language ? { inLanguage: book.language } : {}),
  };
  return <main className="min-h-screen bg-[#f8f6f1] px-4 py-8 text-stone-900 sm:py-14">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <article className="mx-auto grid max-w-5xl gap-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-[220px_1fr] sm:gap-12 sm:p-10">
      <div className="mx-auto w-48 sm:w-full"><BookCover coverColor={book.coverColor || "#f4efe6"} coverUrl={book.coverUrl || ""} title={book.title} author={book.author} className="!h-auto !w-full aspect-[143/199]" /></div>
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">{book.source === "uploaded" ? "GwenBooks upload" : `Catalog · ${book.sources?.map((source) => source.name).join(" · ") || book.source || "Book source"}`}</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">{book.title}</h1>
        {book.author && <p className="text-lg text-stone-600">{book.author}</p>}
        {book.description && <p className="max-w-3xl whitespace-pre-line leading-7 text-stone-700">{book.description}</p>}
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {book.publicationDate && <div><dt className="text-stone-500">Published</dt><dd>{book.publicationDate}{book.publisher ? ` · ${book.publisher}` : ""}</dd></div>}
          {!book.publicationDate && book.publisher && <div><dt className="text-stone-500">Publisher</dt><dd>{book.publisher}</dd></div>}
          {book.language && <div><dt className="text-stone-500">Language</dt><dd>{book.language}</dd></div>}
          {book.isbn?.length ? <div><dt className="text-stone-500">ISBN</dt><dd>{book.isbn.join(" · ")}</dd></div> : null}
          {book.formats?.length ? <div><dt className="text-stone-500">Formats</dt><dd>{book.formats.map((format) => format.replace(/;.*$/, "")).join(", ")}</dd></div> : null}
          {book.fileType && <div><dt className="text-stone-500">Your file</dt><dd>{book.fileType.toUpperCase()}</dd></div>}
        </dl>
        {!!book.subjects?.length && <p className="text-sm text-stone-600"><span className="font-medium text-stone-800">Subjects: </span>{book.subjects.slice(0, 8).join(" · ")}</p>}
        <p className="text-sm text-stone-600">{book.isFullyReadable ? "Available to read in GwenBooks." : "Metadata is available; online reading availability depends on the source."}</p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {book.isFullyReadable ? <Link href={readerUrl} className="inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-5 font-semibold text-white hover:bg-emerald-900">Read in GwenBooks</Link> : book.sourceUrl && <a href={book.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-stone-400 px-5 font-medium hover:bg-stone-50">Open source<span className="sr-only"> (opens in new tab)</span></a>}
          {book.downloadId && <a href={`/api/books/download?archiveId=${encodeURIComponent(book.downloadId)}`} className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800 px-5 font-medium text-emerald-900 hover:bg-emerald-50">Download PDF</a>}
          <SaveBookButton book={{ id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl }} />
        </div>
      </div>
    </article>
    <div className="mx-auto mt-6 max-w-5xl"><Link href="/books/search" className="text-sm text-emerald-900 underline underline-offset-4">Back to book search</Link></div>
  </main>;
}
