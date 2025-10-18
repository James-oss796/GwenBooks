'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import BookList from '@/components/BookList'
import BookSearch from '@/components/BookSearch'
import { handleLogout } from '@/app/actions/logout'

interface Book {
  id: string
  title: string
  genre: string
  coverUrl: string
  coverColor: string
}

const Page = () => {
  const [bestBooks, setBestBooks] = useState<Book[]>([])
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([])
  const [recentBooks, setRecentBooks] = useState<Book[]>([])

  useEffect(() => {
    const fetchBestBooks = async () => {
      try {
        const res = await fetch('https://openlibrary.org/search.json?q=best+books&limit=10')
        const data = await res.json()
        const mapped: Book[] = data.docs.map((book: any, index: number) => ({
          id: book.key || String(index),
          title: book.title || 'Untitled',
          genre: book.subject ? book.subject[0] : 'Unknown',
          coverUrl: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : '/icons/default-book.svg',
          coverColor: '#E2E8F0',
        }))
        setBestBooks(mapped)
      } catch (err) {
        console.error('Failed to fetch best books:', err)
      }
    }

    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites/add')
        if (res.ok) {
          const data = await res.json()
          setFavoriteBooks(data.favorites || [])
        }
      } catch (err) {
        console.error('Failed to fetch favorites:', err)
      }
    }

    const fetchRecent = async () => {
      try {
        const res = await fetch('/api/progress/save')
        if (res.ok) {
          const data = await res.json()
          setRecentBooks(data.recent || [])
        }
      } catch (err) {
        console.error('Failed to fetch recent reads:', err)
      }
    }

    fetchBestBooks()
    fetchFavorites()
    fetchRecent()
  }, [])

  return (
    <main className="p-6 space-y-10">
      {/* Logout Button */}
      <div className="mb-10">
        <form action={handleLogout}>
          <Button type="submit">Logout</Button>
        </form>
      </div>

      {/* Search */}
      <section className="max-w-4xl mx-auto">
        <BookSearch userId="" />
      </section>

      {/* Tabs */}
      <section>
        <Tabs defaultValue="best" className="w-full">
          <TabsList className="flex justify-center space-x-20 border-b pb-2 mb-6">
            <TabsTrigger value="best">Best Books</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="recent">Recent Reads</TabsTrigger>
          </TabsList>

          <TabsContent value="best">
            <BookList title="Best Books" books={bestBooks} />
          </TabsContent>

          <TabsContent value="favorites">
            <BookList title="Your Favorites" books={favoriteBooks} />
          </TabsContent>

          <TabsContent value="recent">
            <BookList title="Recently Read" books={recentBooks} />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}

export default Page
