"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  language: string;
  fileType: string;
  uploaderEmail: string;
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("/api/books/list");
        const data = await res.json();
        if (res.ok) {
          setBooks(data.books);
        } else {
          toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load books", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">📚 Uploaded Books</h1>

      {loading ? (
        <p>Loading...</p>
      ) : books.length === 0 ? (
        <p>No books uploaded yet.</p>
      ) : (
        <Table>
          <TableCaption>All uploaded books in the system.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>File Type</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>{book.genre}</TableCell>
                <TableCell>{book.language}</TableCell>
                <TableCell>{book.fileType}</TableCell>
                <TableCell>{book.uploaderEmail}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      )}

       
    </main>
  );
}
