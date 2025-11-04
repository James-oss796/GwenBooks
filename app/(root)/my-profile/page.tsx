'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import BookList from '@/components/BookList'
import BookSearch from '@/components/BookSearch'
import { handleLogout } from '@/app/actions/logout'
import Link from 'next/link'


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
    <main className="p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
  {/* Logout Button */}
  <div className="flex justify-end">
    <form action={handleLogout}>
      <Button size="sm">Logout</Button>
    </form>
  </div>
  {/* My Uploads Button */}
  <Button asChild>
      <Link href="/users/upload">📘 My Uploads</Link>
   </Button>


  {/* Search */}
  <section className="w-full">
    <BookSearch userId="" />
  </section>

  {/* Tabs */}
  <section className="w-full">
    <Tabs defaultValue="best" className="w-full">
      <TabsList className="flex flex-wrap justify-center gap-4 sm:gap-8 border-b pb-2 mb-4">
        <TabsTrigger value="best" className="text-sm sm:text-base">Best Books</TabsTrigger>
        <TabsTrigger value="favorites" className="text-sm sm:text-base">Favorites</TabsTrigger>
        <TabsTrigger value="recent" className="text-sm sm:text-base">Recent Reads</TabsTrigger>
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
