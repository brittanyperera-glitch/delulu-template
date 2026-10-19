/**
 * A deploy renames every hashed JS/CSS chunk, so a tab still holding the previous build asks for
 * filenames that 404 and throws while navigating. That is a stale client, not a broken page, and
 * the cure is to fetch the current build. We reload at most once per tab: the count lives in
 * sessionStorage, which survives the reload it triggers, so if that reload does NOT fix it (a
 * genuinely broken deploy, or an edge still serving stale HTML) the error screen shows instead of
 * reloading forever. Counting rather than timing means that guarantee never rests on how long a
 * reload takes on a slow connection.
 */

const RELOAD_COUNT_KEY = "delulu_stale_reloads";
const MAX_RELOADS = 1;

// Covers webpack ("ChunkLoadError", "Loading chunk N failed"), the dynamic-import wording from
// Chromium and Firefox, and Safari's own "Importing a module script failed" — the browser the bug
// actually showed up on.
const CHUNK_ERROR =
  /chunkloaderror|loading (chunk|css chunk)|failed to (fetch|load) dynamically imported module|error loading dynamically imported module|importing a module script failed/i;

export function isStaleBuildError(error: { name?: string; message?: string }): boolean {
  return CHUNK_ERROR.test(`${error?.name ?? ""} ${error?.message ?? ""}`);
}

function browserReload(): void {
  if (typeof window !== "undefined") window.location.reload();
}

/**
 * Reloads the page once to fetch the current build when `error` is a stale-build chunk failure.
 * Returns whether it triggered a reload. No-op on the server, for ordinary bugs, and once the tab
 * has already spent its one reload. `reload` is injectable only so the test need not fight jsdom's
 * non-configurable location.reload.
 */
export function recoverFromStaleBuild(
  error: { name?: string; message?: string },
  reload: () => void = browserReload,
): boolean {
  if (typeof window === "undefined") return false;
  if (!isStaleBuildError(error)) return false;
  try {
    const used = Number(sessionStorage.getItem(RELOAD_COUNT_KEY)) || 0;
    if (used >= MAX_RELOADS) return false;
    sessionStorage.setItem(RELOAD_COUNT_KEY, String(used + 1));
  } catch {
    // Storage blocked (private mode, cookies off): without a gate we cannot promise not to loop.
    return false;
  }
  reload();
  return true;
}
