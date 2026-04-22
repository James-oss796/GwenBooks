"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);

    // Redirect if not logged in
    useEffect(() => {
        if (session === null) router.push("/sign-in");
    }, [session, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file) {
            return toast({
                title: "No file selected",
                description: "Please select a PDF or EPUB before submitting.",
                variant: "destructive",
            });
        }

        setSubmitting(true);
        setProgress(0);

        const formData = new FormData(e.currentTarget);

        // Use XMLHttpRequest to track progress
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/user/books/upload");

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setProgress(percent);
            }
        };

        xhr.onload = () => {
            setSubmitting(false);
            if (xhr.status === 200) {
                toast({
                    title: "✅ Upload successful",
                    description: "Your book has been submitted for admin approval.",
                });
                router.push("/users/my-upload"); // SPA navigation
            } else {
                const response = JSON.parse(xhr.responseText);
                toast({
                    title: "❌ Upload failed",
                    description: response.error || "Something went wrong.",
                    variant: "destructive",
                });
            }
            setProgress(0);
        };

        xhr.onerror = () => {
            setSubmitting(false);
            toast({
                title: "❌ Upload failed",
                description: "Network error. Please try again.",
                variant: "destructive",
            });
            setProgress(0);
        };

        xhr.send(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
            <Input name="title" placeholder="Book title" required />
            <Input name="author" placeholder="Author name" />
            <Input name="genre" placeholder="Genre" />
            <Input name="language" placeholder="Language" />
            <Textarea name="description" placeholder="Short description" />

            <label htmlFor="file" className="block text-sm font-medium">
                File (PDF / EPUB)
            </label>
            <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.epub"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="block w-full"
            />

            {progress > 0 && (
                <Progress value={progress} max={100} className="h-2 w-full rounded" />
            )}

            <Button type="submit" disabled={submitting}>
                {submitting ? `Uploading… ${progress}%` : "Submit for approval"}
            </Button>
        </form>
    );
}