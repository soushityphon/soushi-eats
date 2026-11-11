# Launch status

Updated 11 November 2026, Brisbane.

## Live

- Site: https://soushi-eats.personal0reminders.workers.dev/
- Initial public recipe: https://soushi-eats.personal0reminders.workers.dev/recipes/hojicha-basque
- Owner entry: choose **Owner sign-in**, which opens `/admin`.
- Worker: `soushi-eats`
- D1 database: `soushi-eats`
- Worker deployment ID: `b47bef64c63e4423992ba09473b49825`
- Access uses a reusable, exact-email Allow policy, the existing email-code provider, a 24-hour session and the `/admin` path.
- The owner email and Access audience are runtime bindings. Inspect the existing Worker and Access settings when making changes, and preserve their values.
- Public access is intentional. Do not make the whole Worker private.

## Verified

- 21 local tests pass, including a 32-assertion measurement conversion matrix.
- SQLite-backed saves, stale revision conflicts and history snapshots.
- JWT signature, issuer, audience, expiry and exact owner identity checks.
- Public API privacy and rejection of unauthorised/cross-origin writes.
- The generated HTML matches the source exactly and its inline JavaScript parses.
- Live public collection loads the initial cheesecake from D1.
- Live recipe URL loads directly and supports scaling.
- Public import/edit/private-note controls are hidden.
- Live owner entry opens Cloudflare Access email-code sign-in.

## Remaining user check

Complete the real owner email-code sign-in, add or edit a recipe, wait for **Saved to your account**, then check the public view and a second device. Actual owner session and multi-device round-trip have not yet been tested live.

## Next work

- Refine the JSON edit form if needed.
- Full locked-screen/background push alerts remain separate work.
- No hosted GitHub Actions are configured.
- Deployment uses the connected Cloudflare API. Build the current source with `npm run build` and upload `dist/worker.mjs`, preserving the existing bindings and Access policy.
