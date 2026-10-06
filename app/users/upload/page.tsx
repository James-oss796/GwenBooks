import UploadForm from "@/components/UploadForm";

export default function UserUploadPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-blue-700">Personal library</p>
        <h1 className="text-3xl font-semibold text-slate-950">Upload a book</h1>
        <p className="text-slate-600">Add a PDF or EPUB to your private library. You can request a public listing when you have the right to share it; public books stay private until reviewed.</p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <UploadForm />
      </section>
    </main>
  );
}
