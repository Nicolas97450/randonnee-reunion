# ACTIONS MANUELLES — NICOLAS
> Actions que seul Nicolas peut faire (dashboard, comptes, credentials).
> A traiter apres tous les sprints correctifs, sauf si bloquant.
> Cocher une fois fait.

---

## Sprint B — RLS & Backend

- [ ] **B12. Regenerer la service_role key Supabase**
  - Dashboard Supabase → Settings → API → Regenerate service_role key
  - L'ancienne cle a ete exposee dans .env (supprimee depuis)
  - Apres regeneration : mettre a jour l'Edge Function delete-account (Sprint H)
  - **NON bloquant** pour les sprints suivants

- [ ] **B12. Configurer restrictions Mapbox token**
  - Dashboard Mapbox → Tokens → Edit le token public
  - Ajouter restriction par URL referrer ou par app bundle ID
  - Empeche l'utilisation du token hors de l'app
  - **NON bloquant** pour les sprints suivants

## Sprint B — Migration 014 a deployer

- [x] **Deployer migration 014_rls_security_fixes.sql sur Supabase** — FAIT (deploy auto via CLI)

## Sprint D — Migration 015 a deployer

- [x] **Deployer migration 015_social_security.sql sur Supabase** — FAIT (deploy auto via CLI)

---

## Sprint E — Migration 016 a deployer

- [x] **Deployer migration 016_server_validation.sql sur Supabase** — FAIT (deploy auto via CLI)

---

## Nettoyage slugs en base (connexion Supabase timeout)

- [ ] **Mettre a jour les slugs en base Supabase** (retirer prefixes numeriques)
  - Connexion timeout lors de la tentative. A relancer quand le reseau est stable :
  - `npx supabase db query --linked "UPDATE trails SET slug = REGEXP_REPLACE(slug, '^\d+-', '') WHERE slug ~ '^\d+-';"`
  - `npx supabase db query --linked "UPDATE trails SET description = REPLACE(description, 'randopitonneurs', 'randonneurs') WHERE description ILIKE '%randopiton%';"`
  - Le trails.json local est deja corrige — cette action synchro la base

---

## Sprint H — RGPD

- [ ] **Creer compte Apple Developer** (99$/an)
  - Necessaire pour configurer eas.json (appleTeamId, ascAppId)
  - https://developer.apple.com/programs/

- [ ] **Creer compte Google Play Developer** (25$ one-time)
  - Necessaire pour serviceAccountKeyPath dans eas.json
  - https://play.google.com/console/

---

## Sprint I — Deploiement

- [ ] **Creer un projet Sentry** (gratuit jusqu'a 5k events/mois)
  - https://sentry.io → Create Project → React Native
  - Recuperer le DSN
  - Ajouter `EXPO_PUBLIC_SENTRY_DSN=<ton_dsn>` dans `.env` et EAS Secrets
  - L'app est deja configuree (App.tsx + ErrorBoundary) — il suffit d'ajouter le DSN

- [ ] **Configurer EAS Secrets** pour la production
  - `eas secret:create EXPO_PUBLIC_SUPABASE_URL`
  - `eas secret:create EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `eas secret:create EXPO_PUBLIC_MAPBOX_TOKEN`
  - `eas secret:create EXPO_PUBLIC_SENTRY_DSN` (apres creation projet Sentry)
  - Comme ca le build production utilise les secrets EAS, pas le .env local

- [ ] **Configurer eas.json pour iOS** (apres creation compte Apple Developer)
  - Remplacer `appleId`, `ascAppId`, `appleTeamId` dans eas.json

- [ ] **Configurer eas.json pour Android** (apres creation compte Google Play)
  - Creer `google-services.json` depuis la Firebase Console
  - Le placer a la racine du projet app/

---

*Ce fichier sera mis a jour au fur et a mesure des sprints.*
