# PayPulss

SaaS — PayPulss (freelance invoice automation). Next.js App Router.

## Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Copier `.env.example` vers `.env.local` et renseigner les clés Supabase.

## Cron relances

Une route protégée existe pour les tâches planifiées: `GET /api/reminders/run`.

- Variable requise: `CRON_SECRET`.
- Configure-la dans Vercel: `Project > Settings > Environment Variables`.
- Le cron est configuré dans `vercel.json` (toutes les 5 minutes).
- Sans en-tête d'authentification valide (`Authorization: Bearer <CRON_SECRET>`), la route répond `401`.

Test manuel:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/reminders/run
```

En production:

```bash
curl -i -H "Authorization: Bearer <CRON_SECRET>" https://<ton-domaine>/api/reminders/run
```
