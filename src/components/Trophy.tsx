/** A little cup on a plaque. Big Dubs sit on a shelf, the Wall of Shame on a dusty one. */
export function Trophy({ dusty = false }: { dusty?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${dusty ? "opacity-60 grayscale" : ""}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#4a2c17"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M12 6h16v8a8 8 0 0 1-16 0V6z" fill="#e0a526" />
        <path d="M12 9H7a5 5 0 0 0 5 6M28 9h5a5 5 0 0 1-5 6" />
        <path d="M17 22h6v5h-6zM13 30h14" />
        <path d="M11 34h18" />
      </svg>
    </div>
  );
}
