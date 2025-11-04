"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function UploadBookPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a book file before uploading.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData(e.currentTarget);
    formData.append("file", file);

    try {
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/books/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
      });

      xhr.send(formData);
      const data: any = await uploadPromise;

      toast({
        title: "✅ Upload successful!",
        description: `${data.book?.title || "Your book"} has been uploaded.`,
      });
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        title: "❌ Upload failed",
        description:
          error.message || "Something went wrong while uploading the book.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        Upload Your Book
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="title"
          placeholder="Book Title"
          required
          className="border border-gray-300 p-2 w-full rounded-md"
        />
        <Input
          name="author"
          placeholder="Author Name"
          className="border border-gray-300 p-2 w-full rounded-md"
        />
        <Input
          name="genre"
          placeholder="Genre"
          className="border border-gray-300 p-2 w-full rounded-md"
        />
        <Input
          name="language"
          placeholder="Language"
          className="border border-gray-300 p-2 w-full rounded-md"
        />
        <Textarea
          name="description"
          placeholder="Short description..."
          className="border border-gray-300 p-2 w-full rounded-md"
        />
        <label
          htmlFor="file"
          className="block text-sm font-medium text-gray-700"
        >
          Upload File
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.epub"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0] || null;
            setFile(selectedFile);
          }}
          required
          className="block w-full border border-gray-300 rounded-md p-2"
        />

        {loading && (
          <div className="pt-2">
            <Progress value={progress} className="w-full h-2" />
            <p className="text-sm text-gray-600 mt-1">{progress}% uploaded</p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Uploading..." : "Upload Book"}
        </Button>
      </form>
    </main>
  );
}
