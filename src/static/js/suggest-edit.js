// Alpine.js component powering the public "Suggest an edit" forms.
//
// It collects only the fields the visitor actually changed, requires a passing
// Cloudflare Turnstile check, and POSTs to the /api/submit-edit function, which
// opens a GitHub pull request for a maintainer to review. No account needed.

window.suggestEdit = function (config) {
  return {
    open: false,
    submitting: false,
    submitted: false,
    error: false,
    message: "",
    email: "",
    fields: Object.assign({}, config.initial),

    // Only send fields whose value differs from what was loaded.
    changedFields: function () {
      var out = {};
      for (var k in this.fields) {
        if (
          Object.prototype.hasOwnProperty.call(this.fields, k) &&
          this.fields[k] !== config.initial[k]
        ) {
          out[k] = this.fields[k];
        }
      }
      return out;
    },

    submit: async function () {
      this.error = false;
      this.message = "";

      var changed = this.changedFields();
      if (Object.keys(changed).length === 0) {
        this.error = true;
        this.message = "Please change at least one field before submitting.";
        return;
      }

      var tokenEl = this.$refs.form.querySelector('[name="cf-turnstile-response"]');
      var token = tokenEl && tokenEl.value;
      if (!token) {
        this.error = true;
        this.message = "Please complete the bot check and try again.";
        return;
      }

      this.submitting = true;
      try {
        var res = await fetch("/api/submit-edit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            collection: config.collection,
            targetId: config.targetId,
            fields: changed,
            email: this.email,
            turnstileToken: token,
          }),
        });

        // This endpoint returns 200 only on success; errors use a non-2xx
        // status with a JSON { error } body. Parse defensively so a missing or
        // odd body can't turn a real success into a false failure.
        var data = {};
        try {
          data = await res.json();
        } catch (parseErr) {
          data = {};
        }

        if (res.ok) {
          this.submitted = true;
          this.message =
            "Thank you! Your suggestion was submitted for review" +
            (data.prNumber ? " (pull request #" + data.prNumber + ")" : "") +
            ". A maintainer will take a look soon.";
        } else {
          this.error = true;
          this.message = (data && data.error) || "Sorry, something went wrong. Please try again.";
          if (window.turnstile) window.turnstile.reset();
        }
      } catch (e) {
        this.error = true;
        this.message = "Network error. Please try again.";
        if (window.turnstile) window.turnstile.reset();
        if (window.console) console.error("submit-edit failed:", e);
      } finally {
        this.submitting = false;
      }
    },
  };
};
