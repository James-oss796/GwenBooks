export interface Book {
    id: string;
    title: string;
    readUrl?: string;
    textContent?: string;
    downloadUrl?: string;
    downloadId?: string;
    author?: string;
    genre?: string;
    rating?: number;
    totalCopies?: number;
    availableCopies?: number;
    description?: string;
    coverColor: string;
    coverUrl: string;
    videoUrl?: string;
    summary?: string;
    isLoanedBook?: boolean;
    createdAt?: Date | null;
    readUrl?: string;
    source?: "gutenberg" | "internetarchive" | "wikisource" | "openlibrary" | "googlebooks" | "uploaded";
    fileType?: "pdf" | "epub";
    fileSize?: number;
     isFullyReadable?: boolean;
    subtitle?: string;
    subjects?: string[];
    language?: string;
    publicationDate?: string;
    publisher?: string;
    isbn?: string[];
    sourceId?: string;
    availability?: "readable_in_app" | "external_preview" | "source_only";
    sourceUrl?: string;
    formats?: string[];
    chapters?: Array<{ id: string; title: string; content: string }>;
    metadataConfidence?: number;
    sources?: Array<{ name: string; url?: string; availability: "readable_in_app" | "external_preview" | "source_only" }>;
  }
  
export interface AuthCredentials {
    fullName: string;
    email: string;
    password: string;
  }
  
export interface BookParams {
    title: string;
    author: string;
    genre: string;
    rating: number;
    coverUrl: string;
    coverColor: string;
    description: string;
    totalCopies: number;
    videoUrl: string;
    summary: string;
  }
  
export interface BorrowBookParams {
    bookId: string;
    userId: string;
  }
  
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: MyUser;
  }

  interface User {
    id: string;
    email: string;
  }
}


export interface MyUser {
  id: string;
  email: string;
  name?: string;
  emailVerified?: Date | null; 
}

