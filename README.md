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
- Variables requises pour le runner auto: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`.
- Configure-la dans Vercel: `Project > Settings > Environment Variables`.
- Scheduler recommandé (plan Hobby): service externe (GitHub Actions, cron-job.org, EasyCron) vers `/api/reminders/run`.
- Sans en-tête d'authentification valide (`Authorization: Bearer <CRON_SECRET>`), la route répond `401`.
- Sans variables serveur obligatoires (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`), la route répond `500`.

Test manuel:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/reminders/run
```

En production:

```bash
curl -i -H "Authorization: Bearer <CRON_SECRET>" https://<ton-domaine>/api/reminders/run
```

### Exemples scheduler externe

- **GitHub Actions (daily)**: appeler `GET /api/reminders/run` avec header Bearer secret.
- **cron-job.org / EasyCron**: même URL + header `Authorization: Bearer <CRON_SECRET>`.
- Fréquence suggérée: 1 fois/jour (Hobby) ou plus fréquent selon plan/provider.
