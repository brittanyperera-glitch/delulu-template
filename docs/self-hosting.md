# Self-hosting

About ten minutes. You need accounts at GitHub, [Neon](https://neon.tech)
and [Vercel](https://vercel.com); the free tiers are enough for a small group.

## 1. Get the code

Use the template button on GitHub, or fork the repo, so you have your own
copy that Vercel can build from.

## 2. Create the database

Create a Neon project and copy its connection string. It looks like
`postgres://user:password@host/db?sslmode=require`. That is your
`DATABASE_URL`.

Any Postgres works. The app picks the Neon driver for Neon hosts and the
standard `pg` driver for everything else (`src/lib/db/client.ts`).

## 3. Import into Vercel

In Vercel, Add New Project and import your copy. Framework Next.js, build
command `pnpm build`, install command `pnpm install`.

Or use the Deploy with Vercel button in the README. It does the same import
and also creates a Blob store for you.

## 4. Add the file store

In the project, Storage tab, Create Store, Blob. Choose public access. This
adds `BLOB_READ_WRITE_TOKEN` to the project. It holds photos, voice notes and
videos.

Blob is needed only for uploads. The upload route fails at runtime without
the token (`src/app/api/upload/route.ts`), so skip this step only if you are
happy with text-only posts.

## 5. Set the environment variables

Settings, Environment Variables. Add each to Production, Preview and
Development.

| Name | Value |
|---|---|
| `GROUP_CODE` | The passcode everyone types at the gate. Make it long. It is the only thing between the site and anyone who finds the URL. |
| `SESSION_SECRET` | At least 16 characters. `openssl rand -base64 32` makes one. |
| `DATABASE_URL` | The connection string from step 2. |
| `BLOB_READ_WRITE_TOKEN` | Set for you by step 4. |

## 6. Deploy, then run setup

Deploy. Variables reach only a new deployment, so redeploy if the first one
ran before you added them.

Open the site, enter the passcode and you land on `/setup`. Add 2 to 8
members (a name and a colour each), pick day one and the timezone. Then share
the URL and the passcode, and everyone adds it to their home screen.

## Signing everyone out

Changing `GROUP_CODE` or `SESSION_SECRET` invalidates every existing cookie,
so everyone has to enter the passcode again.

The placeholder values in `.env.example` are refused: every request fails with
a message naming the variable until you replace them, so set real values before
you deploy.

## Migrations

`pnpm build` runs `drizzle-kit migrate` before `next build`, so every production
deploy applies pending migrations and `DATABASE_URL` must be set at build time.
Drizzle records what it has applied, so this is safe to repeat.

Preview deployments skip the migration step: a preview build with the production
`DATABASE_URL` would apply unmerged migrations to production. Give Preview its
own database, or run `pnpm db:migrate` yourself against it.

Locally, `pnpm dev` does not migrate. Run `pnpm run setup` once, and
`pnpm db:migrate` after pulling a change that adds a migration. Both read
`.env.local`, then `.env`.

Do not pull production variables into `.env.local`. That would point local
development at the live database and your next `pnpm dev` would write real
rows.

## Custom domain

Add the domain under Settings, Domains in Vercel. Then, at your DNS host,
create a CNAME record from your subdomain (for example `delulu`) to the target
Vercel shows you. Vercel issues the certificate.

Use a CNAME, not a reverse proxy or a rewrite from another site. Next.js
server actions check that the request origin matches the host, and they fail
behind a proxy that changes it.

## Demo mode

For a public demo that anyone can open, set `DEMO_MODE=1`. Uploads are
disabled and a banner says the data is a demo. Then load fake members and
posts into the database:

```
pnpm seed:demo
```

Run it with the demo database's `DATABASE_URL`. Never run it against a
database that holds real posts.

Demo mode also does two things you do not want on a private site:

- `/demo-code` shows the passcode to anyone. It returns 404 unless `DEMO_MODE=1`.
- The daily cron in `vercel.json` calls `/api/demo-reset`, which wipes and
  reseeds the database. It only runs when `DEMO_MODE=1` and the request carries
  `CRON_SECRET`, so set `CRON_SECRET` only on the demo project.

Use a dedicated database for the demo, and change `DEMO_MODE` only with a
redeploy: the public `/about` page is built ahead of time.

## Troubleshooting

- Build fails on migrate: `DATABASE_URL` is missing or wrong for that environment.
- Gate rejects the passcode: the variable was added after the last deploy. Redeploy.
- Uploads fail: `BLOB_READ_WRITE_TOKEN` is not set, or `DEMO_MODE=1` is on.
