# MCP Hub — All-in-One MCP Server & Connector Ecosystem

Self-hosted hub that aggregates MCP (Model Context Protocol) connectors into a single
endpoint for your AI clients — with an App-Store-style web UI, one-click installs,
live logs and health monitoring.

```
Claude Desktop / Cursor ──Bearer key──▶  ┌─────────────────────┐
                                        │   MCP Hub (:3000)    │──▶ github (npx)
                                        │  /mcp   /api  Web UI │──▶ postgres (npx)
Web browser ──session cookie──▶         └─────────┬───────────┘──▶ slack (npx) …
                                                  ▼
                                            PostgreSQL 16
```

## Quick start

### A. Local / plain Docker

```bash
cp .env.example .env
# edit .env — set POSTGRES_PASSWORD (and optionally MASTER_ENCRYPTION_KEY / SESSION_SECRET)
docker compose up -d --build
```

### B. Portainer (web editor)

1. **Stacks → Add stack → Web editor** and paste [`portainer-stack.yml`](portainer-stack.yml).
2. Add an environment variable `POSTGRES_PASSWORD` (under **Environment variables**) before deploying.
3. Deploy — the image is pulled from Docker Hub (`xeniak123/mcp-hub:latest`), no build needed.

Open **http://<host>:3000** — on first visit you'll be asked to create the admin
account (bootstrap). Then:

1. Go to **Marketplace**, install e.g. *GitHub*, paste a token → the connector's child
   process starts in the background.
2. Go to **Settings** → create an API key.
3. Point your AI client at the hub:

```json
{
  "mcpServers": {
    "hub": {
      "url": "http://localhost:3000/mcp",
      "headers": { "Authorization": "Bearer mcp_YOUR_KEY" }
    }
  }
}
```

All connector tools appear namespaced as `github__create_issue`, `postgres__query`, …

## What you get

- **Marketplace** — 56 built-in connectors (GitHub, Slack, Postgres, Stripe,
  Filesystem, Fetch, Puppeteer, Jira, Linear, Notion, Sentry, Figma, Google Drive,
  Redis, MongoDB, Kubernetes, Cloudflare, Home Assistant, Telegram, Reddit…).
  One-click install, schema-driven config form, background dependency startup via
  `npx`/`uvx` inside the hub container. Search, category filters and sorting
  (official first / most installed / name).
- **Community connector repos** — paste a public GitHub repo URL in the Marketplace
  ("Community repos" section) and every valid connector manifest in it is fetched,
  validated and merged into your catalog (`community:owner/repo/<id>` namespaced,
  cached offline in the data volume). An `index.json` at the repo root lists files
  explicitly; otherwise root-level `*.json` are probed. New entries appear after a
  hub restart.
- **Custom connectors** — drop a JSON manifest into `./connectors/` (or the
  `connectors` volume) and it appears in the marketplace after a restart. See
  [`connectors/example.json.example`](connectors/example.json.example).
- **Dashboard** — live status badges (running / starting / error / stopped), stats
  tiles, instance search, bulk **Restart all** / **Stop all** with confirmation.
- **Connector detail** — rename instances inline, visual config editor, live tool
  preview (`tools/list` through the running process) with click-to-copy tool names,
  real-time log viewer (WebSocket tail) with level/text filters, follow mode and
  log download.
- **Light & dark theme** — toggle in the sidebar; persisted per browser.
- **Keyboard shortcuts** — `/` focuses search · `g d` dashboard · `g m` marketplace ·
  `g s` settings · `Esc` closes dialogs/blurs search.
- **PWA-ready** — installable manifest + SVG favicon.
- **Backup & restore** — one-click export of all installed connectors + configs to a
  JSON file; import restores them on a fresh instance (Settings page).
- **Account management** — change password (signs out all other devices), list active
  sessions with IP/user-agent, revoke any session.
- **Failure alerts** — set `ERROR_WEBHOOK_URL` and the hub POSTs a JSON alert whenever a
  connector enters the error state (works with Slack, Discord, Teams, generic receivers;
  5-minute per-connector cooldown).
- **Watchdog** — crashed processes restart with exponential backoff; health ping every
  30 s; boot recovery restores everything that was enabled before restart.
- **Monitoring & ops** — unauthenticated `GET /healthz` for uptime probes;
  `GET /api/meta` reports version + git commit (shown in Settings footer);
  API-key traffic on `/mcp` is rate-limited to 120 requests/min per key.
