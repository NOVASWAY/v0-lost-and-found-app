export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8 space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-80 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 w-full bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}
