# Launch status

Updated 11 November 2026, Brisbane.

## Live

- Site: https://soushi-eats.pages.dev/
- Initial public recipe: https://soushi-eats.pages.dev/recipes/hojicha-basque
- Owner entry: choose **Owner sign-in**, which opens `/admin`.
- Primary Pages project: `soushi-eats`
- Secondary Worker: `soushi-eats`
- D1 database: `soushi-eats`
- Pages production deployment ID: `7a666549-fa00-4ee8-ab64-417a8ad9ba13`
- Pages build output: `dist/pages/_worker.js` and `dist/pages/_routes.json`
- Access uses a reusable, exact-email Allow policy, the Google identity provider, a 24-hour session and the `/admin` path.
- The owner email and Access audience are runtime bindings. Inspect the existing Worker and Access settings when making changes, and preserve their values.
- Public access is intentional. Do not make the whole Worker private.

## Current appearance

Compact Discord-inspired charcoal palette, sans-serif UI font stack and blurple accents. Typography uses gg sans or Noto Sans when locally available, with Helvetica/Arial fallbacks. No remote font requests are required. Darker ingredient and control surfaces, a lighter method surface, stronger borders and a blurple method heading provide more separation. The live recipe layout was visually checked after deployment.

## Recipe layout

The recipe page now prioritises its title, compact cooking summary, aligned ingredients and method. Share, favourite and View settings sit beside the title. Scaling is in the Ingredients batch popover, with a custom multiplier and ingredient-based scaling. Preset batch buttons have been removed. Checklist reset is in the ingredient menu. Sound, notifications, custom timers and timer limitations are in View settings. Copy AI prompt is in the owner's import dialog. The repeated Recipe details panel has been removed. Known servings appear in the compact summary; missing servings are not shown. Owner Edit and Delete actions are inside the top-right Recipe options menu, beside the save indicator; delete confirmation remains in place.

All supplied method tips now appear as visible Tip callouts with a left border, including cautions such as “Do not boil”. There are no tip dropdowns or automatic tip suppression. Recipe records and source instructions are not rewritten by these presentation changes.

The desktop and 390 px mobile layouts were checked locally with the actual frontend and a fixture API. Custom and ingredient-based scaling, checklist reset, Fahrenheit display and inline timer start/cancel passed. The mobile document had no horizontal overflow. The published Pages layout, batch menu and View settings were also checked.

## Recipe editor

Owner-only **Edit recipe** now opens a form with Details, Ingredients and Method tabs. **+ New recipe** uses the same form for manual entry; AI/JSON import remains available separately. Titles, descriptions, tags, servings, source measures, equipment, oven settings and timing are editable. Ingredient rows support fractions, ranges, notes, source units and reordering. Method steps support reordering, optional tips, automatic or explicit timers, and ingredient amount chips linked to batch scaling. Preview does not write. Cancel and Escape protect unsaved edits with a discard prompt.

Existing recipe IDs and ingredient IDs remain stable. Recipe edits preserve private notes, favourites and display preferences. Method edits reset step ticks; removed ingredients are removed from ingredient ticks. Changing an ingredient name or unit clears its old density override. Server validation and the existing revision-guarded owner save API still apply.

Desktop and 390 px mobile form checks passed using a local fixture API: edit, preview, save, manual entry, amount-chip insertion, ingredient reorder, timer editing, discard protection and reload after save. No mobile horizontal overflow was found. Public live verification confirmed no preset batch buttons, custom scaling and hidden owner edit controls. Real owner sign-in and a production save remain the user check below.

The latest layout changes passed local desktop and 390 px mobile checks: visible tips, hidden-until-open owner menu actions, editor opening, and delete confirmation/cancel. The mobile document had no horizontal overflow. The published recipe was checked for visible callouts and absence of the Recipe details panel. All 27 existing tests still pass.

## Verified

- 27 local tests pass, including a 32-assertion measurement conversion matrix.
- SQLite-backed saves, stale revision conflicts and history snapshots.
- JWT signature, issuer, audience, expiry and exact owner identity checks.
- Public API privacy and rejection of unauthorised/cross-origin writes.
- The generated HTML matches the source exactly and its inline JavaScript parses.
- Live public collection loads the initial cheesecake from D1.
- Live recipe URL loads directly and supports scaling.
- Public import/edit/private-note controls are hidden.
- The owner confirmed the Google identity-provider connection test succeeded. The Pages owner app now selects only Google with direct redirect; API read-back confirmed the original audience, owner email policy and 24-hour session are preserved.

## Remaining user check

Complete Google sign-in through the actual Soushi Eats owner entry, add or edit a recipe, wait for **Saved to your account**, then check the public view and a second device. Actual owner session and multi-device round-trip have not yet been tested live.

## Next work

- Full locked-screen/background push alerts remain separate work.
- No hosted GitHub Actions are configured.
- Primary deployment uses the connected Cloudflare Pages API. Build the current source with `npm run build` and upload the `dist/pages/` outputs, preserving the Pages bindings and Access policy.
- The existing D1 database is shared with the previous Workers hostname. No recipe data was copied or reset.
- Live public browsing and the previous owner email-code challenge were verified at `soushi-eats.pages.dev`. Google has since replaced email-code login on the primary Pages owner application. The account-wide email-code provider and secondary Workers app were left in place.
- Direct Upload is configured; GitHub pushes do not auto-deploy.
