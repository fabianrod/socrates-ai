import { createHmac } from "node:crypto";

const SECRET = process.env.META_APP_SECRET || "";

export function signState(userId: string, nonce: string, redirectUri?: string): string {
  const payload = JSON.stringify({ userId, n: nonce, r: redirectUri ?? "" });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyState(state: string): { userId: string; redirectUri?: string } | null {
  const i = state.lastIndexOf(".");
  if (i === -1) return null;
  const encoded = state.slice(0, i);
  const sig = state.slice(i + 1);
  const expected = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as { userId?: string; r?: string };
    if (typeof payload.userId !== "string") return null;
    return {
      userId: payload.userId,
      redirectUri: typeof payload.r === "string" && payload.r.length > 0 ? payload.r : undefined,
    };
  } catch {
    return null;
  }
}
