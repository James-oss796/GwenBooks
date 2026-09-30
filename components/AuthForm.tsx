
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  DefaultValues,
  SubmitHandler,
  useForm,
  UseFormReturn,
  FieldValues,
  Path,
} from "react-hook-form"
import React, { useState } from "react"
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
import Link from "next/link"
import { FIELD_NAMES, FIELD_TYPES } from "@/constants"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

interface Props<T extends FieldValues> {
  schema: ZodType<T>
  defaultValues: T
  onSubmit: (
    data: T
  ) => Promise<{ success: boolean; error?: string }>
  type: "SIGN_IN" | "SIGN_UP"
}

function GoogleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 21.92c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.92Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.99a5.86 5.86 0 0 1 0-3.98V7.48H3.3a9.78 9.78 0 0 0 0 9.04l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.02 14.63 2.08 12 2.08a9.74 9.74 0 0 0-8.7 5.4l3.24 2.53C7.31 7.7 9.46 5.98 12 5.98Z"
      />
    </svg>
  )
}

function AuthForm<T extends FieldValues>({
  type,
  schema,
  defaultValues,
  onSubmit,
}: Props<T>) {
  const router = useRouter()
  const [googleLoading, setGoogleLoading] = useState(false)

  const isSignIn = type === "SIGN_IN"

  const form: UseFormReturn<T> = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  })

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const result = await onSubmit(data)

    if (result.success) {
      toast({
        title: "Success!",
        description: isSignIn
          ? "You have successfully signed in."
          : "You have successfully signed up.",
      })

      router.push("/my-profile")
    } else {
      toast({
        title: `Error ${isSignIn ? "Signing in" : "Signing up"}`,
        description: result.error ?? "An error has occurred.",
        variant: "destructive",
      })
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)

    try {
      await signIn("google", {
        callbackUrl: "/my-profile",
      })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">

      {/* ========================================================= */}
      {/* HEADER                                                    */}
      {/* ========================================================= */}

      <div className="mb-8 text-center">

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          {isSignIn
            ? "Welcome back to GwenBooks"
            : "Create your library account"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-light-100 max-w-sm mx-auto">
          {isSignIn
            ? "Access the vast collection of resources and keep your library experience organized."
            : "Complete your details to create your GwenBooks library account."}
        </p>

      </div>

{/* Google Sign-In Button */}
<div className="flex justify-center mb-7">
  <Button
    type="button"
    onClick={handleGoogleSignIn}
    disabled={googleLoading}
    className="
      group
      h-12
      w-[235px]
      rounded-xl
      border
      border-black/10
      bg-white
      px-5
      text-gray-800
      shadow-[0_2px_8px_rgba(0,0,0,0.12)]
      transition-all
      duration-200
      hover:bg-gray-50
      hover:border-black/15
      hover:shadow-[0_4px_14px_rgba(0,0,0,0.16)]
      focus-visible:ring-2
      focus-visible:ring-white/30
      disabled:opacity-60
    "
  >
    <span className="flex w-full items-center justify-center gap-3">
      {googleLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      ) : (
        <svg
          className="h-8 w-8 shrink-0 -ml-1"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.35 12.23c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
          />
          <path
            fill="#34A853"
            d="M12 21.92c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.92Z"
          />
          <path
            fill="#FBBC05"
            d="M6.54 13.99a5.86 5.86 0 0 1 0-3.98V7.48H3.3a9.78 9.78 0 0 0 0 9.04l3.24-2.53Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.98c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.02 14.63 2.08 12 2.08a9.74 9.74 0 0 0-8.7 5.4l3.24 2.53C7.31 7.7 9.46 5.98 12 5.98Z"
          />
        </svg>
      )}

      <span className="whitespace-nowrap text-sm font-medium text-gray-800">
        {googleLoading ? "Signing in..." : "Sign in with Google"}
      </span>
    </span>
  </Button>
</div>



      {/* ========================================================= */}
      {/* DIVIDER                                                   */}
      {/* ========================================================= */}

      <div className="flex items-center gap-4 mb-7">

        <div className="h-px flex-1 bg-white/15" />

        <span className="text-xs font-medium uppercase tracking-widest text-white/40">
          or
        </span>

        <div className="h-px flex-1 bg-white/15" />

      </div>


      {/* ========================================================= */}
      {/* FORM                                                      */}
      {/* ========================================================= */}

      <Form {...form}>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-5"
        >

          {Object.keys(defaultValues).map((field) => (

            <FormField
              key={field}
              control={form.control}
              name={field as Path<T>}
              render={({ field }) => (

                <FormItem>

                  <FormLabel className="mb-2 block text-sm font-medium text-white/90">
                    {
                      FIELD_NAMES[
                        field.name as keyof typeof FIELD_NAMES
                      ]
                    }
                  </FormLabel>

                  <FormControl>

                    <Input
                      required
                      type={
                        FIELD_TYPES[
                          field.name as keyof typeof FIELD_TYPES
                        ]
                      }
                      {...field}
                      className="
                        h-12
                        w-full
                        rounded-xl
                        border
                        border-white/15
                        bg-white/[0.06]
                        px-4
                        text-white
                        placeholder:text-white/30
                        shadow-none
                        outline-none
                        transition
                        duration-200
                        focus:border-white/30
                        focus:bg-white/[0.08]
                        focus:ring-2
                        focus:ring-white/10
                      "
                    />

                  </FormControl>

                  <FormMessage />

                </FormItem>

              )}
            />

          ))}


          {/* ===================================================== */}
          {/* PRIMARY ACTION                                        */}
          {/* ===================================================== */}

          <Button
            type="submit"
            className="
              mt-2
              h-12
              w-full
              rounded-xl
              bg-primary
              font-semibold
              text-white
              shadow-sm
              transition-all
              duration-200
              hover:brightness-110
              hover:shadow-md
              active:scale-[0.99]
            "
            loading={form.formState.isSubmitting}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Please wait..."
              : isSignIn
                ? "Sign In"
                : "Create Account"}
          </Button>

        </form>

      </Form>


      {/* ========================================================= */}
      {/* ACCOUNT SWITCH                                            */}
      {/* ========================================================= */}

      <p className="mt-7 text-center text-sm text-white/60">

        {isSignIn
          ? "New to GwenBooks?"
          : "Already have an account?"}

        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="
            ml-1
            font-semibold
            text-primary
            transition-colors
            hover:text-white
          "
        >
          {isSignIn
            ? "Create an account"
            : "Sign in"}
        </Link>

      </p>

    </div>
  )
}

export default AuthForm
