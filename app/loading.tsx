// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-neutral-200">
      <div className="relative flex flex-col items-center">
        <div className="text-2xl font-semibold tracking-tight mb-4 animate-pulse">
          GwenBooks
        </div>

        <div className="h-[3px] w-48 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full w-full origin-left animate-load bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        </div>
      </div>
    </div>
  );
}
