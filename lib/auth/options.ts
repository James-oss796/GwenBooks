// lib/auth/options.ts
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { signInWithCredentials } from "@/lib/actions/auth";
 import { syncGoogleUser } from "@/lib/actions/syncUsers";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const creds = credentials as { email: string; password: string } | undefined;
        if (!creds?.email || !creds?.password) return null;

        const result = await signInWithCredentials({
          email: creds.email,
          password: creds.password,
        });

        if (result?.success) {
          return {
            id: "1",
            email: creds.email,
            name: "User",
          };
        }

        return null;
      },
    }),
  ],

  pages: {
    signIn: "/sign-in",
  },

  session: { strategy: "jwt" },

 

callbacks: {
  async jwt({ token, user, account }) {
    if (user && account?.provider === "google") {
      // Sync Google users into your Neon + Drizzle database
      await syncGoogleUser(user.email!, user.name || "Google User");
    }

    if (user) {
      token.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }
    return token;
  },

  async session({ session, token }) {
    if (token.user) {
      // @ts-ignore
      session.user = token.user;
    }
    return session;
  },
},

};
