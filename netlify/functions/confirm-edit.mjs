// GET /api/confirm-edit?token=...
//
// Step 2 of the public edit flow: the submitter clicked the magic link. Verify
// the token, load the stashed draft, open a pull request via the GitHub App,
// and show a confirmation page. The draft is single-use.

import { validateSubmission } from "./lib/schema.mjs";
import { verifyToken } from "./lib/token.mjs";
import { getDraft, deleteDraft } from "./lib/store.mjs";
import { createSuggestionPR } from "./lib/github.mjs";

export const config = { path: "/api/confirm-edit" };

export default async (req) => {
  const token = new URL(req.url).searchParams.get("token");
  const secret = process.env.MAGIC_LINK_SECRET;
  const payload = secret ? verifyToken(token, secret) : null;
  if (!payload) {
    return page("Link expired or invalid", "This confirmation link is invalid or has expired. Please submit your suggestion again.", false);
  }

  const draft = await getDraft(payload.d);
  if (!draft) {
    return page("Already submitted", "This suggestion has already been submitted, or the link has expired.", false);
  }

  const v = validateSubmission(draft);
  if (!v.ok) {
    await deleteDraft(payload.d);
    return page("Couldn't process suggestion", "Your suggestion could not be validated. Please try again.", false);
  }

  let pr;
  try {
    pr = await createSuggestionPR({
      conf: v.conf,
      collection: draft.collection,
      targetId: draft.targetId,
      fields: v.cleaned,
      email: draft.email,
    });
  } catch (e) {
    return page("Something went wrong", `We couldn't create the pull request: ${escapeHtml(e.message)}`, false);
  }

  await deleteDraft(payload.d);
  return page(
    "Thank you! 🎉",
    `Your suggested edit has been submitted for review as <a href="${pr.html_url}">pull request #${pr.number}</a>. A TrailAngeles maintainer will review it soon.`,
    true
  );
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function page(title, message, ok) {
  const color = ok ? "#2f855a" : "#c53030";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)} — TrailAngeles</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7fafc;margin:0;">
  <div style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.08);">
    <h1 style="color:${color};margin-top:0;">${escapeHtml(title)}</h1>
    <p style="font-size:16px;line-height:1.5;color:#2d3748;">${message}</p>
    <p style="margin-top:24px;"><a href="/" style="color:#2f855a;">← Back to TrailAngeles.org</a></p>
  </div>
</body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
