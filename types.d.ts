interface Book {
    id: string;
    title: string;
    readUrl?: string;
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
    source?: string;  
  }
  
  interface AuthCredentials {
    fullName: string;
    email: string;
    password: string;
    universityId: number;
    universityCard: string;
  }
  
  interface BookParams {
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
  
  interface BorrowBookParams {
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
}

