// POST /api/submit-edit
//
// The public edit flow. A submission is accepted only if its Cloudflare
// Turnstile token passes server-side verification (bot protection) and the
// payload validates against the server-side allow-list. On success a pull
// request is opened immediately via the GitHub App for a maintainer to review.
//
// An optional email may be included; it is recorded on the PR as unverified
// contact info (Turnstile, not email, is what gates abuse here).

import { validateSubmission } from "./lib/schema.mjs";
import { hitRateLimit } from "./lib/store.mjs";
import { verifyTurnstile } from "./lib/turnstile.mjs";
import { createSuggestionPR } from "./lib/github.mjs";

export const config = { path: "/api/submit-edit" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const { collection, targetId = null, fields, email = "", turnstileToken } = payload || {};

  // 1. Bot protection: verify the Turnstile token first.
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || undefined;
  const bot = await verifyTurnstile(turnstileToken, ip);
  if (!bot.ok) return json({ error: "Bot check failed. Please reload and try again." }, 403);

  // 2. Validate the suggestion against the allow-list.
  const v = validateSubmission({ collection, targetId, fields });
  if (!v.ok) return json({ error: "We couldn't accept that suggestion.", details: v.errors }, 400);

  const contactEmail = typeof email === "string" && EMAIL_RE.test(email) ? email : "";

  // 3. Rate limit per IP (fixed 1-hour window) as defence in depth.
  const perIp = await hitRateLimit(`ip:${ip || "unknown"}`, { max: 15, windowSec: 3600 });
  if (!perIp.allowed) return json({ error: "Too many suggestions from here. Please try again later." }, 429);

  // 4. Open the pull request.
  let pr;
  try {
    pr = await createSuggestionPR({
      conf: v.conf,
      collection,
      targetId,
      fields: v.cleaned,
      email: contactEmail,
    });
  } catch (e) {
    return json({ error: e.message || "Could not create the pull request." }, 502);
  }

  return json({
    ok: true,
    prNumber: pr.number,
    prUrl: pr.html_url,
    message: "Thanks! Your suggestion was submitted for review.",
  });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
