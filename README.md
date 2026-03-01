# Lesson Plan Adapter

**Lesson Plan Adapter** is a hosted MCP integration for K-12 teachers who use Claude and want classroom-ready adaptations grounded in Universal Design for Learning. The core interaction is intentionally simple: a teacher defines their classroom profile once, then reuses it whenever they paste a lesson plan. That persistent context changes the entire quality of the assistance. Instead of generic “differentiate for ELLs” advice, the system can generate activity-specific options tied to the teacher's grade band, subject, time block, device constraints, and the UDL-aligned learning needs they selected. It is designed to produce concrete choices a teacher can implement immediately, while also making the reasoning visible so the teacher learns the pattern, not just the answer.

Available across Claude web, desktop, and mobile via a hosted MCP server with OAuth authentication.

## How It Works

1. **Onboarding** — A teacher connects the integration and gets an interactive artifact to set up their classroom profile: check boxes for learning needs across three UDL categories (representation, expression, engagement) and optional teaching context (grade range, subjects, block length).
2. **Adaptation** — The teacher pastes a lesson plan. The adapter reads their profile and generates specific suggestions tied to named activities in the plan, not generic accommodation language.
3. **Profile updates** — The teacher can edit their profile at any time. Changes persist across sessions.

### Architecture

Under the hood, this is a remote MCP server with persistence, not a prompt in a trench coat. The system stores a single learning profile per user and uses it as durable context across Claude sessions, which is what makes the adaptations consistent and meaningfully personalized over time. That same persistence layer also stores adaptation summaries and teacher reflections, so the assistant can avoid repeating strategies that didn't work and reinforce patterns that did. Continuity is a product feature here, not just a technical detail.

The implementation is a Bun and Turbo monorepo with three main layers. The web application is a SvelteKit app that handles authentication UI, Google sign-in, OAuth endpoints, and the MCP HTTP transport. The MCP package contains the server logic, including tools, resources, prompts, the UDL taxonomy, and orchestration instructions that guide Claude through setup, adaptation, and deep-dive flows. The database package provides the Drizzle schema, migrations, and shared database client, with the data model covering auth and session tables, OAuth client and token records, MCP session tracking, the persistent profile, saved adaptations, and reflection entries tied to those adaptations.

The MCP surface area is deliberately shaped around a teacher workflow rather than a grab bag of endpoints. Profile tools manage the persistent classroom context, workflow tools save and retrieve adaptations and reflections, and follow-up tools generate materials or simplify text when a teacher wants to implement a specific strategy. Resources expose the current user and profile state so Claude can reason consistently, and prompts enforce structured flows so the system stays predictable and safe.

Security and privacy are treated as baseline requirements, not optional polish. OAuth uses authorization code flow with PKCE, redirect URIs are checked strictly, tokens are hashed at rest, and MCP sessions are scoped per user and evicted after inactivity. The privacy posture is classroom-level only, with explicit instructions not to store or repeat student names and to sanitize reflection inputs so teachers don't accidentally turn their notes into a data leak.

## Connect in Claude

Once the server is deployed, any teacher can connect it from Claude's settings:

