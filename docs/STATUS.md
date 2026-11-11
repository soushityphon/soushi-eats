# Launch status

Updated 11 November 2026, Brisbane.

## Live

- Site: https://soushi-eats.pages.dev/
- Initial public recipe: https://soushi-eats.pages.dev/recipes/hojicha-basque
- Owner entry: choose **Owner sign-in**, which opens `/admin`.
- Primary Pages project: `soushi-eats`
- Secondary Worker: `soushi-eats`
- D1 database: `soushi-eats`
- Pages production deployment ID: `ac7ae64d-9103-4dec-8b3b-5e9d76b1463d`
- Pages build output: `dist/pages/_worker.js` and `dist/pages/_routes.json`
- Access uses a reusable, exact-email Allow policy, the existing email-code provider, a 24-hour session and the `/admin` path.
- The owner email and Access audience are runtime bindings. Inspect the existing Worker and Access settings when making changes, and preserve their values.
- Public access is intentional. Do not make the whole Worker private.

## Current appearance

Compact Discord-inspired charcoal palette, sans-serif UI font stack and blurple accents. Typography uses gg sans or Noto Sans when locally available, with Helvetica/Arial fallbacks. No remote font requests are required. The live recipe layout was visually checked after deployment.

## Recipe layout

The recipe page now prioritises its title, compact cooking summary, aligned ingredients and method. Share, favourite and View settings sit beside the title. Scaling is in the Ingredients batch popover, including custom batches and ingredient-based scaling. Checklist reset is in the ingredient menu. Sound, notifications, custom timers and timer limitations are in View settings. Copy AI prompt is in the owner's import dialog. Source metadata and missing serving/tin information are in Recipe details.

Repeated method tips are suppressed from the default view. Additional tips remain expandable, and cautions such as “Do not boil” stay visible. Recipe records and source instructions are not rewritten by these presentation changes.

The desktop and 390 px mobile layouts were checked locally with the actual frontend and a fixture API. Preset/custom/ingredient-based scaling, checklist reset, Fahrenheit display and inline timer start/cancel passed. The mobile document had no horizontal overflow. The published Pages layout, batch menu and View settings were also checked.

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
- Primary deployment uses the connected Cloudflare Pages API. Build the current source with `npm run build` and upload the `dist/pages/` outputs, preserving the Pages bindings and Access policy.
- The existing D1 database is shared with the previous Workers hostname. No recipe data was copied or reset.
- Live public browsing and the owner email-code challenge were verified at `soushi-eats.pages.dev`.
- Direct Upload is configured; GitHub pushes do not auto-deploy.
