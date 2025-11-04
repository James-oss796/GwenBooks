"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"; // shadcn toast hook (if present)

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast?.() ?? { toast: (x: any) => alert(x.title || x.description) };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast({ title: "Pick a file", description: "Please select a PDF or EPUB." });

    setSubmitting(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    fd.append("file", file);

    try {
      const res = await fetch("/api/books/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast({ title: "Submitted", description: "Your book is submitted for admin approval." });
      // navigate back to my uploads or clear form
      (window as any).location.href = "/users/my-upload";
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input name="title" placeholder="Book title" required />
      <Input name="author" placeholder="Author name" />
      <Input name="genre" placeholder="Genre" />
      <Input name="language" placeholder="Language" />
      <Textarea name="description" placeholder="Short description" />
      <label htmlFor="file" className="block text-sm font-medium">File</label>

      <input
        id="file"
        name="file"
        type="file"
        accept=".pdf,.epub"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        required
        className="block w-full"
      />
      <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit for approval"}</Button>
    </form>
  );
}
