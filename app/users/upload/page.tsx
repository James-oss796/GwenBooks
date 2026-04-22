"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import UploadForm from "@/components/UploadForm";

export default function UserUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Please select a file before uploading.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("file", file);

    const res = await fetch("/api/user/books/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast({
        title: "✅ Book uploaded successfully!",
        description: "Waiting for admin approval.",
      });
      setFile(null);
    } else {
      toast({
        title: "❌ Upload failed",
        description: data.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
      <section>
        <h1 className="text-2xl font-bold mb-4 text-blue-700">Upload a Book</h1>
        <p className="text-sm text-gray-600 mb-4">
          Upload your PDF or EPUB and submit it for admin approval. You can track the status on the
          <span className="font-medium"> My uploads</span> page.
        </p>
        <div className="bg-white shadow-md border border-gray-200 rounded-xl p-4 sm:p-6">
          <UploadForm />
        </div>
      </section>
    </main>
  );
}
