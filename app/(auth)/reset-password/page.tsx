"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/actions/auth";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const handleSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "This password reset link is missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    const res = await resetPassword({ token, newPassword: data.newPassword });

    if (res.success) {
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      });
      router.push("/auth/sign-in");
    } else {
      toast({
        title: "Error Resetting Password",
        description: res.error ?? "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <div className="flex flex-col gap-4 text-white">
      <h1 className="text-2xl font-semibold">Reset Password</h1>
      <p className="text-light-100">
        Enter your new password to secure your account.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 w-full"
        >
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="••••••••" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="form-btn w-full" loading={isSubmitting}>
            Reset Password
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ResetPasswordPage;
