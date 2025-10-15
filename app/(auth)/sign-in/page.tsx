"use client";

import AuthForm from "@/components/AuthForm";
import { signInWithCredentials } from "@/lib/actions/auth";
import { signInSchema } from "@/lib/validations";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 space-y-6">

      {/* Email & Password Sign-In Form */}
      <div className="w-full max-w-sm">
        <AuthForm
          type="SIGN_IN"
          schema={signInSchema}
          defaultValues={{
            email: "",
            password: "",
          }}
          onSubmit={signInWithCredentials}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center w-full max-w-sm">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="px-3 text-gray-500 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* Google Sign-In Button */}
      <button
        onClick={() => signIn("google")}
        className="flex items-center justify-center w-full max-w-sm p-3 border rounded-md hover:bg-black-300 transition"
      >
        <Image
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google"
          width={24}
          height={24}
          className="mr-2"
        />
        <span>Sign in with Google</span>
      </button>

      {/* Forgot Password Link */}
      <p className="text-center text-base font-medium">
        <Link
          href="/forgot-password"
          className="font-bold text-primary hover:underline"
        >
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
