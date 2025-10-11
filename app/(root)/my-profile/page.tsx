'use client'

import React, { useEffect, useState } from 'react'
import BookList from '@/components/BookList'
import { Button } from '@/components/ui/button'
import BookSearch from "@/components/BookSearch";
import { fetchBooks } from "@/lib/fetchBooks";
import { auth } from "@/auth"; // 👈 Import your authentication

interface Book {
  id: string
  title: string
  genre: string
  coverUrl: string
  coverColor: string
}

const Page = () => {

  // 1️⃣ Remove await usage here
  // const session = await auth();  <-- REMOVE THIS
  // const userId = session?.user?.id || "";  <-- You need session data from somewhere else

  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    const fetchBooksData = async () => {
      try {
        const res = await fetch('https://openlibrary.org/search.json?q=best+books&limit=10')
        const data = await res.json()

        const mappedBooks: Book[] = data.docs.map((book: any, index: number) => ({
          id: book.key || String(index),
          title: book.title || 'Untitled',
          genre: book.subject ? book.subject[0] : 'Unknown',
          coverUrl: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : '/icons/default-book.svg',
          coverColor: '#E2E8F0',
        }))

        setBooks(mappedBooks)
      } catch (error) {
        console.error('Failed to fetch books:', error)
      }
    }

    fetchBooksData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/actions/logout', { method: 'POST' })
      window.location.href = '/sign-in'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // For now, since you removed session, pass empty userId
  return (
    <main className="p-6 space-y-10">
      <div className="mb-10">
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <section className="max-w-4xl mx-auto">
        <BookSearch userId={""} />
      </section>
      <section>
        <BookList
          title="Best Books"
          books={books}
        />
      </section>
    </main>
  )
}

export default Page
