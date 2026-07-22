// Compact, dependency-free signed tokens for magic links.
//
// A token is `base64url(payload).base64url(HMAC-SHA256(payload))`. The payload
// carries the draft id, the email, and an expiry. Because it is signed with a
// server-only secret, the link cannot be forged or tampered with, and it stops
// working after `ttlSeconds`.

import crypto from "node:crypto";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload, secret, ttlSeconds = 1800) {
  const body = { ...payload, x: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let body;
  try {
    body = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!body.x || body.x < Math.floor(Date.now() / 1000)) return null;
  return body;
}
