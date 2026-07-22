// Public Cloudflare Turnstile sitekey, embedded in the edit-request forms.
// The sitekey is NOT a secret (the secret lives in the TURNSTILE_SECRET env var
// used only by the server function). Override via env if the widget is rotated.
module.exports = {
  sitekey: process.env.TURNSTILE_SITEKEY || "0x4AAAAAAD7PMyTbJa_dChvq",
};
