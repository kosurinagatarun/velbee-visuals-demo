# VelBEE Visuals — Showcase app

React viewer for the **VelBEE Visuals** product ([velbee.com](https://velbee.com)). Assets are photoreal archviz JPEGs from [`../content/`](../content/) (orbit stills, equirect panos, plans).

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173/.

## Build for tenant subdomains

Showcase lives on **`https://{workspace}.velbee.com/showcase/{project}/`** (same tenant as the CRM workspace).

```bash
# VITE_BASE_PATH=/showcase/ in .env.production
npm run build
```

Proxy `/showcase/` on `*.velbee.com` to this `dist/`. See [`../docs/06-velbee-visuals.md`](../docs/06-velbee-visuals.md).

## Content scripts

Regenerate building orbit (60 JPGs):

```bash
npm run render:orbit
```

Regenerate floor plan, isometric, panos, and tour stills:

```bash
npm run render:simple-plate
```

Archived G+2 project: [`../old/`](../old/README.md).
