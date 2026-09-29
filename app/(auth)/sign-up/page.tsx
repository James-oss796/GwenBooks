"use client";

import { signIn } from "@/auth";
import AuthForm from "@/components/AuthForm";
import { signUp } from "@/lib/actions/auth";
import { signUpSchema } from "@/lib/validations";
import Image from "next/image";



const Page = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 space-y-6">
      {/* Sign-Up Form */}
    <div className="w-full max-w-sm">
      <AuthForm
    type="SIGN_UP"
    schema={signUpSchema}
    defaultValues={{
      email: "",
      password: "",
      fullName: "",
    }}
    onSubmit = {signUp}

    />
    </div>
          
    </div>
);

export default Page;
