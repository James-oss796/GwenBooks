"use client";

import AuthForm from "@/components/AuthForm";
import { signInWithCredentials } from "@/lib/actions/auth";
import { signInSchema } from "@/lib/validations";
import Link from "next/link";


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
