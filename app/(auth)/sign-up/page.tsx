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
          
    </div>
);

export default Page;
