// Sends the magic-link confirmation email via Resend.

import { Resend } from "resend";

export async function sendMagicLink({ to, link, label, action }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "TrailAngeles <edits@trailangeles.org>";
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const verb = action === "new" ? "add a new" : "edit a";
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: auto; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">Confirm your TrailAngeles suggestion</h2>
      <p>You (or someone using this email) asked to ${verb} ${label.toLowerCase()} on
      <a href="https://trailangeles.org">TrailAngeles.org</a>.</p>
      <p>Click the button below to submit your suggestion for review. This link
      expires in 30 minutes and can be used once.</p>
      <p style="margin: 24px 0;">
        <a href="${link}" style="background:#2f855a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
          Confirm &amp; submit my suggestion
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email — nothing will be submitted.</p>
    </div>`;

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    subject: "Confirm your TrailAngeles suggestion",
    html,
  });
  if (error) throw new Error(`Email failed: ${error.message || JSON.stringify(error)}`);
}
