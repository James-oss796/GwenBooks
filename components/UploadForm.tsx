"use client";

import React, { useEffect, useState } from "react";
import { unzipSync } from "fflate";
import { BOOK_UPLOAD_LIMIT, validateBookFile } from "@/lib/bookFileValidation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

type UploadResponse = { upload?: { id: number }; message?: string; error?: string };

function xmlField(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<\\s*(?:dc:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\s*\\/(?:dc:)?${tag}\\s*>`, "i"));
  return match?.[1]?.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim() || "";
}

export default function UploadForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [rightsAttested, setRightsAttested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<UploadResponse | null>(null);

  useEffect(() => { if (status === "unauthenticated") router.replace("/sign-in?callbackUrl=%2Fusers%2Fupload"); }, [status, router]);

  const selectFile = async (selected: File | null) => {
    setError("");
    setSuccess(null);
    setFile(selected);
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (selected.size > BOOK_UPLOAD_LIMIT) { setError("This file is over the 4 MB limit."); return; }
    if (!extension || !["pdf", "epub"].includes(extension)) { setError("Choose a PDF or EPUB file."); return; }
    const validated = await validateBookFile(selected);
    if ("error" in validated) { setError(validated.error); return; }
    if (extension === "epub") {
      try {
        const entries = unzipSync(new Uint8Array(await selected.arrayBuffer()), { filter: (entry) => entry.name.endsWith(".opf") });
        const packageFile = Object.values(entries)[0];
        if (packageFile) {
          const xml = new TextDecoder().decode(packageFile);
          setTitle((value) => value || xmlField(xml, "title"));
          setAuthor((value) => value || xmlField(xml, "creator"));
        }
      } catch {
        setError("This EPUB could not be inspected. The server will validate it again before saving.");
      }
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!file) { setError("Choose a PDF or EPUB file before uploading."); return; }
    if (visibility === "public" && !rightsAttested) { setError("Confirm you have the right to share this book before requesting a public listing."); return; }

    const data = new FormData(event.currentTarget);
    data.set("file", file);
    setSubmitting(true);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/user/books/upload");
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); };
    xhr.onload = () => {
      let response: UploadResponse;
      try { response = JSON.parse(xhr.responseText) as UploadResponse; } catch { response = { error: "The server returned an unreadable response." }; }
      setSubmitting(false);
      setProgress(0);
      if (xhr.status >= 200 && xhr.status < 300 && response.upload?.id) setSuccess(response);
      else setError(response.error || "The upload could not be completed.");
    };
    xhr.onerror = () => { setSubmitting(false); setProgress(0); setError("Network error while uploading. Check your connection and try again."); };
    xhr.onabort = () => { setSubmitting(false); setProgress(0); setError("Upload was cancelled."); };
    xhr.send(data);
  };

  if (status === "loading") return <p role="status" className="text-sm text-slate-500">Checking your account…</p>;
  if (!session) return <p role="status" className="text-sm text-slate-500">Redirecting to sign in…</p>;

  if (success?.upload?.id) return (
    <section aria-live="polite" className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
      <h2 className="text-lg font-semibold">Upload complete</h2>
      <p>{success.message}</p>
      <p className="text-sm">{title} · {file?.name.split(".").pop()?.toUpperCase()}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href={`/read/uploaded%3A${success.upload.id}`}>Read now</Link></Button>
        <Button asChild variant="outline"><Link href="/users/my-upload">Go to my library</Link></Button>
      </div>
    </section>
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5" aria-busy={submitting}>
      <div>
        <label htmlFor="upload-file" className="mb-2 block text-sm font-medium">Choose a PDF or EPUB</label>
        <input id="upload-file" name="file" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" required disabled={submitting} onChange={(event) => void selectFile(event.target.files?.[0] || null)} className="block w-full rounded-lg border border-slate-300 p-3" />
        <p className="mt-1 text-xs text-slate-500">Maximum file size: 4 MB. Files are checked again on the server.</p>
      </div>
      <Input name="title" placeholder="Book title" aria-label="Book title" required minLength={2} maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} />
      <Input name="author" placeholder="Author" aria-label="Author" maxLength={255} value={author} onChange={(event) => setAuthor(event.target.value)} />
      <Input name="genre" placeholder="Subject or genre (optional)" aria-label="Subject or genre" maxLength={100} value={genre} onChange={(event) => setGenre(event.target.value)} />
      <Input name="language" placeholder="Language (optional)" aria-label="Language" maxLength={50} value={language} onChange={(event) => setLanguage(event.target.value)} />
      <Textarea name="description" placeholder="Description (optional)" aria-label="Description" maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} />

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold">Who can access this book?</legend>
        <label className="flex items-start gap-3"><input type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={() => setVisibility("private")} /><span><span className="block font-medium">Private</span><span className="text-sm text-slate-500">Only you and authorized moderators can open it.</span></span></label>
        <label className="flex items-start gap-3"><input type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={() => setVisibility("public")} /><span><span className="block font-medium">Request public listing</span><span className="text-sm text-slate-500">It stays private until a moderator approves it.</span></span></label>
        {visibility === "public" && <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="rightsAttested" checked={rightsAttested} onChange={(event) => setRightsAttested(event.target.checked)} /><span>I have the rights needed to share this file publicly and authorize GwenBooks to display it to approved users.</span></label>}
      </fieldset>

      {submitting && <div className="space-y-2"><Progress value={progress} max={100} className="h-2 w-full" /><p role="status" className="text-sm text-slate-600">Uploading… {progress}%</p></div>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" disabled={submitting} loading={submitting} className="w-full sm:w-auto">{submitting ? `Uploading ${progress}%` : "Upload book"}</Button>
    </form>
  );
}
