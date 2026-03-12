# Contributing to CronPulse

Thanks for your interest in contributing! Here's how to get started.

## Getting started

1. Fork the repository
2. Clone your fork
3. Create a feature branch (`git checkout -b feat/my-feature`)
4. Make your changes
5. Commit using [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`)
6. Push and open a Pull Request

## Local development

```bash
# Install dependencies
bun install

# Copy env file and configure
cp .env.example .env.local

# Start the database
docker compose up db -d

# Push schema to database
bunx drizzle-kit push

# Start dev server
bun dev
```

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Follow the existing code style
- Use TypeScript strict mode — no `any` types
- Use shadcn/ui components for UI changes

## Questions?

Open an issue and we'll help you out.
