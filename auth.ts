import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./DATABASE/drizzle";
import { users } from "./DATABASE/schema";
import { syncGoogleUser } from "./lib/actions/syncUsers";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user || user.status !== "APPROVED") return null;
        if (!(await compare(password, user.password))) return null;

        return { id: user.id, email: user.email, name: user.fullName };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;
      const persistedUser = await syncGoogleUser(user.email, user.name || "Google User");
      return persistedUser?.status === "APPROVED";
    },
    async jwt({ token, user, account }) {
      if (!user) return token;

      if (account?.provider === "google" && user.email) {
        const persistedUser = await syncGoogleUser(user.email, user.name || "Google User");
        if (persistedUser?.status === "APPROVED") {
          token.id = persistedUser.id;
          token.name = persistedUser.fullName;
        }
        return token;
      }

      token.id = user.id;
      token.name = user.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.name = token.name ?? undefined;
      }
      return session;
    },
  },
});
