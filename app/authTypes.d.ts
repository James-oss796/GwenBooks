// types/authTypes.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { MyUser } from "@/types"; // Adjust the import path as needed

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: MyUser;
  }

  interface User extends DefaultUser, MyUser {}
}