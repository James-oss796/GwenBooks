import Header from "@/components/Header";
import React, { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/DATABASE/drizzle";
import { users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";

const UsersLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  if (!session?.user?.id) redirect("/sign-in");
  const [account] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (account?.status !== "APPROVED") redirect("/sign-in");

  return (
    <main className="root-container">
      <div className="mx-auto max-w-7xl w-full">
        <Header session={session} />
        <div className="mt-20 pb-20">{children}</div>
      </div>
    </main>
  );
};

export default UsersLayout;