- **Security** — AES-256-GCM encrypted configs at rest, argon2id passwords, cookie
  sessions, hashed API keys, login rate limiting, audit log.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | ✅ | Password for the bundled PostgreSQL |
| `MASTER_ENCRYPTION_KEY` | – | `openssl rand -hex 32`. Auto-generated to `/app/data/master.key` if empty |
| `SESSION_SECRET` | – | Empty = random per boot (users get logged out on restart) |
| `APP_PORT` | – | Host port (default `3000`) |
| `LOG_RETENTION_LINES` | – | Ring buffer size per connector (default 5000) |
| `LOG_RETENTION_DAYS` | – | Log age limit (default 7) |
| `ERROR_WEBHOOK_URL` | – | URL to POST JSON alerts when a connector enters error state |

Volumes: `pgdata` (database), `app-data` (master key + state), `npx-cache`
(connector dependency cache — keeps restarts fast).

## Development

```bash
npm install
npm run dev        # server (watch) + web (vite dev server on :5173, proxied /api + /mcp)
npm run typecheck  # all workspaces
npm run build      # shared → server → web
```

Stack: npm workspaces · Fastify 5 · `@modelcontextprotocol/sdk` · PostgreSQL 16 ·
Vite + React 18 + Tailwind CSS v4 + TanStack Query.

### Layout

```
packages/
  shared/   types shared by server & web (manifests, API DTOs, WS events)
  server/   Fastify app: auth, registry (connector manifests), ConnectorManager,
            unified /mcp proxy, log pipeline, SQL migrations
  web/      React SPA served statically by the server in production
```

### Adding a connector

**Without rebuilding** (recommended): copy
[`connectors/example.json.example`](connectors/example.json.example) to
`connectors/<your-id>.json`, fill in the manifest (command argv with `{env.NAME}`
placeholders + JSON-schema config form) and restart the hub. Invalid files are skipped
with a warning in the logs; custom ids that collide with built-ins are ignored.

**From a GitHub repo**: Marketplace → *Community repos* → paste `owner/repo` (or a full
github.com URL). The hub fetches an `index.json` from the repo root (array of file
paths) or falls back to root-level `*.json` files, validates each against the same
schema as volume manifests, and caches them under `community:owner/repo/<id>` ids —
so they can never shadow built-ins and keep working offline after the first fetch.
Manage/remove repos in the same section; changes apply on next restart.

**Built-in**: create `packages/server/src/registry/connectors/<id>.ts` exporting a
`ConnectorManifest` and register it in `src/registry/index.ts`. It appears in the
marketplace immediately after rebuild.

### REST API summary

| Endpoint | Auth | Description |
| --- | --- | --- |
| `GET /healthz` | – | Liveness probe (DB ping only, no details) |
| `POST /api/auth/bootstrap` · `login` · `logout` | –/session | First-run account, sign-in/out |
| `GET /api/meta` | session | `{version, commit}` of the running build |
| `POST /api/auth/change-password` | session | Change password; revokes all other sessions |
| `GET /api/auth/sessions` · `DELETE /:id` | session | List/revoke active sessions |
| `GET /api/marketplace` | session | Catalog entries with install counts |
| `GET/POST /api/community/repos` · `DELETE /:repo` | session | Manage community connector repos |
| `POST /api/connectors` · `PUT/DELETE /:id` | session | Install / rename / uninstall |
| `PUT /api/connectors/:id/config` | session | Save encrypted config |
| `POST /api/connectors/:id/enable·disable·restart` | session | Lifecycle |
| `POST /api/connectors/restart-all` · `stop-all` | session | Bulk operations |
| `GET /api/connectors/:id/tools` | session | Live tool list from the running process |
| `GET /api/logs/:id?after=` + WS stream | session | Log tail |
| `GET/POST /api/keys` · `DELETE /:id` | session | API key management |
| `GET /api/backup` · `POST /api/backup/restore` | session | Config export/import |
| `POST /mcp` | Bearer key or session | Unified MCP endpoint (120 req/min per key) |

All mutating endpoints write to the audit log.

## Notes

- Connectors run as **child processes inside the hub container** (`npx -y pkg@version`
  or `uvx`). No docker socket is mounted. Python-based connectors need `uvx` — it is
  installed into the runtime image.
- The MCP endpoint is **stateless Streamable HTTP** (`/mcp`) — any HTTP MCP client works.
- Resources are exposed under `connector://<slug>/<original-uri>`.
