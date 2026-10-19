export const PLAYER_COOKIE = "scrapbook_player";
export const GATE_COOKIE = "scrapbook_gate";

const enc = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return base64url(new Uint8Array(sig));
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function sign(value: string, secret: string): Promise<string> {
  return `${value}.${await hmac(secret, value)}`;
}

export async function verify(token: string | undefined, secret: string): Promise<string | null> {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const value = token.slice(0, i);
  const expected = await hmac(secret, value);
  return constantTimeEqual(token.slice(i + 1), expected) ? value : null;
}

// .env.example values must never reach a live deployment.
const PLACEHOLDER = /^change-me/i;

/** The gate passcode. The only reader of GROUP_CODE that enforces it is set and not the example. */
export function groupPasscode(): string {
  const c = process.env.GROUP_CODE;
  if (!c) throw new Error("GROUP_CODE is not set: choose your own gate passcode");
  if (PLACEHOLDER.test(c))
    throw new Error("GROUP_CODE is still the .env.example placeholder: set your own passcode");
  return c;
}

/** HMAC key bound to both values, so rotating the passcode or the secret signs everyone out. */
export function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16 || PLACEHOLDER.test(s))
    throw new Error(
      "SESSION_SECRET is missing, shorter than 16 characters, or still the .env.example placeholder",
    );
  return `${s}:${groupPasscode()}`;
}
