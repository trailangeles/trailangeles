// Creates a pull request on behalf of an anonymous contributor, using the
// site's own GitHub App identity. The contributor never needs a GitHub account:
// they verify an email, and this bot opens the PR for a maintainer to review.

import crypto from "node:crypto";
import { App } from "@octokit/app";

function getPrivateKey() {
  let key = process.env.GH_APP_PRIVATE_KEY || "";
  // Netlify env vars often store PEM newlines as the literal characters "\n".
  if (key.includes("\\n")) key = key.replace(/\\n/g, "\n");
  return key;
}

async function getInstallationOctokit() {
  const appId = process.env.GH_APP_ID;
  const installationId = Number(process.env.GH_APP_INSTALLATION_ID);
  if (!appId || !installationId) throw new Error("GitHub App is not configured");
  const app = new App({ appId, privateKey: getPrivateKey() });
  return app.getInstallationOctokit(installationId);
}

function truncate(value, max = 120) {
  const s = Array.isArray(value) ? `${value.length} item(s)` : String(value ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function renderPrBody({ conf, action, targetTitle, targetId, changes, email }) {
  const rows = changes
    .map((c) => {
      if (action === "new") return `| \`${c.field}\` | ${truncate(c.to)} |`;
      return `| \`${c.field}\` | ${truncate(c.from)} → **${truncate(c.to)}** |`;
    })
    .join("\n");
  const header = action === "new" ? "| Field | Value |" : "| Field | Change |";

  const contact = email ? ` Contact (unverified): **${email}**.` : "";
  return [
    `> Submitted via the TrailAngeles public edit form (passed a Turnstile bot check).${contact}`,
    "",
    `**Collection:** ${conf.label}`,
    action === "new" ? `**New record:** ${targetTitle}` : `**Editing:** ${targetTitle} (\`${targetId}\`)`,
    "",
    header,
    "|---|---|",
    rows,
    "",
    "_Please review the change above before merging. This PR was opened by an automated bot on behalf of an anonymous contributor who does not have write access._",
  ].join("\n");
}

export async function createSuggestionPR({ conf, collection, targetId, fields, email }) {
  const [owner, repo] = (process.env.GH_REPO || "trailangeles/trailangeles").split("/");
  const base = process.env.GH_BRANCH || "main";
  const octokit = await getInstallationOctokit();

  // 1. Current head of the base branch.
  const ref = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
    owner,
    repo,
    ref: `heads/${base}`,
  });
  const baseSha = ref.data.object.sha;

  // 2. Current file content (fetched live so we build on the latest data).
  const file = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path: conf.file,
    ref: base,
  });
  const original = Buffer.from(file.data.content, "base64").toString("utf8");
  const data = JSON.parse(original);
  const arr = data[conf.arrayKey];
  if (!Array.isArray(arr)) throw new Error(`Unexpected shape in ${conf.file}`);

  // 3. Apply the change to a fresh copy.
  const changes = [];
  const action = targetId ? "edit" : "new";
  let targetTitle;

  if (targetId) {
    const item = arr.find((x) => x[conf.idField] === targetId);
    if (!item) throw new Error("The record you tried to edit no longer exists.");
    targetTitle = item[conf.titleField] || targetId;
    for (const [k, v] of Object.entries(fields)) {
      changes.push({ field: k, from: item[k], to: v });
      item[k] = v;
    }
  } else {
    const newItem = { ...fields, [conf.idField]: crypto.randomUUID() };
    targetTitle = fields[conf.titleField] || "(new record)";
    arr.push(newItem);
    for (const [k, v] of Object.entries(fields)) changes.push({ field: k, to: v });
  }

  // 4. Re-serialize matching the repo's formatting (2-space, preserve trailing newline).
  let updated = JSON.stringify(data, null, 2);
  if (original.endsWith("\n")) updated += "\n";
  if (updated === original) throw new Error("Your suggestion matches the current content — no change to submit.");

  // 5. Branch, commit, PR.
  const shortId = crypto.randomUUID().slice(0, 8);
  const branch = `suggest/${collection}-${action}-${shortId}`;
  const title = `Suggested ${action}: ${conf.label} "${targetTitle}"`;

  await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });
  await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path: conf.file,
    branch,
    message: title,
    content: Buffer.from(updated).toString("base64"),
    sha: file.data.sha,
  });

  const pr = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
    owner,
    repo,
    base,
    head: branch,
    title,
    body: renderPrBody({ conf, action, targetTitle, targetId, changes, email }),
  });
  return pr.data;
}
