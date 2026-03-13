# Contributing to CronPulse

Thanks for your interest in contributing! This guide will help you get set up and make your first contribution.

## Finding something to work on

- Check [open issues](https://github.com/AneeshaRama/cronpulse/issues) — look for the **good first issue** label if you're new
- Have an idea? Open an issue first to discuss it before writing code

## Prerequisites

- [Bun](https://bun.sh/) (preferred) or Node.js 20+
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (for the database)
- Git

## Getting started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/cronpulse.git
   cd cronpulse
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feat/my-feature
   ```

## Local development setup

```bash
# Install dependencies
bun install

# Copy env file and configure
cp .env.example .env.local
```

Edit `.env.local` and set the database URL for local development:

```bash
DATABASE_URL="postgresql://cronpulse:cronpulse@localhost:5432/cronpulse"
AUTH_SECRET="any-random-string-for-dev"
CRON_SECRET="any-random-string-for-dev"
```

Start the database and dev server:

```bash
# Start PostgreSQL
docker compose up db -d

# Push the schema to your database
bunx drizzle-kit push

# Start the dev server
bun dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Running tests

Tests run against a separate test database:

```bash
# Create the test database (one-time setup)
docker exec cronpulse-db-1 psql -U cronpulse -d cronpulse -c "CREATE DATABASE cronpulse_test;"

# Run tests
TEST_DATABASE_URL="postgresql://cronpulse:cronpulse@localhost:5432/cronpulse_test" bun run test
```

## Database migrations

After changing the schema in `src/lib/db/schema.ts`:

```bash
# Generate a migration
bunx drizzle-kit generate

# Push changes to your local database
bunx drizzle-kit push
```

## Commit conventions

We use [conventional commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `chore:` | Maintenance, dependencies, config |
| `docs:` | Documentation changes |
| `test:` | Adding or updating tests |
| `refactor:` | Code changes that don't fix bugs or add features |

Examples:
```
feat: add Telegram alert channel
fix: handle duplicate ping URLs on creation
docs: update self-hosting guide
chore: upgrade drizzle-orm to 0.46
```

## Code guidelines

- Keep PRs focused — one feature or fix per PR
- Follow the existing code style
- Use TypeScript strict mode — no `any` types
- Use shadcn/ui components for UI changes
- Write tests for new core functionality
- Make sure `bun run build` passes before pushing

## Questions?

Open an issue and we'll help you out.
