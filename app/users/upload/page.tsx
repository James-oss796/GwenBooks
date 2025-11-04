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
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Upload a Book</h1>
     <UploadForm />
    </main>
  );
}
