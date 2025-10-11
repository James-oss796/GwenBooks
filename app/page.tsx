// app/page.tsx (server component; preferred)
import { redirect } from "next/navigation";
import { auth } from "@/auth"; // adjust to the exact path if different

export default async function Page() {
  const session = await auth(); // your existing function used elsewhere
  if (!session) {
    redirect("/sign-in"); // or wherever your sign-in page is
  } else {
    // change /home to whatever entry page you want signed-in users to land on
    redirect("/my-profile"); // or redirect("/books") or redirect("/home")
  }
}
