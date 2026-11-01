# Deploy building showcase to Vercel

Building-only mode (`VITE_BUILDING_ONLY=true`), same as the client zip.

## Before you start

1. **Repo layout** — Vercel must see both `app/` and `content/` (orbit JPEGs live in `content/building/`).  
   The GitHub repo `velbee-visuals-demo` today only has `docs/` for Pages; for Git-based Vercel deploy, commit `app/` + `content/building/` (+ `content/floors.csv` if present) or import via CLI from this machine.

2. **Deployment size** — Orbit image assets are large. Vercel Hobby has a **~100 MB deployment** limit; a full bundle may fail. If it does:
   - Upgrade to Vercel Pro, **or**
   - Host images on **Cloudflare R2** and set **`VITE_R2_PUBLIC_BASE`** (or `VITE_CONTENT_BASE`) in Vercel → Project → Settings → Environment Variables, then redeploy (app bundle only).

3. **Secrets** — Do not commit `.env` with keys. Set `VITE_*` vars in the Vercel dashboard (build time).

## Option A — Vercel CLI (fastest from your PC)

```bash
cd D:\knt\visuals\app
npm install
npx vercel login
npx vercel
```

Follow prompts (link to your GitHub repo or create a new project). Production:

```bash
npx vercel --prod
```

CLI uses `vercel.json`: build `npm run build:vercel`, output `dist/`.

## Option B — GitHub + Vercel dashboard

1. [vercel.com](https://vercel.com) → **Add New Project** → import `kosurinagatarun/velbee-visuals-demo` (after pushing `app/` + `content/`).
2. **Root Directory:** `app`
3. **Framework Preset:** Vite (auto)
4. **Build Command:** `npm run build:vercel` (already in `vercel.json`)
5. **Output Directory:** `dist`
6. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `VITE_BUILDING_ONLY` | `true` |
   | `VITE_PROJECT_TITLE` | Your project name |

   (`--mode client` also reads `app/.env.client` if that file is committed.)

7. **Deploy**

## After deploy

- Open the `*.vercel.app` URL — single page, drag to spin, scroll to zoom.
- Custom domain: Vercel → Project → **Domains**.

## Local check (same as Vercel build)

```bash
cd app
npm run build:vercel
npx serve dist -s
```
