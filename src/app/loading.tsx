export default function Loading() {
  return (
    <main className="min-h-dvh bg-cream px-5 pt-10 pb-24 mx-auto w-full max-w-[480px] flex flex-col gap-6">
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="label text-muted">Loading</span>
        <div className="h-10 w-2/3 animate-pulse rounded-card bg-surface" />
        <div className="h-32 w-full animate-pulse rounded-card bg-surface" />
        <div className="h-32 w-full animate-pulse rounded-card bg-surface" />
      </div>
    </main>
  );
}
