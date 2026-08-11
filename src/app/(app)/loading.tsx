export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-sm">H</span>
        </div>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
