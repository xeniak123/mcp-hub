CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip         TEXT
);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_prefix   TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE connectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id     TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'stopped',
  status_detail   TEXT,
  pid             INTEGER,
  restart_count   INTEGER NOT NULL DEFAULT 0,
  last_healthy_at TIMESTAMPTZ,
  installed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_connectors_registry ON connectors(registry_id);

CREATE TABLE connector_configs (
  connector_id UUID PRIMARY KEY REFERENCES connectors(id) ON DELETE CASCADE,
  ciphertext   BYTEA NOT NULL,
  key_version  INTEGER NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE logs (
  id           BIGSERIAL PRIMARY KEY,
  connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
  level        TEXT NOT NULL DEFAULT 'info',
  message      TEXT NOT NULL
);
CREATE INDEX idx_logs_connector_time ON logs(connector_id, id DESC);

CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  detail     JSONB NOT NULL DEFAULT '{}',
  ip         TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
