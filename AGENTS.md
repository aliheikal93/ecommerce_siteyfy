# SITEYFY Engineering Instructions

## Start Here

1. Read `PROJECT_MEMORY.md` and `HANDOFF.md` before changing code or data.
2. Run `codegraph status` from this directory.
3. Use `codegraph explore "<question>"` before `rg`, `find`, or broad file reads when locating behavior or tracing relationships.
4. For a known symbol, use `codegraph node <symbol>` or `codegraph callers <symbol>`.
5. After source edits, run `codegraph sync` so the index remains current.

When entering through a plain SSH command rather than a remote workspace, run `./scripts/codex-context.sh` once to print the durable project memory and verify the graph. Pass a question to that script to explore it immediately.

The `.codegraph/` index is part of the VPS workspace and is the primary structural memory for this project. Do not delete or reinitialize it unless the user explicitly requests a full rebuild.

## Environment

- Production workspace on VPS: `/root/slyrah-clone`
- Public site: `https://ecommerce.siteyfy.com`
- Admin: `https://ecommerce.siteyfy.com/admin/`
- Docker Compose service/container: `slyrah` / `slyrah-commerce`
- Published port: `3010:3000`
- Persistent database in the container: `/app/data/slyrah.sqlite`
- Uploaded media is mounted from `public/uploads/`

This directory is not currently a Git repository. Never treat generated reference bundles in `mirror-*` or `public/_next` as the source of the active storefront.

## Change Discipline

- Preserve the dynamic storefront header, footer, identity, bilingual content, and responsive behavior.
- Do not hardcode credentials, callback domains, products, store identity, shipping prices, or payment availability in public JavaScript.
- Secrets belong in `.env` or encrypted settings in SQLite and must never appear in logs, screenshots, documentation, or responses.
- Back up SQLite before migrations, bulk imports, or settings rewrites.
- Do not remove Docker volumes or overwrite the live database.
- Use the existing entity/settings persistence helpers and normalization functions in `server.js`.

## Verification

Run at minimum:

```bash
node --check server.js
node --check public/admin/assets/app.js
node --check public/storefront/store.js
codegraph sync
docker compose up -d --build
docker compose ps
docker logs --tail 100 slyrah-commerce
```

For UI or checkout changes, verify desktop and mobile with Playwright against the live domain. Preserve current provider states during tests; if a test toggles a live setting, restore it immediately.
