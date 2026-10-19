import { isDemo } from "@/lib/demo";

export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <p className="bg-brown px-4 py-1.5 text-center text-sm text-cream">
      Demo data. Uploads are off and everything resets daily.
    </p>
  );
}
