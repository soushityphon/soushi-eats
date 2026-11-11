# Soushi Eats

A public recipe collection with owner-only editing, private owner notes, measurement preferences, scaling and recipe timers.

## Live site

Live site: https://soushi-eats.pages.dev

- Public collection: `/`
- Public recipe links: `/recipes/<recipe-id>`
- Owner sign-in and management: `/admin`
- Read-only public API: `GET /api/recipes`
- Protected owner API: `GET /admin/api/state`, `PUT /admin/api/state`

The owner uses Cloudflare Access email-code sign-in. The owner email is configured as a runtime binding and an Access policy, never embedded in this public repository.

## Local checks

Install Node.js 24 or later, open a terminal in this folder, then run:

```sh
npm run build
npm test
```

There are no package dependencies to install. Checks cover signed and forged tokens, wrong owners, public note privacy, CSRF, SQLite writes and conflicts, recipe validation, and measurement conversions. The tests use Node's built-in SQLite support.

## Deployment

The primary site is the Cloudflare Pages project `soushi-eats`, using Pages advanced mode. The earlier Workers hostname remains a secondary deployment against the same D1 database.

`npm run build` produces `dist/pages/_worker.js` and `dist/pages/_routes.json`, as well as the standalone Worker bundle. For Pages, upload the two Pages output files through the Pages deployments API with an empty asset manifest and branch `main`. Configure the existing `DB` binding and the Pages-specific `ACCESS_AUD`, along with `ACCESS_ISSUER` and `OWNER_EMAIL`, in the production deployment configuration. The Pages owner Access application protects `soushi-eats.pages.dev/admin` using the existing owner policy. Preview deployments have no production database binding.

This project uses Direct Upload. Pushing to GitHub does not automatically publish a Pages deployment. Use the connected Cloudflare API to publish the checked build. No hosted GitHub Actions are configured.

### Standalone Worker deployment

This is a Cloudflare Worker plus a D1 database. `node build.mjs` embeds `public/index.html` into `dist/worker.mjs`. The generated bundle is not committed. Static HTML is currently served by the Worker, so page requests count toward the Workers allowance.

1. Create a dedicated D1 database and apply `migrations/001_init.sql`.
2. Seed `app_state` with the document in `seed.json`, revision 1, and the current ISO timestamp. Do not rerun the seed over an existing collection.
3. Create a reusable Cloudflare Access Allow policy for the exact owner email.
4. Create a self-hosted Access application for the production hostname's `/admin` path, attach that policy, and use the account's email-code identity provider.
5. Bind `DB` to D1 and configure `ACCESS_ISSUER`, `ACCESS_AUD`, and `OWNER_EMAIL` on the Worker.
6. Upload the generated bundle as a Worker ES module, compatibility date `2026-11-11`. Enable logs and traces. Enable the production workers.dev hostname, with preview URLs disabled.
7. Verify public browsing without sign-in and the Access challenge on both `/admin` and `/admin/api/state`.

Deployment is performed through the connected Cloudflare API. No hosted GitHub Actions are configured. No runtime secrets or sign-in tokens belong in Git.

## Data and recovery

The database stores one versioned collection document. Public responses use an explicit field allowlist and never include owner notes, favourites, settings or checklist state.

Owner writes require a valid Access RSA signature, issuer, audience, expiry and exact email. Writes also require a same-origin JSON request with a custom header and the current collection revision. Stale updates return a conflict instead of overwriting another tab's work.

The last 30 previous collection revisions are retained in `state_history`. Export a backup from the owner collection for an independent copy. Failed saves also leave a browser-local recovery download, available through **Recover unsaved work**. Recovery exports are private and must not be committed here.

To restore a database revision, first export the current collection and inspect `state_history` through the Cloudflare dashboard. Restore only the intended JSON document and increment the current revision. A code rollback does not restore database contents.

## Measurement rules

Temperature, mass, liquid volume, spoons, cups and lengths have separate display preferences. AU, US and UK measures remain distinct. Volume-to-weight conversion requires an ingredient-specific value and is labelled as an estimate. Unknown units remain unresolved. Fan mode, bake time and choice of tin are not changed by unit conversion or ingredient scaling.

## Timer limits

Countdowns persist absolute end times, plus pause/resume and add-a-minute controls. The page gives an on-page alert and sound, and offers browser notifications when supported and permitted. This version needs the page open. A sleeping browser, locked phone or closed tab can delay or prevent alerts. Background push notifications are not implemented.

## Recipe content

The initial hojicha Basque cheesecake recipe was supplied by the owner. Its baking guidance has not been independently tested.

## Editing

Use **+ New recipe** to enter a recipe by hand, or **Import recipe** for AI JSON output or a backup. **Edit recipe** opens the same form for an existing recipe. Details, Ingredients and Method tabs support titles, descriptions, tags, cooking metadata, ingredient amounts and notes, and ordered method steps. Insert ingredient amount chips into instructions to keep them linked to batch scaling. Optional step tips and timers are editable. Preview before saving, or cancel without changing the saved recipe. Removing an ingredient referenced in the method requires removing its amount chips first.

Batch size uses a custom multiplier, with ingredient-based scaling available in the same menu. **Delete recipe** requires an in-app confirmation. Public visitors can adjust only their own view, checklist state and timers.
