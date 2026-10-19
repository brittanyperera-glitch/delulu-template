import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-3xl tracking-wide text-brown">This page is not here</h1>
      <Link href="/" className="label underline underline-offset-4">
        Back to the wall
      </Link>
    </main>
  );
}
