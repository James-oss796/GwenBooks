// app/loading.tsx
export default function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-neutral-200">
      <div className="relative flex flex-col items-center">
        {/* Animated logo or text */}
        <div className="text-2xl font-semibold tracking-tight mb-4 animate-pulse">
          GwenBooks
        </div>

        {/* Elegant gradient loading bar */}
        <div className="h-[3px] w-48 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full w-full origin-left animate-[load_1.2s_ease-in-out_infinite] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes load {
          0% {
            transform: scaleX(0);
            transform-origin: left;
          }
          50% {
            transform: scaleX(1);
            transform-origin: left;
          }
          51% {
            transform: scaleX(1);
            transform-origin: right;
          }
          100% {
            transform: scaleX(0);
            transform-origin: right;
          }
        }
      `}</style>
    </div>
  );
}
