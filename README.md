# Soushi Eats

A public recipe collection with Google sign-in for Soushi and Light, shared recipe editing, personal notes and favourites, measurement preferences, scaling and recipe timers.

## Live site

Live site: https://soushi-eats.pages.dev

- Public collection: `/`
- Public recipe links: `/recipes/<recipe-id>`
- Owner sign-in and management: `/admin`
- Read-only public API: `GET /api/recipes`
- Protected owner API: `GET /admin/api/state`, `PUT /admin/api/state`

The primary Pages site uses Google sign-in through Cloudflare Access. Its Access application allows only the Google provider and redirects directly to it. Exact-email policies allow the configured owner and collaborator, with 24-hour sessions. The earlier secondary Workers hostname retains its previous email-code configuration. Account emails are configured as runtime bindings and Access policies, never embedded in this repository.

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

The database stores one versioned collection document. Public responses use an explicit field allowlist and never include personal notes, favourites, settings, email addresses or checklist state.

Signed-in writes require a valid Access RSA signature, issuer, audience, expiry and an exact match to OWNER_EMAIL or COLLABORATOR_EMAIL. Writes also require a same-origin JSON request with a custom header and the current collection revision. Stale updates return a conflict instead of overwriting another tab's work.

The last 30 previous collection revisions are retained in `state_history`. Export a backup from the owner collection for an independent copy. Failed saves also leave a browser-local recovery download, available through **Recover unsaved work**. Recovery exports are private and must not be committed here.

To restore a database revision, first export the current collection and inspect `state_history` through the Cloudflare dashboard. Restore only the intended JSON document and increment the current revision. A code rollback does not restore database contents. Do not deploy builds from before shared accounts, because those builds do not preserve collaborator private state.

## Measurement rules

Temperature, mass, liquid volume, spoons, cups and lengths have separate display preferences. AU, US and UK measures remain distinct. Volume-to-weight conversion requires an ingredient-specific value and is labelled as an estimate. Unknown units remain unresolved. Fan mode, bake time and choice of tin are not changed by unit conversion or ingredient scaling.

## Timer limits

Countdowns persist absolute end times, plus pause/resume and add-a-minute controls. The page gives an on-page alert and sound, and offers browser notifications when supported and permitted. This version needs the page open. A sleeping browser, locked phone or closed tab can delay or prevent alerts. Background push notifications are not implemented.

## Recipe content

The initial hojicha Basque cheesecake recipe was supplied by the owner. Its baking guidance has not been independently tested.

## Editing

Use **+ New recipe** to open the Import tab for AI JSON output or a backup. Choose **Create manually** to start a blank recipe. **Edit recipe** opens the same form for an existing recipe. Details, Ingredients and Method tabs support titles, descriptions, tags, cooking metadata, ingredient amounts and notes, and ordered method steps. Insert ingredient amount chips into instructions to keep them linked to batch scaling. Optional step tips and timers are editable. Preview before saving, or cancel without changing the saved recipe. Removing an ingredient referenced in the method requires removing its amount chips first.

Batch size uses a custom multiplier, with ingredient-based scaling available in the same menu. **Delete recipe** requires an in-app confirmation. Public visitors can adjust only their own view, checklist state and timers.

## Shared accounts

Soushi is the owner and Light is an editor. Both can add, edit and delete any recipe. The primary Pages deployment maps COLLABORATOR_EMAIL to Light after verifying the Access JWT. The secondary Worker remains owner-only, but runs the same data-preserving build.

Recipe credits are assigned by the server using the signed-in account. Existing recipes default to Soushi. An edit retains the original creator. Public cards and recipe pages show only display names, and the collection has a person filter.

The existing top-level states, preferences and densities remain Soushi's private data. Light's private data lives under privateUsers.light in the same versioned document. API responses return only the current user's private fields. Client-supplied profile data, other users' private data and forged recipe credits are ignored. Saves preserve the other person's private fields, validate progress against current recipe contents and use the existing revision conflict protection. Recovery downloads use separate browser keys for each account.

## Shared notes, photos and covers

Apply `migrations/002_contributions.sql` to the existing D1 database before deploying this build. It only creates new tables and indexes; it does not change existing recipes or private notes. Deploy both Pages and the secondary Worker using the same build.

Each signed-in person has one public note per recipe, labelled with the name from their verified account. Saving an empty note removes it from public view. Earlier private notes stay in personal state and can be published by their author using **Share this note**. Favourites, checklist ticks, display settings and unshared notes stay personal.

**Add photo** accepts JPEG, PNG and WebP files up to 20 MB. The browser resizes to a maximum edge of 1,600 pixels and re-encodes to JPEG under 700 KB, removing source metadata. The server accepts bounded JPEG data only and stores it in the separate `recipe_photos` table, outside the 1 MB recipe document. There are at most 12 active photos per recipe. Public collection responses contain photo metadata and same-origin image URLs, never image payloads or account emails. Images have an explicit image MIME type and `nosniff` headers.

Signed-in users can select **Use as cover**, or choose **AI artwork** or **Photo** to save the default cover for everyone. Visitors may switch their own view without changing the saved cover. Removing the selected photo falls back to the artwork. Uploaders can remove their own photos; the owner can remove either person's photos. Removal soft-deletes the record. Photos attached to deleted recipes are no longer served publicly.

Notes, photos and cover choices use separate endpoints and tables, so they do not conflict with recipe edits or expose personal state. The JSON export includes shared notes and photo/cover metadata, with image URLs. Image bytes are in D1 and are not embedded in JSON exports. A full database backup must include all three contribution tables as well as `app_state` and `state_history`; the collection revision history covers recipe and personal state, rather than the contribution tables.
