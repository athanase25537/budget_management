# Déploiement sur Cloudflare Workers

Le point d'entrée Workers est `worker.py`. Il charge l'application
FastAPI via l'adaptateur ASGI officiel de Cloudflare; ne lancez donc pas
Uvicorn dans Workers.

Depuis la racine du dépôt :

```bash
sh scripts/prepare-cloudflare-build.sh
uvx --from workers-py pywrangler deploy
```

Avant un déploiement, créez les secrets du Worker :

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put SECRET_KEY
```

Pour PostgreSQL, fournissez une URL SQLAlchemy utilisant `psycopg`, par
exemple `postgresql+psycopg://user:password@host:5432/database`. Pour une
connexion de production, configurez Hyperdrive puis utilisez ses identifiants
dans cette URL. Vous pouvez également définir la variable non secrète
`CORS_ORIGINS` (liste d'origines séparées par des virgules) dans
`wrangler.toml` ou dans le tableau de bord Cloudflare.
