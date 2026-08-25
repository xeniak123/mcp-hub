# ---- build stage ----
FROM node:20-slim AS build
# Git commit baked into the image for the version display in Settings.
ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
COPY packages/web ./packages/web
RUN npm run build -w @hub/shared \
 && npm run build -w @hub/server \
 && npm run build -w @hub/web \
 && npm prune --omit=dev

# ---- runtime stage ----
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app

# node for npx-spawned connectors, python3+uv for python-based ones
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && curl -LsSf https://astral.sh/uv/install.sh | sh \
 && mv /root/.local/bin/uvx /usr/local/bin/uvx || true

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/migrations ./packages/server/migrations
COPY --from=build /app/packages/web/dist ./packages/web/dist

ENV DATA_DIR=/app/data PATH="/usr/local/bin:${PATH}"
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "packages/server/dist/index.js"]
