# Deploying DebitKash to Vercel

DebitKash is a Next.js 16 app (App Router) using Prisma + Neon Postgres, NextAuth
(JWT sessions), and the Safaricom M-Pesa Daraja **production** B2C API.

The database (Neon) is already cloud-hosted, so only the web app gets deployed.

---

## 1. Import the GitHub repo into Vercel

1. Go to https://vercel.com/new
2. Import **BrianMumo/debitkash** (authorize GitHub access if prompted).
3. **Project name:** `debitkash` → your default URL becomes
   `https://debitkash.vercel.app` (used below; adjust if Vercel assigns a suffix).
4. Framework preset: **Next.js** (auto-detected). Leave build/output settings default.
   - Build command: `next build` (default)
   - Install command: `npm install` (the `postinstall` hook runs `prisma generate`)
5. **Do not deploy yet** — add the environment variables first (next step).

## 2. Set Environment Variables

In the import screen (or **Project → Settings → Environment Variables**), add the
following for the **Production** (and Preview) environment. Copy the *values* from
your local `.env.local` unless noted otherwise.

| Variable | Value source |
|---|---|
| `DATABASE_URL` | from `.env.local` (Neon connection string) |
| `AUTH_SECRET` | from `.env.local` |
| `AUTH_URL` | `https://debitkash.vercel.app` (your production URL) |
| `NEXT_PUBLIC_APP_URL` | `https://debitkash.vercel.app` (your production URL) |
| `MPESA_ENVIRONMENT` | `production` |
| `MPESA_CONSUMER_KEY` | from `.env.local` |
| `MPESA_CONSUMER_SECRET` | from `.env.local` |
| `MPESA_SHORTCODE` | from `.env.local` |
| `MPESA_INITIATOR_NAME` | from `.env.local` |
| `MPESA_SECURITY_CREDENTIAL` | from `.env.local` |

> `ADMIN_EMAIL` / `ADMIN_PASSWORD` are **not** needed in Vercel — they are only used
> by the local `prisma/seed.ts` script.

> `AUTH_URL` is technically optional because `auth.ts` sets `trustHost: true`, but
> setting it explicitly avoids any host-detection edge cases.

## 3. Deploy

Click **Deploy**. The build runs `prisma generate` (postinstall) then `next build`.
`DATABASE_URL` is present at build time, so any server components that read the DB
build fine.

## 4. Fix the URLs if the domain differs

If Vercel assigned a domain other than `https://debitkash.vercel.app` (or you add a
custom domain), update **both** `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the real
domain, then **redeploy** (Deployments → ⋯ → Redeploy). This matters because the
M-Pesa callback URLs are built from `NEXT_PUBLIC_APP_URL`.

## 5. Point M-Pesa callbacks at the live domain

The app sends these result/timeout URLs to Safaricom on every B2C / balance call
(derived from `NEXT_PUBLIC_APP_URL`):

- `https://<domain>/api/mpesa/callback/b2c-result`
- `https://<domain>/api/mpesa/callback/b2c-timeout`
- `https://<domain>/api/mpesa/callback/balance-result`
- `https://<domain>/api/mpesa/callback/balance-timeout`

Once `NEXT_PUBLIC_APP_URL` is the production domain, these resolve automatically.
If your Safaricom org portal has registered/whitelisted callback URLs, update them
to the production domain there too.

## 6. ⚠️ M-Pesa production IP whitelisting

These are **live** credentials. Some Safaricom production apps require the server's
**outbound IP** to be whitelisted. Vercel uses rotating egress IPs, so if your
shortcode enforces an IP allowlist for outbound API calls, the B2C/balance requests
may be rejected from Vercel even though inbound callbacks work.

- If it works from Vercel → done.
- If outbound calls are rejected → host on a platform with a **static outbound IP**
  (Railway, Render paid, or a VPS), or use Vercel's static-IP offering.

## 7. First login

The seeded admin account is `lipanacash@gmail.com`. Log in at
`https://<domain>/login` and change the password from **Settings**.

## Security reminders

- `.env` / `.env.local` are gitignored and were never committed — keep it that way.
- Consider **rotating** the M-Pesa production credentials and `AUTH_SECRET` if they
  have been shared anywhere outside the deployment.
