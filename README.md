# velbee-visuals-demo

Public demo of **VelBEE Visuals** — interactive **360° building orbit** (301 frames). Building showcase only (no floors or tours).

## Live demo

**GitHub Pages:** https://kosurinagatarun.github.io/velbee-visuals-demo/

**Vercel:** https://velbee-visuals-demo.vercel.app/ (auto-deploys from `main`; builds `app/` via root `vercel.json`)

After the first deploy, GitHub Pages may take 1–3 minutes to go live.

## Rebuild site for GitHub Pages

From `app/`:

```bash
npm run build:pages
```

Commit and push the `docs/` folder on `main`.

## Local client zip (root path `/`)

```bash
npm run build:client
```

Output: `release/client-building-orbit/`
