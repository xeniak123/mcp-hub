# Security Policy

## Supported versions

Only the latest release of the `xeniak10/mcp-hub` image is supported.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for security problems.
Use GitHub's **Private vulnerability reporting** (Security → Report a vulnerability)
on this repository, or contact the maintainer directly. You can expect an initial
response within 7 days.

## Security model & notes

- **Connector configs** (API tokens, DSNs…) are encrypted at rest with AES-256-GCM
  using `MASTER_ENCRYPTION_KEY`. The key auto-generates into the `app-data` volume if
  unset — set it explicitly in production so secrets survive volume loss.
- **API keys** are stored only as SHA-256 hashes with a short display prefix; they are
  shown once at creation.
- **Sessions** are httpOnly cookies signed with `SESSION_SECRET`. If left empty the hub
  uses a per-boot random secret — every restart logs users out (and invalidates old
  cookies). Set it explicitly in production.
- **Login** is rate-limited; all mutating actions are written to an audit log.
- **Connectors run as child processes inside the hub container** with your configured
  environment variables. Only install connectors you trust: a connector manifest can
  run arbitrary commands (`npx`/`uvx` packages) with the hub container's privileges.
  Custom manifests come from *your own* `connectors/` volume — treat that directory as
  privileged input.
- The MCP endpoint (`/mcp`) accepts either a session cookie or a Bearer API key; the
  web UI and REST API require a session.