1. Open [claude.ai](https://claude.ai) (or the Claude desktop/mobile app).
2. Go to **Settings → Integrations → Add More**.
3. Enter the server URL (e.g., `https://your-deployed-url.example.com/mcp`).
4. Claude will redirect you to sign in with Google and approve the connection.
5. Once connected, start a new conversation and ask Claude to help you set up your classroom profile — it will walk you through selecting your learning needs.

To adapt a lesson plan, paste it into the conversation and ask Claude to adapt it for your classroom.

## Project Structure

```
applications/web/          SvelteKit app — UI, OAuth endpoints, MCP transport
packages/database/         Drizzle schema, migrations, shared database client
packages/mcp/              MCP server factory, tools, resources, prompts, taxonomy
scripts/                   Migration runner
```

### MCP Primitives

| Type     | Name                      | Purpose                                                               |
| -------- | ------------------------- | --------------------------------------------------------------------- |
| Tool     | `get_user_profile`        | Returns the authenticated user's profile                              |
| Tool     | `set_learning_needs`      | Replaces the teacher's learning needs (validates tags and categories) |
| Tool     | `update_teaching_context` | Partially updates teaching context fields                             |
| Tool     | `get_available_tags`      | Returns the full 32-tag UDL taxonomy grouped by category              |
| Resource | `user_profile`            | User profile as a JSON resource                                       |
| Resource | `learning_profile`        | Learning needs and teaching context with a natural language summary   |
| Prompt   | `adapt_lesson`            | Generates adaptation suggestions for a pasted lesson plan             |
| Prompt   | `onboarding`              | Generates the interactive classroom profile setup/edit artifact       |
| Prompt   | `summarize`               | General-purpose topic summarization                                   |

## Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- [Neon CLI](https://neon.tech/docs/reference/neon-cli) (`brew install neonctl`)
- A [Neon](https://neon.tech) account with a project
- Google OAuth credentials (client ID and secret)

## Quick Start

### Automated Setup

```sh
bun install
```

Then use the `/setup` skill in Claude Code. It walks you through creating a Neon project, configuring environment variables, optionally setting up Railway and GitHub secrets, running the initial migration, and generating SvelteKit types.

### Manual Setup

1. **Install dependencies**

   ```sh
   bun install
   ```

2. **Create a Neon project** and enable Neon Auth in the [Neon Console](https://console.neon.tech):

   ```sh
   neonctl projects create --region-id aws-us-east-2
   ```

   Enable Neon Auth in the project dashboard under the "Auth" tab. This creates the `neon_auth` schema (user, session, account, verification tables) that the app depends on.

3. **Create `.env.local`** in the project root:

   ```sh
   DATABASE_URL=<pooled connection string from Neon>
   DATABASE_URL_UNPOOLED=<direct connection string from Neon>
   BETTER_AUTH_URL=http://localhost:4545
   BETTER_AUTH_SECRET=<min 32 chars — generate with: openssl rand -hex 32>
   GOOGLE_CLIENT_ID=<your Google OAuth client ID>
   GOOGLE_CLIENT_SECRET=<your Google OAuth client secret>
   ```

4. **Run migrations**

   ```sh
   bun scripts/migrate.ts
   ```

5. **Start the dev server**

   ```sh
   bun turbo dev
   ```

   The app runs at `http://localhost:4545`.

## Development

### Commands

| Command                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `bun turbo dev`         | Start dev server on port 4545                        |
| `bun turbo build`       | Production build                                     |
| `bun turbo typecheck`   | TypeScript checking across all packages              |
| `bun turbo lint`        | ESLint across all packages                           |
| `bun turbo format`      | Prettier across all packages                         |
| `bun turbo test`        | Run all tests                                        |
| `bun turbo db:generate` | Generate Drizzle migration files from schema changes |
| `bun turbo db:validate` | Validate migrations match the current schema         |

### Testing

- `packages/database` and `packages/mcp` use `bun test`
- `applications/web` uses `vitest`
- Run everything with `bun turbo test`

### Testing MCP Locally

1. Start the dev server:

   ```sh
   bun turbo dev
   ```

2. Expose via Cloudflare Tunnel (for testing with claude.ai):

   ```sh
   bunx cloudflared tunnel --url http://localhost:4545
   ```

   Add the tunnel URL + `/mcp` as a custom MCP connector in claude.ai to test the full OAuth flow.

3. Or use the MCP Inspector (for local debugging):

   ```sh
   bunx @modelcontextprotocol/inspector
   ```

### Database Migrations

When changing `packages/database/src/schema.ts`:

```sh
bun turbo db:generate
```

**Important:** Drizzle will include `CREATE TABLE "neon_auth".*` statements in the generated SQL. You must manually remove all `neon_auth` DDL from the migration file — those tables are managed by Neon, not by Drizzle. Keep any FK references from public tables to `neon_auth.user`.

Then apply:

```sh
bun scripts/migrate.ts
```

## Environment Variables

### Required

| Variable               | Package                    | Description                           |
| ---------------------- | -------------------------- | ------------------------------------- |
| `DATABASE_URL`         | `@lesson-adapter/database` | Neon pooled connection string         |
| `BETTER_AUTH_SECRET`   | `@lesson-adapter/web`      | Min 32 chars — `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID`     | `@lesson-adapter/web`      | Google OAuth client ID                |
| `GOOGLE_CLIENT_SECRET` | `@lesson-adapter/web`      | Google OAuth client secret            |

### Required for Migrations

| Variable                | Package                    | Description                                |
| ----------------------- | -------------------------- | ------------------------------------------ |
| `DATABASE_URL_UNPOOLED` | `@lesson-adapter/database` | Neon direct (non-pooled) connection string |

### Optional

| Variable                | Default       | Description                                                         |
| ----------------------- | ------------- | ------------------------------------------------------------------- |
| `BETTER_AUTH_URL`       | inferred      | Better Auth base URL (set explicitly in production behind a proxy)  |
| `MCP_TOKEN_TTL_SECONDS` | `3600`        | OAuth access token lifetime in seconds                              |
| `LOG_LEVEL`             | `info`        | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`) |
| `NODE_ENV`              | `development` | `development`, `production`, or `test`                              |
| `SKIP_ENV_VALIDATION`   | —             | Set to `true` to skip Zod validation at build time                  |

Each package validates its own variables via `src/env.ts` using Zod. Import from the relevant `env.ts` rather than reading `process.env` directly.

## Deployment

### Prerequisites

Before deploying, you need:

- A **Neon project** with **Neon Auth enabled** (this creates the `neon_auth` schema)
- **Google OAuth credentials** with the production callback URL configured
- The database **migration applied** against production (see step 3 below)

### Step 1: Create a Railway Service

Connect your GitHub repository to [Railway](https://railway.com). Railway detects the `Dockerfile` and handles build/deploy automatically.

The Dockerfile uses a two-stage build:

- **Builder:** `oven/bun:1` — installs dependencies and runs `bun turbo build`
- **Runner:** `node:22-slim` — serves `node build/index.js` on port 3000

### Step 2: Set Environment Variables

In the Railway dashboard, set these variables:

| Variable                | Value                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`          | Neon pooled connection string                                     |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string                                     |
| `BETTER_AUTH_URL`       | Your Railway public URL (e.g., `https://your-app.up.railway.app`) |
| `BETTER_AUTH_SECRET`    | Min 32 chars — generate with `openssl rand -hex 32`               |
| `GOOGLE_CLIENT_ID`      | From Google Cloud Console                                         |
| `GOOGLE_CLIENT_SECRET`  | From Google Cloud Console                                         |
| `NODE_ENV`              | `production`                                                      |
| `LOG_LEVEL`             | `info`                                                            |

`MCP_TOKEN_TTL_SECONDS` defaults to 3600 (1 hour) if not set.

### Step 3: Run the Initial Migration

From your local machine, using the production unpooled connection string:

```sh
DATABASE_URL=<production pooled string> \
DATABASE_URL_UNPOOLED=<production unpooled string> \
bun scripts/migrate.ts
```

This creates the `public` schema tables (`oauth_clients`, `oauth_codes`, `oauth_tokens`, `mcp_sessions`, `learning_profiles`). The `neon_auth` tables must already exist from enabling Neon Auth in the Neon Console.

### Step 4: Configure Google OAuth Callback

In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add your production URL to the authorized redirect URIs. The exact callback path depends on your Neon Auth configuration.

### Step 5: Configure the Health Check

Point Railway's health check at:

```
GET /health
```

This returns `{ "status": "ok" }` with no authentication required.

### Step 6: Deploy

Push to `main` (or merge the PR). Railway builds and deploys automatically.

### Production Considerations

- **MCP sessions are in-memory.** Every deploy clears active MCP sessions. Clients re-authenticate automatically via OAuth. Session metadata is persisted in the database for audit purposes, but the active transport connections are lost on restart.
- **Neon region.** The default is `aws-us-east-2` (Ohio). Choose a region close to your Railway deployment for lower latency.
- **Token lifetime.** The default 1-hour TTL (`MCP_TOKEN_TTL_SECONDS=3600`) means clients re-authenticate roughly once per session. Adjust if your use case needs longer-lived tokens.

## CI/CD

Two GitHub Actions workflows are included:

- **Pull Request** — Runs typecheck, lint, and tests.
- **Claude Code Review** — Runs an automated code review on PR open (not on every push). Has a 5-minute timeout.
- **Production** — Runs migrations on push to `main`.

Required GitHub secrets:

| Secret                    | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `NEON_PROJECT_ID`         | Neon project ID (for PR branch creation)        |
| `NEON_API_KEY`            | Neon API key (for PR branch creation)           |
| `DATABASE_URL`            | Production pooled connection string             |
| `DATABASE_URL_UNPOOLED`   | Production direct connection string             |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code OAuth token (for automated reviews) |

The setup wizard can configure these automatically via `gh secret set`.

## OAuth Flow

The app implements a complete OAuth 2.0 authorization server for MCP clients:

```
MCP Client                          This Server
    │                                    │
    ├─ POST /register ──────────────────►│  Dynamic client registration
    │◄── { client_id, client_secret } ───┤
    │                                    │
    ├─ GET /.well-known/oauth-           │
    │      authorization-server ────────►│  Discover endpoints
    │◄── { token_endpoint, ... } ────────┤
    │                                    │
    ├─ GET /authorize?client_id=...     ►│  User sees consent page
    │   &code_challenge=...              │  (redirects to Google sign-in
    │                                    │   if not authenticated)
    │◄── 302 redirect_uri?code=... ──────┤
    │                                    │
    ├─ POST /token ─────────────────────►│  Exchange code for token
    │   { code, code_verifier }          │  (PKCE S256 validated)
    │◄── { access_token, ... } ──────────┤
    │                                    │
    ├─ POST /mcp ───────────────────────►│  MCP requests with
    │   Authorization: Bearer <token>    │  Bearer authentication
    │◄── MCP response ──────────────────┤
```

All credentials (tokens, authorization codes, client secrets) are stored as SHA-256 hashes. PKCE is mandatory (S256 only). Token and secret comparisons use timing-safe equality.

## License

MIT
