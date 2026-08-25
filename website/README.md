# Docs site

VitePress wrapper. **Content lives in [`guide/`](../guide/)** so GitHub and the site share one source.

```bash
pnpm docs:dev      # http://localhost:5173
PAGES=1 pnpm docs:dev   # same base path as GitHub Pages (/pilotbook/)
pnpm docs:build
pnpm docs:preview
```

GitHub Pages deploys from `.github/workflows/docs.yml` with `PAGES=1` (`https://sailerai.github.io/pilotbook/`).
