export default function ProductDetailsLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6">
      <div className="h-5 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-5 py-4">
          <div className="h-10 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-7 w-2/5 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
          <div className="h-12 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  )
}
