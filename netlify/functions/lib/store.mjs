// Netlify Blobs storage for pending edit drafts and rate-limit counters.
//
// Drafts live between the "submit" step (which emails a magic link) and the
// "confirm" step (which opens the PR). A draft is deleted as soon as it is
// consumed, so each magic link works exactly once.

import { getStore } from "@netlify/blobs";

const DRAFTS = "edit-drafts";
const RATE = "edit-rate";

export async function putDraft(id, draft) {
  await getStore(DRAFTS).setJSON(id, draft);
}

export async function getDraft(id) {
  return getStore(DRAFTS).get(id, { type: "json" });
}

export async function deleteDraft(id) {
  await getStore(DRAFTS).delete(id);
}

// Fixed-window rate limiter. Returns { allowed, count, reset }.
export async function hitRateLimit(key, { max, windowSec }) {
  const store = getStore(RATE);
  const now = Math.floor(Date.now() / 1000);
  const rec = (await store.get(key, { type: "json" })) || { count: 0, reset: now + windowSec };
  if (now > rec.reset) {
    rec.count = 0;
    rec.reset = now + windowSec;
  }
  rec.count += 1;
  await store.setJSON(key, rec);
  return { allowed: rec.count <= max, count: rec.count, reset: rec.reset };
}
