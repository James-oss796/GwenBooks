import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (request.auth) return NextResponse.next();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0] || "http";
  const origin = host ? `${protocol}://${host}` : request.nextUrl.origin;
  const callbackUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, origin);
  const signInUrl = new URL("/sign-in", origin);
  signInUrl.searchParams.set("callbackUrl", callbackUrl.href);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/my-profile/:path*", "/users/:path*", "/admin/:path*"],
};
