export function LoadingState() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div className="h-10 w-48 animate-pulse rounded-2xl bg-white/10" />
      <div className="h-40 animate-pulse rounded-3xl bg-white/10" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-3xl bg-white/8" />
        <div className="h-32 animate-pulse rounded-3xl bg-white/8" />
      </div>
      <div className="h-56 animate-pulse rounded-3xl bg-white/8" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/8" />
        ))}
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="glass rounded-3xl p-8">
        <p className="font-display text-3xl text-white">Something went wrong</p>
        <p className="mt-2 text-sm text-white/55">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-2xl bg-white/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/25"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
