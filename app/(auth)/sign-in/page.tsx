"use client";

import AuthForm from "@/components/AuthForm";
import { signInWithCredentials } from "@/lib/actions/auth";
import { signInSchema } from "@/lib/validations";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const Page = () => (
  <div className="flex flex-col gap-4">
    <AuthForm
      type="SIGN_IN"
      schema={signInSchema}
      defaultValues={{
        email: "",
        password: "",
      }}
      onSubmit={signInWithCredentials}
    />

  

   <Button onClick={() => signIn("google")}>
         Sign in with Google
   </Button>


    {/* Forgot Password link */}
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

export default Page;
