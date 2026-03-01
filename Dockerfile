FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY applications/web/package.json ./applications/web/
COPY packages/components/package.json ./packages/components/
COPY packages/database/package.json ./packages/database/
COPY packages/mcp/package.json ./packages/mcp/

RUN bun install --frozen-lockfile

COPY . .

ENV SKIP_ENV_VALIDATION=true
RUN bun turbo build --filter=@lesson-adapter/web

FROM node:22-slim AS runner

WORKDIR /app

COPY --from=builder /app/applications/web/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/applications/web/package.json ./
COPY --from=builder /app/distribution ./distribution

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "build/index.js"]
