import React from "react";
import { db } from "@/DATABASE/drizzle";
import { sql } from "drizzle-orm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FiUsers } from "react-icons/fi";

export const revalidate = 0; // Always show latest data

async function getAllUsers(search: string = "") {
  const query = await db.execute(sql`
    SELECT 
      u.id, 
      u.full_name AS "fullName", 
      u.email, 
      u.last_activity_date AS "lastActivityDate",
      COUNT(DISTINCT r.book_id) AS "booksRead",
      COUNT(DISTINCT f.book_id) AS "favoritesCount"
    FROM users u
    LEFT JOIN reading_progress r ON CAST(u.id AS TEXT) = r.user_id
    LEFT JOIN favorites f ON CAST(u.id AS TEXT) = f.user_id
    WHERE u.full_name ILIKE ${"%" + search + "%"} 
       OR u.email ILIKE ${"%" + search + "%"}
       OR CAST(u.id AS TEXT) ILIKE ${"%" + search + "%"}
    GROUP BY u.id
    ORDER BY u.last_activity_date DESC;
  `);

  return query.rows as {
    id: string;
    fullName: string;
    email: string;
    lastActivityDate: string;
    booksRead: number;
    favoritesCount: number;
  }[];
}

export default async function AllUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const search = searchParams?.q || "";
  const usersData = await getAllUsers(search);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
          <FiUsers size={28} /> All Users
        </h1>

        {/* Search form */}
        <form className="flex gap-2 mt-4 sm:mt-0">
          <Input
            name="q"
            type="text"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="w-64"
          />
          <Button type="submit" variant="default">
            Search
          </Button>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-md border border-gray-200 rounded-xl p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Books Read</TableHead>
              <TableHead className="text-center">Favorites</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {usersData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              usersData.map((u) => (
                <TableRow
                  key={u.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-center">{u.booksRead}</TableCell>
                  <TableCell className="text-center">{u.favoritesCount}</TableCell>
                  <TableCell>
                    {u.lastActivityDate
                      ? new Date(u.lastActivityDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <p className="text-sm text-gray-400 text-center mt-6">
        Showing {usersData.length} users
      </p>
    </main>
  );
}
