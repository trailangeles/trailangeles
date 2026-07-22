// Netlify Blobs storage for rate-limit counters.

import { getStore } from "@netlify/blobs";

const RATE = "edit-rate";

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
