# Public edit-request flow

This lets **anyone — with no GitHub account** — suggest edits to site content
through friendly forms. Each suggestion becomes a GitHub Pull Request that a
maintainer reviews and merges. Abuse is prevented by a **Cloudflare Turnstile**
bot check plus per-IP rate limiting. An email may be provided but is optional
and unverified (recorded on the PR as contact info).

## How it works

```
Public form (prefilled from src/_data/*.json) with a Turnstile widget
        │  user enters an edit, passes the bot check, submits
        ▼
POST /api/submit-edit   (netlify/functions/submit-edit.mjs)
        │  • verifies the Turnstile token server-side (lib/turnstile.mjs)
        │  • validates against the server-side allow-list (lib/schema.mjs)
        │  • rate-limits per IP (lib/store.mjs, Netlify Blobs)
        │  • GitHub App opens a branch + commit + PR (lib/github.mjs)
        ▼
Maintainer reviews the PR (with a Netlify Deploy Preview) and merges
```

Only fields listed in [`netlify/functions/lib/schema.mjs`](../netlify/functions/lib/schema.mjs)
can ever be written. `events` is deliberately excluded — it is machine-synced
from Google Calendar by the hourly GCal Import action.

## One-time setup

### 1. Create a GitHub App

- Org → Settings → Developer settings → GitHub Apps → **New GitHub App**.
- Permissions → Repository:
  - **Contents:** Read & write
  - **Pull requests:** Read & write
- Uncheck "Webhook active" (not needed).
- Create it, then **Generate a private key** (downloads a `.pem`).
- **Install** the App on the `trailangeles/trailangeles` repo.
- Note the **App ID** and the **Installation ID** (the number at the end of the
  installation URL: `.../installations/<INSTALLATION_ID>`).

### 2. Create a Cloudflare Turnstile widget

- Cloudflare dashboard → Turnstile → **Add widget**.
- Domains: `trailangeles.org`, plus `localhost` / `127.0.0.1` for local dev.
- Mode: **Managed**.
- Copy the **Sitekey** (public — goes in the form HTML) and the **Secret key**
  (server-side — goes in the env as `TURNSTILE_SECRET`).

### 3. Add environment variables

Set these in **Netlify → Site configuration → Environment variables** (and in a
local `.env` for `netlify dev`). See [`.env.example`](../.env.example).

| Variable | Value |
|---|---|
| `GH_APP_ID` | App ID from step 1 |
| `GH_APP_INSTALLATION_ID` | Installation ID from step 1 |
| `GH_APP_PRIVATE_KEY` | Contents of the `.pem` (literal `\n` newlines are fine) |
| `TURNSTILE_SECRET` | Secret key from step 2 |

Optional: `GH_REPO` (default `trailangeles/trailangeles`), `GH_BRANCH`
(default `main`). The Turnstile **sitekey** is public and lives in the form HTML,
not in env.

## Local development

```bash
npm install
netlify dev        # serves the site + functions at http://localhost:8888
```

The form submits `{ collection, targetId, fields, email?, turnstileToken }` to
`/api/submit-edit`; a valid Turnstile token is required (use a Turnstile testing
sitekey/secret for local runs).

## Notes

- The bot re-serializes JSON with 2-space indentation (matching the repo). The
  PR body also lists each changed field in plain language, so reviewers can see
  exactly what changed without reading the raw diff.
- Turnstile — not email — is the abuse gate, so contributors don't need a
  working email or any account to submit.
