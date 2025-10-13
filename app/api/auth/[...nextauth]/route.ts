import { User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithCredentials } from "@/lib/actions/auth";
import { MyUser } from "@/types";

// Define auth options
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
   async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email);
        const password = String(credentials.password);

        const result = await signInWithCredentials({ email, password });

        if (result.success) return { id: "1", email } as MyUser;
        return null;
      
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: User }) {
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token.user) session.user = token.user as MyUser;
      return session;
    },
  },
};
