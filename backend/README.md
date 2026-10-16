# API gratuite avec Cloudflare Workers et Render

Le backend FastAPI reste hébergé sur Render. Le Worker JavaScript
`src/worker.js` transfère les requêtes vers Render et exécute un ping toutes
les 10 minutes afin de limiter la mise en veille du service.

Depuis la racine du dépôt :

```bash
npx wrangler deploy
```

L'URL du backend Render est définie par `ORIGIN_API_URL` dans `wrangler.toml`.
Modifiez cette valeur si l'URL Render change.
