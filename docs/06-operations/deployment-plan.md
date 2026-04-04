# PLAN DE DEPLOIEMENT — Randonnee Reunion

> Plan sprint par sprint du 22 mars au deploiement stores.
> Chaque tache est marquee CLAUDE (je m'en charge) ou NICOLAS (ton intervention requise).

---

## LEGENDE

- **CLAUDE** = je peux le faire directement dans le code
- **NICOLAS** = necessite ton intervention (achats, comptes, config externe, tests device)
- **ENSEMBLE** = on le fait ensemble (je prepare, tu valides/executes)

---

## SPRINT 10 — Correctifs securite immediats (22-23 mars)

> Objectif : corriger les vulnerabilites critiques et hautes identifiees dans l'audit.
> Effort Claude : ~3h | Effort Nicolas : ~1h

### CLAUDE — Corrections code

| # | Tache | Fichier(s) | Effort |
|---|-------|-----------|--------|
| 10.1 | Ajouter validation taille upload avatar (< 2MB) | `src/hooks/useAvatar.ts` | 15min |
| 10.2 | Corriger storage policies avatars (CHECK user_id) | `supabase/migrations/019_storage_fix.sql` | 30min |
| 10.3 | Remplacer 33 couleurs hardcodees par COLORS constants | MapScreen, LeaderboardScreen, HikeSummaryScreen, FeedScreen, etc. | 1h |
| 10.4 | Ajouter perf props FlatList (initialNumToRender, maxToRenderPerBatch) | 20+ fichiers screens | 45min |
| 10.5 | Ajouter pull-to-refresh sur FeedScreen, InboxScreen, LeaderboardScreen | 3 fichiers | 30min |
| 10.6 | Unifier haversineDistance (supprimer duplications, utiliser geo.ts) | MapScreen, NavigationScreen | 15min |
| 10.7 | Ajouter error handler sur Realtime subscriptions | useSortieChat, useDirectMessages | 15min |

### NICOLAS — Actions manuelles

| # | Tache | Ou | Effort |
|---|-------|----|--------|
| 10.8 | Revoquer token Mapbox expose | dashboard.mapbox.com → Tokens → Revoke + regenerer | 10min |
| 10.9 | Verifier historique git pour service_role key | `git log -p -- .env` (si expose, revoquer dans Supabase) | 10min |
| 10.10 | Creer projet Sentry (gratuit) | sentry.io → New Project → React Native | 15min |
| 10.11 | Ajouter SENTRY_DSN dans .env | Copier DSN depuis Sentry → coller dans .env | 5min |

---

## SPRINT 11 — UX & qualite (24-25 mars)

> Objectif : corriger les problemes UX identifies, ameliorer la coherence.
> Effort Claude : ~4h | Effort Nicolas : 0

### CLAUDE — Corrections code

| # | Tache | Fichier(s) | Effort |
|---|-------|-----------|--------|
| 11.1 | Uniformiser avatar placeholders (taille 20, icon person-circle) | FriendsScreen, InboxScreen, LeaderboardScreen, FeedScreen | 30min |
| 11.2 | Ajouter disabled state feedback sur boutons secondaires | MapScreen, ProfileScreen, TrailDetailScreen | 30min |
| 11.3 | Ajouter empty states avec CTA universels | InboxScreen, NotificationsScreen, FeedScreen | 30min |
| 11.4 | Ajouter keyboardDismissMode="on-drag" sur FlatLists avec search | TrailListScreen, FriendsScreen, SearchScreen | 15min |
| 11.5 | Centraliser badge count (pendingCount) dans un seul hook | RootTabs, SocialStack | 30min |
| 11.6 | Ajouter animation tab underline sur TrailDetailScreen | TrailDetailScreen | 45min |
| 11.7 | Ameliorer MapScreen controls layout (flexbox au lieu de top hardcode) | MapScreen | 30min |
| 11.8 | Ajouter Skeleton loaders manquants | ProfileScreen stats, LeaderboardScreen | 30min |

---

## SPRINT 12 — GPS & offline (26-28 mars)

> Objectif : corriger les lacunes GPS critiques.
> Effort Claude : ~6h | Effort Nicolas : ~1h (test device)

### CLAUDE — Corrections code

| # | Tache | Fichier(s) | Effort |
|---|-------|-----------|--------|
| 12.1 | Implementer auto-validation 80% du sentier | NavigationScreen | 2h |
| 12.2 | Ajouter compression trace Douglas-Peucker avant sauvegarde locale | useGPSTracking | 1h |
| 12.3 | Ajouter queue TTS pour voice guidance (eviter messages coupes) | useVoiceGuidance | 1h |
| 12.4 | Rendre seuil hors-sentier configurable par difficulte | useOffTrailAlert | 30min |
| 12.5 | Reduire cache POI Overpass de 3 jours a 12h | useOverpassPOI | 5min |
| 12.6 | Ajouter validation trace GPS (rejet altitude jump > 50m) | useGPSTracking | 30min |
| 12.7 | Ajouter attribution OSM dans UI carte | MapScreen ou BaseMap | 15min |

### NICOLAS — Tests

| # | Tache | Ou | Effort |
|---|-------|----|--------|
| 12.8 | Tester GPS background sur Android reel (30min rando) | Device Android | 30min |
| 12.9 | Verifier crash-safe recovery (kill app pendant tracking) | Device Android | 15min |

---

## SPRINT 13 — Securite serveur (29-30 mars)

> Objectif : renforcer la securite cote serveur.
> Effort Claude : ~3h | Effort Nicolas : ~30min (deployer migration)

### CLAUDE — Code

| # | Tache | Fichier(s) | Effort |
|---|-------|-----------|--------|
| 13.1 | Migration 019 : trigger moderation serveur (messages + posts) | `supabase/migrations/019_server_moderation.sql` | 1h |
| 13.2 | Migration 019 : rate limiting serveur DMs (max 30/min par user) | Meme migration | 30min |
| 13.3 | Migration 019 : expiration live_tracking 90 jours (RGPD) | Meme migration | 15min |
| 13.4 | Ajouter file size validation cote client (trail photos + reports) | useTrailPhotos, ReportForm | 30min |
| 13.5 | Ajouter password reset flow (Supabase resetPasswordForEmail) | LoginScreen, authStore | 45min |

### NICOLAS — Deploiement

| # | Tache | Ou | Effort |
|---|-------|----|--------|
| 13.6 | Deployer migration 019 sur Supabase | `npx supabase db push --linked` | 15min |

---

## SPRINT 14 — Preparation stores (31 mars - 5 avril)

> Objectif : tout preparer pour la soumission.
> Effort Claude : ~2h | Effort Nicolas : ~8h (actions manuelles critiques)

### CLAUDE — Preparation code

| # | Tache | Fichier(s) | Effort |
|---|-------|-----------|--------|
| 14.1 | Mettre a jour SettingsScreen avec URLs domaine final | SettingsScreen | 15min |
| 14.2 | Mettre a jour app.json (description, URLs) | app.json | 15min |
| 14.3 | Ajouter store listing descriptions (FR) | docs/STORE_LISTING.md | 30min |
| 14.4 | Verifier que .env.example est a jour | .env.example | 10min |
| 14.5 | Nettoyage final code (console.log restants, imports inutilises) | Tous fichiers | 30min |

### NICOLAS — Actions manuelles BLOQUANTES

| # | Tache | Ou | Effort | Cout |
|---|-------|----|--------|------|
| 14.6 | Acheter domaine randonnee-reunion.re (ou .fr) | OVH, Gandi, ou autre registrar | 30min | ~12 EUR/an |
| 14.7 | Heberger pages legales (politique + CGU) | GitHub Pages (gratuit) ou Netlify | 1h | Gratuit |
| 14.8 | S'inscrire Apple Developer Program | developer.apple.com | 30min + 48h-2 sem validation | 99$/an |
| 14.9 | S'inscrire Google Play Developer | play.google.com/console | 30min + 24-48h validation | 25$ |
| 14.10 | Creer email de contact | contact@randonnee-reunion.re ou Gmail | 30min | Gratuit |
| 14.11 | Prendre screenshots app (6 par plateforme) | Emulateur ou device reel | 2h | — |
| 14.12 | Creer feature graphic Google Play (1024x500 px) | Canva ou Figma | 1h | Gratuit |
| 14.13 | Valider logo/icone finale | Review icon.png + adaptive-icon | 30min | — |

### ENSEMBLE — Configuration credentials

| # | Tache | Detail | Effort |
|---|-------|--------|--------|
| 14.14 | Remplir eas.json production iOS | ascAppId + appleTeamId (fournis par Apple apres inscription) | 15min |
| 14.15 | Configurer signing Android (keystore) | EAS gere automatiquement ou generer manuellement | 30min |

---

## SPRINT 15 — Build & soumission (6-8 avril)

> Objectif : build production + soumettre aux stores.
> Effort Claude : ~1h | Effort Nicolas : ~4h

### ENSEMBLE — Builds

| # | Tache | Commande | Effort |
|---|-------|---------|--------|
| 15.1 | Build production Android (AAB) | `eas build --profile production --platform android` | 10-20min |
| 15.2 | Build production iOS (IPA) | `eas build --profile production --platform ios` | 10-20min |
| 15.3 | Tester APK production sur device reel | Installer + tester parcours complet | 1h |

### NICOLAS — Soumission stores

| # | Tache | Ou | Effort |
|---|-------|----|--------|
| 15.4 | Creer app dans Google Play Console | play.google.com/console | 30min |
| 15.5 | Upload AAB + remplir store listing | Google Play Console | 1h |
| 15.6 | Remplir questionnaire content rating | Google Play Console | 30min |
| 15.7 | Remplir Data Safety declaration | Google Play Console (template dans docs/DATA_SAFETY_STORES.md) | 30min |
| 15.8 | Creer app dans App Store Connect | appstoreconnect.apple.com | 30min |
| 15.9 | Upload IPA + remplir fiche | App Store Connect | 1h |
| 15.10 | Soumettre pour review | Les 2 stores | 5min |

### Delai review stores
- Google Play : 2-3 jours
- Apple App Store : 1-5 jours

---

## SPRINT 16+ — Post-lancement (apres publication)

> Ameliorations continues, non bloquantes pour le lancement.

### CLAUDE — Features futures

| # | Tache | Priorite | Effort |
|---|-------|----------|--------|
| 16.1 | Mode offline tuiles Mapbox (cache management) | HAUTE | 2-3 jours |
| 16.2 | Notifications push FCM (backend + frontend) | HAUTE | 2 jours |
| 16.3 | Cache persistant React Query (sentiers + meteo offline) | HAUTE | 1 jour |
| 16.4 | Configurer RevenueCat (produits in-app) | MOYENNE | 1 jour |
| 16.5 | Analytics (PostHog ou Amplitude) | MOYENNE | 1 jour |
| 16.6 | Integration Strava (export activite) | MOYENNE | 1 jour |
| 16.7 | Version anglaise (i18n) | BASSE | 2 jours |
| 16.8 | Chiffrement E2E des DMs | BASSE | 2 jours |
| 16.9 | Apple Watch / Garmin | BASSE | 5+ jours |

### NICOLAS — Actions futures

| # | Tache | Priorite |
|---|-------|----------|
| 16.10 | Configurer Firebase project + FCM keys | HAUTE |
| 16.11 | Creer compte RevenueCat + produits | MOYENNE |
| 16.12 | Configurer compte Strava API | MOYENNE |
| 16.13 | Contacter ONF/IRT pour partenariat officiel | BASSE |
| 16.14 | Planifier pentest externe (~3k EUR) | BASSE |

---

## TIMELINE VISUELLE

```
Semaine 1 (22-28 mars)
├── Sprint 10 : Correctifs securite .............. CLAUDE + NICOLAS
├── Sprint 11 : UX & qualite .................... CLAUDE
└── Sprint 12 : GPS & offline ................... CLAUDE + NICOLAS (test)

Semaine 2 (29 mars - 5 avril)
├── Sprint 13 : Securite serveur ................ CLAUDE + NICOLAS (migration)
└── Sprint 14 : Preparation stores .............. NICOLAS (achats, comptes)

Semaine 3 (6-8 avril)
└── Sprint 15 : Build & soumission .............. ENSEMBLE

Semaine 4 (9-15 avril)
└── Review stores (2-7 jours) → PUBLICATION

Post-lancement
└── Sprint 16+ : Offline, push, analytics ....... Continu
```

---

## BUDGET DEPLOIEMENT

| Poste | Cout |
|-------|------|
| Domaine .re (1 an) | ~12 EUR |
| Apple Developer (1 an) | 99 USD (~91 EUR) |
| Google Play (one-time) | 25 USD (~23 EUR) |
| Hebergement pages legales | Gratuit (GitHub Pages) |
| Sentry (gratuit tier) | Gratuit |
| **TOTAL** | **~126 EUR** |

---

## CHECKLIST RAPIDE — A FAIRE PAR NICOLAS

Voici la liste dans l'ordre de priorite. Coche au fur et a mesure :

### Cette semaine (22-28 mars)
- [ ] Revoquer token Mapbox (dashboard.mapbox.com)
- [ ] Verifier `git log -p -- .env` pour service_role exposure
- [ ] Creer projet Sentry → copier DSN dans .env
- [ ] Commander domaine randonnee-reunion.re

### Semaine prochaine (29 mars - 5 avril)
- [ ] S'inscrire Apple Developer (99$/an)
- [ ] S'inscrire Google Play Developer (25$)
- [ ] Heberger politique-confidentialite.html + cgu.html
- [ ] Creer email contact
- [ ] Prendre 6 screenshots par plateforme
- [ ] Creer feature graphic (1024x500)

### Semaine du 6 avril
- [ ] Remplir eas.json (ascAppId, appleTeamId)
- [ ] Build production + test device
- [ ] Soumettre aux stores

---

*Plan cree le 22 mars 2026*
*Derniere mise a jour : 22 mars 2026*
