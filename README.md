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

## Notifications dashboard

- Migration requise: `supabase/migrations/009_notifications.sql`.
- La cloche du dashboard lit la table `notifications` (non lues, marquer lu, tout marquer lu).
- Types utilisés:
  - `member_action` (actions collaborateurs, ex. clients/dossiers/notes)
  - `reminder_sent` (relance auto envoyée)
  - `overdue_detected` (échéance dépassée)
- Les notifications relances sont générées dans le pipeline `lib/reminder-automation.ts`.
- Les notifications collaboration sont déclenchées côté client via `lib/notifications.ts` pour les comptes partagés.

---

## Sécurité — audit rapide du dépôt (Next + Supabase)

### Cartographie routes API (`app/api/**`)

| Route | Méthode | Classe |
|-------|---------|--------|
| `app/api/send-reminder/route.ts` | `POST` | **Utilisateur authentifié** (JWT Bearer Supabase validé contre GoTrue `auth/v1/user`) + rate limit IP / utilisateur → évite relais SMTP public gratuit. |
| `app/api/reminder-draft-ai/route.ts` | `POST` | Idem JWT + rate limit IP / utilisateur → évite combustion OpenAI/heuristique anonyme. |
| `app/api/reminders/run/route.ts` | `GET` | **Cron / infra** (`Authorization: Bearer <CRON_SECRET>`, comparaison `timingSafeEqual`) + `SUPABASE_SERVICE_ROLE_KEY` pour le runner → seule ta tâche planifiée doit exécuter le pipeline. |

Aucune **Server Action** `use server` trouvée dans le repo au moment du scan.

### Tables Supabase & RLS (synthèse depuis `supabase/migrations/` et `schema.sql`)

- **`clients`, `profiles`, `subscriptions`, `billing_records`, `workspaces`** : RLS + policies **utilisateur connecté / membre ou owner de compte** (voir `schema.sql`, `002`, `003` — évite lectures écritures cross-tenant hors modèle défini).
- **`account_invites`, `account_members`** : lecture/écriture restreinte owner ou parties concernées.
- **`reminder_rules`, `reminder_jobs`, `reminder_events`** : RLS on ; select typiquement `auth.uid() = owner_user_id` (à noter pour Agence **P2**: un membre sur compte owner peut avoir besoin de visibilité events jobs selon le produit, sans toucher encore au code).
- **`reminder_email_templates`** : CRUD réservé `owner_user_id = auth.uid()`.
- **`notifications`** (`009`) : SELECT/UPDATE destinataires ; INSERT par acteur JWT avec contrôle membership workspace.

**Important** : le **service role** bypass RLS pour les usages serveur réservés (ex. cron) — évite tout client qui embarquerait cette clé.

### Risques notés — P0 / P1 / P2

| Niveau | Sujet | Statut après patch |
|--------|--------|---------------------|
| **P0** | `/api/send-reminder` ouvert → spam / abus Resend | **Réglé** : JWT obligatoire + limites. |
| **P0** | `/api/reminder-draft-ai` ouvert → abus / coût | **Réglé** : JWT obligatoire + limites ; front passe le Bearer. |
| **P1** | Comparaison linéaire `CRON_SECRET` | **Réglé** : `timingSafeEqual` sur tout le Bearer. |
| **P1** | Absence headers HTTP génériques | **Réglé** : `next.config.ts` (HSTS seulement en prod). |
| **P2** | Login rate limit au niveau app (pas route Next) — utiliser protections Supabase / WAF prod. |
| **P2** | Rate limiting in-memory ≠ global sur plusieurs replicas serverless → compléter par Vercel firewall / KV / Redis si forte charge. |

### RGPD MVP (checklist produit débutant — à adapter avec avocat/DPO)

Données typiques traitées par PayPulss : **identités utilisateurs**, **contacts clients**, **montants**, **historique relances/notifications**.

- **Licite / information** : page mentions légales + politique de confidentialité décrivant finalités et durées souhaitées.
- **Droit accès / portabilité** : permettre export des données métier depuis le tableau de bord ou procédure manuelle documentée pour la V1 (export SQL admin encadré ou script interne hors prod).
- **Droit suppression** : désinscription/suppression du compte côté support ou procédure documentée avec purge Supabase (auth + tables liées) respectant les délais légaux.
- **Durée conservation** : documenter durée métier dans la politique (ex. corbeille, logs relances selon fonctionnalités).
- **Sous-traitants** : lister au minimum Supabase, hébergeur Front, messagerie (Resend), éventuelle IA (OpenAI), stockage mails humains (non PayPulss nécessairement).

### Vérification manuelle (Agence multi-compte / pas de fuite)

