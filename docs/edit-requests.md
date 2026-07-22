# Public edit-request flow

This lets **anyone — with no GitHub account** — suggest edits to site content
through friendly forms. Each suggestion becomes a GitHub Pull Request that a
maintainer reviews and merges. Abuse is limited by email verification (a
one-time magic link) plus per-email / per-IP rate limiting.

## How it works

```
Public form (prefilled from src/_data/*.json)
        │  user enters an edit + their email
        ▼
POST /api/submit-edit   (netlify/functions/submit-edit.mjs)
        │  • validates against the server-side allow-list (lib/schema.mjs)
        │  • stores a draft in Netlify Blobs
        │  • emails a one-time magic link (Resend)
        ▼
User clicks the magic link
        ▼
GET /api/confirm-edit    (netlify/functions/confirm-edit.mjs)
        │  • verifies the signed token, loads the draft
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
- Note the **App ID** (app settings page) and the **Installation ID** (the
  number at the end of the installation URL:
  `.../installations/<INSTALLATION_ID>`).

### 2. Set up Resend (email)

- Create a Resend account and **verify the `trailangeles.org` domain**
  (add the SPF/DKIM DNS records it gives you — required for delivery).
- Create an API key.
- Pick a verified `From` address, e.g. `edits@trailangeles.org`.

### 3. Add environment variables

Set these in **Netlify → Site configuration → Environment variables** (and in a
local `.env` for `netlify dev`). See [`.env.example`](../.env.example).

| Variable | Value |
|---|---|
| `GH_APP_ID` | App ID from step 1 |
| `GH_APP_INSTALLATION_ID` | Installation ID from step 1 |
| `GH_APP_PRIVATE_KEY` | Contents of the `.pem` (literal `\n` newlines are fine) |
| `MAGIC_LINK_SECRET` | Any long random string |
| `RESEND_API_KEY` | From step 2 |
| `EMAIL_FROM` | e.g. `TrailAngeles <edits@trailangeles.org>` |

Optional: `GH_REPO` (default `trailangeles/trailangeles`), `GH_BRANCH`
(default `main`).

## Local development

```bash
npm install
netlify dev        # serves the site + functions at http://localhost:8888
```

Test the API directly:

```bash
curl -X POST http://localhost:8888/api/submit-edit \
  -H 'content-type: application/json' \
  -d '{"collection":"filters","fields":{"name":"family-friendly","description":"Good for kids"},"email":"you@example.com"}'
```

You'll receive a magic-link email; clicking it opens the PR.

## Notes

- The bot re-serializes JSON with 2-space indentation (matching the repo). The
  PR body also lists each changed field in plain language, so reviewers can see
  exactly what changed without reading the raw diff.
- Magic links expire after 30 minutes and work exactly once.
