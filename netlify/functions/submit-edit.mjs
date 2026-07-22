// POST /api/submit-edit
//
// Step 1 of the public edit flow: validate the suggestion, stash it as a draft,
// and email the submitter a one-time magic link. No PR is created yet — that
// happens in confirm-edit once the email is verified.

import crypto from "node:crypto";
import { validateSubmission } from "./lib/schema.mjs";
import { signToken } from "./lib/token.mjs";
import { putDraft, hitRateLimit } from "./lib/store.mjs";
import { sendMagicLink } from "./lib/email.mjs";

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

  const { collection, targetId = null, fields, email } = payload || {};
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return json({ error: "A valid email address is required." }, 400);
  }

  const v = validateSubmission({ collection, targetId, fields });
  if (!v.ok) return json({ error: "We couldn't accept that suggestion.", details: v.errors }, 400);

  if (!process.env.MAGIC_LINK_SECRET) return json({ error: "Server is not configured." }, 500);

  // Rate limit per email and per IP (fixed 1-hour window).
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  const perEmail = await hitRateLimit(`email:${email.toLowerCase()}`, { max: 5, windowSec: 3600 });
  const perIp = await hitRateLimit(`ip:${ip}`, { max: 15, windowSec: 3600 });
  if (!perEmail.allowed || !perIp.allowed) {
    return json({ error: "Too many suggestions from here. Please try again later." }, 429);
  }

  const draftId = crypto.randomUUID();
  await putDraft(draftId, { collection, targetId, fields: v.cleaned, email, ip, ts: Date.now() });

  const token = signToken({ d: draftId, e: email }, process.env.MAGIC_LINK_SECRET, 1800);
  const baseUrl = process.env.DEPLOY_PRIME_URL || process.env.URL || new URL(req.url).origin;
  const link = `${baseUrl}/api/confirm-edit?token=${encodeURIComponent(token)}`;

  try {
    await sendMagicLink({ to: email, link, label: v.conf.label, action: targetId ? "edit" : "new" });
  } catch (e) {
    return json({ error: "We couldn't send the confirmation email. Please try again later." }, 502);
  }

  return json({ ok: true, message: "Check your email to confirm and submit your suggestion." });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
