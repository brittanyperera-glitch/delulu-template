# Contributing

Fixes and small features are welcome. Open an issue first for anything large.

Setup needs Node 22 and pnpm 10 (`corepack enable`):

```
pnpm install && pnpm run setup && pnpm dev
```

Use `pnpm run setup`: plain `pnpm setup` is a built-in pnpm command.

Before you open a PR, run what CI runs (`pnpm format` fixes Biome issues):

```
pnpm typecheck && pnpm lint && pnpm test
```

Tests:

- They live in `tests/unit`, `tests/components` and `tests/db`.
- Database tests run the real migrations in `drizzle/` against in-memory Postgres.
- Build test data with `tests/factories.ts`. Do not hard-code member names.
- Changing what an existing test asserts needs a reason in the PR description.
