# SITEYFY Commerce

Bilingual e-commerce storefront and administration system deployed as one Docker service.

- Storefront: `/`
- Administration: `/admin/`
- Current production domain: `https://ecommerce.siteyfy.com`

## Development

Create `.env` from secure environment values, then run:

```bash
docker compose up -d --build
docker compose ps
docker logs --tail 100 slyrah-commerce
```

Runtime data, uploaded media, integration credentials, and the SQLite database are intentionally excluded from Git. Never commit `.env`, database backups, API keys, customer data, or downloaded reports.

## Project Context

Read [PROJECT_MEMORY.md](PROJECT_MEMORY.md) for architecture and business rules, and [HANDOFF.md](HANDOFF.md) for the SSH, memory, Git, verification, deployment, and shift-transfer workflow. AI coding agents must also follow [AGENTS.md](AGENTS.md).

The project has a local CodeGraph index on the VPS. Start code investigations with:

```bash
codegraph status
codegraph explore "Trace the feature or problem end to end"
```
