import { db } from "@/DATABASE/drizzle"; // your Drizzle instance
import { users, reading_progress, favorites } from "@/DATABASE/schema";
import { eq, countDistinct } from "drizzle-orm";
import React from "react";
import { FiBookOpen, FiUser, FiHeart } from "react-icons/fi";
import Image from 'next/image'

export const revalidate = 0; // always fetch latest data

async function getDashboardStats() {
  const [userCount] = await db.select({ count: countDistinct(users.id) }).from(users);
  const [booksReadCount] = await db.select({ count: countDistinct(reading_progress.bookId) }).from(reading_progress);
  const [favoriteCount] = await db.select({ count: countDistinct(favorites.bookId) }).from(favorites);

  const recentUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      lastActivityDate: users.lastActivityDate,
    })
    .from(users)
    .orderBy(users.lastActivityDate)
    .limit(5);

  return {
    userCount: userCount?.count || 0,
    booksReadCount: booksReadCount?.count || 0,
    favoriteCount: favoriteCount?.count || 0,
    recentUsers,
  };
}

export default async function AdminDashboard() {
  const { userCount, booksReadCount, favoriteCount, recentUsers } = await getDashboardStats();

  return (
    <main className="min-h-screen text-gray-900 p-6">
      <h1 className="text-2xl font-bold mb-8 text-blue-800"> <Image
                      src="/icons/admin/logo.svg"
                      alt="logo"
                      height={37}
                      width={37}
                      /> GwenBooks Admin Dashboard</h1>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 flex flex-col items-center">
          <FiUser size={36} className="text-blue-500 mb-3" />
          <h2 className="text-2xl font-semibold">{userCount}</h2>
          <p className="text-gray-500">Total Users</p>
        </div>

        <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 flex flex-col items-center">
          <FiBookOpen size={36} className="text-green-500 mb-3" />
          <h2 className="text-2xl font-semibold">{booksReadCount}</h2>
          <p className="text-gray-500">Books Read</p>
        </div>

        <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 flex flex-col items-center">
          <FiHeart size={36} className="text-red-500 mb-3" />
          <h2 className="text-2xl font-semibold">{favoriteCount}</h2>
          <p className="text-gray-500">Favorites</p>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-white shadow-md border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Recent User Activity</h2>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-400">
                  No recent activity
                </td>
              </tr>
            ) : (
              recentUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{user.fullName}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">{new Date(user.lastActivityDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </section>
    </main>
  );
}
