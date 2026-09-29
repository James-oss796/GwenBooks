"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { DefaultValues, SubmitHandler, useForm, UseFormReturn, FieldValues, Path } from "react-hook-form"
import React, { useState } from 'react'
import { ZodType } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import { FIELD_NAMES, FIELD_TYPES } from "@/constants"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react";
import Image from "next/image";

interface Props<T extends FieldValues>{
    schema: ZodType<T>;
    defaultValues: T;
    onSubmit: (data: T) => Promise< {success: boolean, error?: string}>;
    type: "SIGN_IN"| "SIGN_UP";
}
function AuthForm<T extends FieldValues>({
    type,
    schema,
    defaultValues,
    onSubmit,
}: Props<T>) {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
    const isSignIn = type === 'SIGN_IN';
    const form: UseFormReturn<T> = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as DefaultValues<T>,
      });
     
    const handleSubmit: SubmitHandler<T> = async(data) => {
      const result = await onSubmit(data);

      if(result.success){
        toast({
          title: 'Success!',
          description: isSignIn ?  "You have successfully signed in." : "You have successfully signed up.",
        });

        router?.push("/my-profile");
      }else{
        toast({
          title: `Error ${isSignIn ? "Signing in" : "Signing up"}`,
          description: result.error ?? "An error has occured.",
          variant: 'destructive'
        })
      }
    };

   return (
    <div className="flex flex-col gap-4" >
        <h1 className="text-2xl font-semibold text-white">
            {isSignIn ? 'Welcome Back to GwenBooks' : 'Create your library account'}
        </h1>
        <p className="text-light-100">
            {isSignIn ? 'Access the vast collection of resources, and stay updated.' : 'Please complete all fields and upload a valid university ID to gain access to the library'}
        </p>

        {/* Google Sign-In Button */}
      <Button
        onClick={async () => {
          setGoogleLoading(true);
          try {
            await signIn("google");
          } finally {
            setGoogleLoading(false);
          }
        }}
        loading={googleLoading}
        disabled={googleLoading}
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
      </Button>

      {/* Divider */}
      <div className="flex items-center w-full max-w-sm">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="px-3 text-gray-500 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}
       className="space-y-4 w-full"
       >

        {Object.keys(defaultValues).map((field) => (
            <FormField
          key={field}
          control={form.control}
          name={field as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="capitalize">{FIELD_NAMES[field.name as keyof typeof FIELD_NAMES]}</FormLabel>
              <FormControl>
  <Input
    required
    type={FIELD_TYPES[field.name as keyof typeof FIELD_TYPES]}
    {...field}
    className="form-input"
  />
</FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        ))}
        
        <Button
          type="submit"
          className="form-btn"
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Please wait..." : isSignIn ? "Sign In" : "Sign Up"}
        </Button>
      </form>
    </Form>
    <p className="text-center text-base font-medium">
        {isSignIn ? 'New to GwenBooks?' : 'Already have an account?'}

        <Link href={isSignIn ? "/sign-up": "/sign-in"} className="font-bold text-primary">
           {isSignIn ? ' Create an account' : ' Sign in'}
        </Link>
    </p>
    </div>
  )
 
}

export default AuthForm