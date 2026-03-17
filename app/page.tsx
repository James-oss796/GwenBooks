import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark-100 text-white bg-pattern bg-top bg-cover">
      {/* Top nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Image src="/icons/logo.svg" alt="GwenBooks logo" width={40} height={40} />
          <span className="text-lg font-semibold tracking-tight">GwenBooks</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-white/80 sm:flex">
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">
            How it works
          </Link>
          <Link href="#for-admins" className="hover:text-white transition-colors">
            For admins
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden text-sm text-white/80 hover:text-white sm:inline">
            Sign in
          </Link>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 lg:flex-row lg:items-center lg:pb-24 lg:pt-16 lg:px-8">
        <div className="max-w-xl space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/70 ring-1 ring-white/10">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            A calm digital library for growing minds
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Borrow, upload, and{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              fall in love with reading
            </span>
            .
          </h1>
          <p className="max-w-lg text-sm text-white/70 sm:text-base">
            GwenBooks is a modern library experience—beautiful browsing, one-click borrowing,
            and a simple way for students to upload their own books for approval.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/sign-up">Start reading in minutes</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10"
            >
              <Link href="#features">Explore the library</Link>
            </Button>
          </div>
          <p className="text-xs text-white/50">
            No credit card. Just books, progress tracking, and a little bit of magic.
          </p>
        </div>

        {/* Hero visual */}
        <div className="relative mt-6 flex flex-1 items-center justify-center lg:mt-0">
          <div className="relative w-full max-w-md rounded-3xl bg-white/5 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-xs text-white/60">
              <span className="inline-flex items-center gap-2">
                <span className="flex -space-x-2">
                  <span className="size-6 rounded-full bg-emerald-400/80" />
                  <span className="size-6 rounded-full bg-sky-400/80" />
                  <span className="size-6 rounded-full bg-violet-400/80" />
                </span>
                Students online
              </span>
              <span>Live reading sessions</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="col-span-2 space-y-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 text-sm font-medium">
                  <p className="text-emerald-50">Featured this week</p>
                  <p className="mt-1 text-white">“The Midnight Library”</p>
                  <p className="mt-2 text-xs text-emerald-50/80">
                    Continue from page <span className="font-semibold">142</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] text-white/60">Your progress</p>
                    <p className="mt-1 text-lg font-semibold">68%</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-300 to-sky-300" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] text-white/60">Favorites</p>
                    <p className="mt-1 text-lg font-semibold">24</p>
                    <p className="mt-1 text-[11px] text-emerald-300">+3 this week</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-white/60">Today&apos;s focus</p>
                  <p className="mt-1 text-xs">Finish 1 chapter</p>
                  <p className="mt-2 text-[11px] text-emerald-300">Streak: 7 days</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] text-white/60">Uploads</p>
                  <p className="mt-1 text-lg font-semibold">+1 pending</p>
                  <p className="mt-1 text-[11px] text-white/60">Waiting for librarian review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-6xl space-y-8 px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Designed for readers
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              A calm, focused reading experience
            </h2>
          </div>
          <p className="max-w-md text-sm text-white/70 sm:text-[15px]">
            Clean layouts, clear typography, and small delightful details—so the interface fades
            away and the story pulls you in.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-sm font-semibold">Beautiful library</p>
            <p className="mt-2 text-xs text-white/70">
              Browse curated shelves with rich covers, genres, and summaries tailored to your taste.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-sm font-semibold">Smart progress</p>
            <p className="mt-2 text-xs text-white/70">
              We remember exactly where you left off—across devices—with subtle progress indicators.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-sm font-semibold">Bring your own books</p>
            <p className="mt-2 text-xs text-white/70">
              Upload PDFs or EPUBs in seconds. Librarians review and approve them to keep the
              catalog high-quality.
            </p>
          </div>
        </div>
      </section>

      {/* Admin / institutions */}
      <section
        id="for-admins"
        className="mx-auto max-w-6xl space-y-8 px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl bg-white/5 p-6 sm:p-8 ring-1 ring-white/10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                For librarians & admins
              </p>
              <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Approve uploads. Curate collections. Stay in control.
              </h3>
              <p className="text-sm text-white/70">
                GwenBooks comes with an admin dashboard for reviewing new uploads, managing
                accounts, and monitoring how your library is used—without needing a separate tool.
              </p>
            </div>
            <div className="space-y-3 text-sm text-white/70">
              <ul className="space-y-1">
                <li>• See all pending book uploads at a glance</li>
                <li>• Approve or reject with a single click</li>
                <li>• Manage account requests from students and staff</li>
              </ul>
              <Button asChild variant="outline" size="sm" className="rounded-full border-white/30">
                <Link href="/admin">Open admin dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500/90 via-sky-500/90 to-violet-500/90 px-6 py-8 text-center shadow-xl sm:px-10 sm:py-10">
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to open your library?
          </h3>
          <p className="mt-2 text-sm text-emerald-50/90 sm:text-base">
            Create an account, explore the catalog, and start building a reading habit that sticks.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-white text-emerald-700 hover:bg-emerald-50">
              <Link href="/sign-up">Create free account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-emerald-50/80 bg-transparent text-emerald-50 hover:bg-emerald-600/40"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
