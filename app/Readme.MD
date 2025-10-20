import React from "react";
import BookSearch from "@/components/BookSearch";
import BookList from "@/components/BookList";
import { fetchBooks } from "@/lib/fetchBooks";
import { auth } from "@/auth"; // 👈 Import your authentication

const HomePage = async () => {
  // 1️⃣ Get logged-in user info
  const session = await auth();
  const userId = session?.user?.id || ""; // default to empty if not logged in

  // 2️⃣ Fetch books (you can change the search keyword or later use real search input)
  const books = await fetchBooks("search for any book....."); // 👈 or leave empty if you prefer to show nothing initially

  // 3️⃣ Return the page layout
  return (
    <main className="p-6 space-y-10">
      {/* Search bar at top */}
      <section className="max-w-4xl mx-auto">
        <BookSearch userId={session?.user?.id || ""} />

      </section>

      {/* Book list below */}
      <section>
        <BookList
          title="Book Display"
          books={books}
          userId={userId}
          containerClassName="mt-8"
        />
      </section>
    </main>
  );
};import React from "react";
import BookSearch from "@/components/BookSearch";
import BookList from "@/components/BookList";
import { fetchBooks } from "@/lib/fetchBooks";
import { auth } from "@/auth"; // 👈 Import your authentication

const HomePage = async () => {
  // 1️⃣ Get logged-in user info
  const session = await auth();
  const userId = session?.user?.id || ""; // default to empty if not logged in

  // 2️⃣ Fetch books (you can change the search keyword or later use real search input)
  const books = await fetchBooks("search for any book....."); // 👈 or leave empty if you prefer to show nothing initially

  // 3️⃣ Return the page layout
  return (
    <main className="p-6 space-y-10">
      {/* Search bar at top */}
      <section className="max-w-4xl mx-auto">
        <BookSearch userId={session?.user?.id || ""} />

      </section>

      {/* Book list below */}
      <section>
        <BookList
          title="Book Display"
          books={books}
          userId={userId}
          containerClassName="mt-8"
        />
      </section>
    </main>
  );
};

export default HomePage;


export default HomePage;