1. Utilisateur **Owner A**, client X dans workspace W — se connecter, vérifier que **Member B du compte A** voit bien X après invitation (RLS workspaces/clients comme prévu).
2. Member B fait une modification notifiée → **pas** visible par utilisateur isolé **C** (autre projet Supabase / autre tenant).
3. Appeler **`POST /api/reminder-draft-ai` sans Bearer** depuis `curl` → `401`.
4. Appeler **`GET /api/reminders/run` sans Bearer** → `401` + aucun mail Resend envoyé hors pipeline.
5. En prod, ouvrir Network sur « Générer par IA » : requête contient **`Authorization: Bearer`** (court par rapport au JWT complet).

### Observabilité

Les routes sensibles peuvent tracer des lignes **`serverStructuredLog(...)` JSON** sans adresses mails ni corps de mails — évite l’humiliation des données dans stdout PaaS.

## Performance (fluidité)

- **Dashboard** : chargement abonnement + clients actifs + corbeille en **un seul `Promise.all`** dès que le portefeuille est prêt — moins d’attente séquentielle réseau.
- **Contexte workspace** : profils des comptes partagés, liste des portefeuilles et profil courant (workspace actif) sont chargés **en parallèle** — navigation Agence plus réactive.
- **Modales** relance / cycle suivant : import **dynamique** (`next/dynamic`, `ssr: false`) — JS initial du dashboard un peu plus léger tant que les modales ne sont pas ouvertes.
- **Routes** `/dashboard`, `/dashboard/modeles-relance`, `/dashboard/dossiers`, `/dashboard/bilan`, `/dashboard/corbeille` : fichier **`loading.tsx`** + squelette partagé — l’utilisateur voit tout de suite un gabarit pendant le chargement client.
- **Limites** : le squelette ne remplace pas le coût des requêtes Supabase ; en serverless, le **cold start** hébergeur reste possible ; le rate limit API en mémoire ne s’applique **pas** entre plusieurs instances.

## Quota Supabase (plan Free)

Le projet est calibré pour rester confortablement sur le **plan Supabase Free** :

| Ressource | Limite Free | Stratégie côté code |
|---|---|---|
| Database size | 500 Mo | Rétention auto via `pg_cron` (migration `018`) |
| **Egress / Bandwidth** | **5 Go / mois** | Notifications via Realtime + SELECT minimal |
| Storage (fichiers) | 1 Go | Non utilisé |
| Realtime messages | 2M / mois | Un seul canal `notifications:<userId>` |
| Auth MAU | 50 000 | OK |

### Optimisations mises en place

1. **Notifications sans polling double** (`app/dashboard/use-notifications.ts`) : un seul abonnement Realtime, polling de secours uniquement si le canal renvoie `CHANNEL_ERROR` / `TIMED_OUT` (toutes les 2 min). Évite ~3 400 requêtes/jour/utilisateur.
2. **`select` minimal** : aucun `select('*')` dans `lib/`. `reminder_email_templates` n'envoie plus `created_at` / `updated_at` inutiles (cf. `REMINDER_EMAIL_TEMPLATE_SELECT`).
3. **Index ciblés** (migration `017_perf_indexes.sql`) :
   - `clients(workspace_id, created_at desc) where deleted_at is null` — `fetchClients`
   - `clients(workspace_id, deleted_at desc) where deleted_at is not null` — corbeille
   - `clients(workspace_id, email) where deleted_at is null` — `advanceClientToNextInvoiceCycle`
   - `subscriptions(user_id, created_at desc)` — `getCurrentSubscription`
   - `billing_records(user_id, paid_at desc)` — `getBillingRecords`
4. **Rétention auto** (migration `018_retention_cron.sql`) : tâche `pg_cron` quotidienne (`03:00 UTC`) qui supprime les `notifications` lues > 60 jours et les `reminder_events` > 365 jours. `billing_records`, `subscriptions`, `profiles`, `workspaces`, `clients`, `reminder_jobs`, `auth.users` **ne sont jamais touchés**.
5. **Évite les `auth.updateUser` redondants** (`lib/profile.ts`) : `syncAuthUserFromProfile(supabase, profile, previousProfile?)` accepte un profil précédent optionnel et n'émet aucun appel GoTrue si rien n'a changé.

### Vérifier la consommation

- **Dashboard Supabase → Settings → Usage** : voit en temps réel quelle ressource approche la limite.
- **Reports → API** : trie les endpoints les plus consommateurs.
- **Database → Tables (size)** : repère les tables qui grossissent.

### Garder le projet actif (anti-pause)

Sur le plan Free, un projet sans activité pendant ~7 jours reçoit un avertissement puis est mis en pause. Pour éviter ça :

- Soit te connecter au dashboard Supabase 1× par semaine.
- Soit ajouter un cron Vercel hebdomadaire (gratuit) qui pingue n'importe quelle route applicative — la requête DB déclenchée suffit à réinitialiser le compteur.

### Lancer le nettoyage manuellement

Si `pg_cron` n'est pas activable sur ton projet (selon la région / le plan), la migration `018` crée quand même la fonction `public.cleanup_old_data()`. Tu peux la déclencher :

```sql
select public.cleanup_old_data();
```

…depuis le SQL Editor Supabase ou depuis un scheduler externe (GitHub Action, cron Vercel).
