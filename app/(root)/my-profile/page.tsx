'use client'

import React, { useEffect, useState } from 'react'
import BookList from '@/components/BookList'
import { Button } from '@/components/ui/button'
import BookSearch from "@/components/BookSearch"
import { handleLogout } from '@/app/actions/logout'  // ✅ import your server action

interface Book {
  id: string
  title: string
  genre: string
  coverUrl: string
  coverColor: string
}

const Page = () => {
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

  

  return (
    <main className="p-6 space-y-10">
      <div className="mb-10">
        <form action={handleLogout}> {/* ✅ call server action directly */}
          <Button type="submit">Logout</Button>
        </form>
      </div>

      <section className="max-w-4xl mx-auto">
        <BookSearch userId="" />
      </section>

      <section>
        <BookList title="Best Books" books={books} />
      </section>
    </main>
  )
}

export default Page
