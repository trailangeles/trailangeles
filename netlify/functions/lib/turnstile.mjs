// Server-side Cloudflare Turnstile verification.
//
// The browser widget produces a one-time token (cf-turnstile-response). We
// verify it here, server-side, before accepting a submission. The token is
// never trusted without this check, and siteverify is never called from the
// browser.

export async function verifyTurnstile(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) throw new Error("TURNSTILE_SECRET is not set");
  if (!token || typeof token !== "string") return { ok: false, errors: ["missing-input-response"] };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);

  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = await r.json();
  return { ok: result.success === true, errors: result["error-codes"] || [] };
}
