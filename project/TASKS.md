# Tâches — Randonnée Réunion

> Format : [x] fait, [-] en cours, [ ] à faire
> Dernière vérification code : 4 avril 2026 (Session 7)

## Priorité haute (blockers)

- [x] **NICOLAS** : Révoquer token Mapbox secret + reconfigurer via EAS secrets — FAIT
- [x] **CLAUDE CODE** : Vérifier .env dans git → **jamais commité, propre**
- [x] **CLAUDE CODE** : Supprimer APK 167MB → **supprimé**
- [x] **CLAUDE CODE** : Installer Jest + ts-jest + @types/jest → **installé, 125 tests passent**
- [x] **CLAUDE CODE** : Installer packages cache offline → **installé**
- [x] **CLAUDE CODE** : Commit + push sur branche `refactor/session-6-offline-push` → **pushé**
- [x] **CLAUDE CODE** : Fix bug Douglas-Peucker (perpendicularDistance /R en trop) → **corrigé + tests passent**
- [x] **CLAUDE CODE** : Fix 5 tests cassés (badges 21→18, sanitizeUsername, gpxExport ele, geo zigzag) → **125/125 OK**
- [ ] **NICOLAS** : Créer projet Sentry + ajouter DSN dans .env
- [ ] **NICOLAS** : Commander nom de domaine randonnee-reunion.re
- [ ] **NICOLAS** : Créer compte Apple Developer (99$/an)
- [ ] **NICOLAS** : Créer compte Google Play (25$)
- [ ] **NICOLAS** : Déployer migration 020 : `npx supabase db push --linked`
- [ ] Tester l'APK sur appareil Android réel

## Priorité moyenne (features)

- [-] Mode offline : cache persistant React Query + tiles Mapbox
  - [x] Cache persistant React Query via PersistQueryClientProvider + AsyncStorage — FAIT (code, 4 avril 2026)
  - [ ] **CLAUDE CODE** : Installer packages : `cd app && npm install @tanstack/react-query-persist-client @tanstack/query-async-storage-persister`
  - [ ] Tiles Mapbox offline (serveur Linux requis — pas encore faisable)
- [x] Notifications push infrastructure — FAIT (5 avril 2026)
  - [x] usePushNotifications hook : enregistrement token, deep linking, unregister
  - [x] Configuration app.json (expo-notifications plugin)
  - [x] Migration 020 : push_tokens table + RLS policies
  - [x] useNotifications.ts upgraded : deep linking local + logout
  - [x] Documentation complète : push-notifications-setup.md
  - [ ] **NICOLAS** : Créer projet Firebase + configurer FCM
  - [ ] **NICOLAS** : Ajouter Firebase plugin à app.json
  - [ ] **NICOLAS** : Configurer EAS secrets pour Firebase
  - [ ] **NICOLAS** : Appeler usePushNotifications() dans App.tsx
- [ ] **NICOLAS** : Remplir config EAS iOS (`ascAppId`, `appleTeamId` dans eas.json)
- [ ] **NICOLAS** : Prendre screenshots stores (6 iOS + 2 Android)
- [ ] Build production + soumission stores

## Priorité basse (améliorations)

- [ ] npm audit fix (30 vulnérabilités : dev deps uniquement, non fixable sans upgrade Expo)
- [ ] Internationalisation (français par défaut, anglais)
- [ ] Analytics (Mixpanel ou PostHog)
- [ ] Configurer RevenueCat (package installé, pas de compte/produits)

## État vérifié dans le code (4 avril 2026)

| Point | Statut | Détail |
|---|---|---|
| onError handlers mutations | **15+/15+ OK** | Tous avec handler |
| Couleurs hardcodées | **0 restantes** | 54 migrées au total |
| `as any` violations | **0 restantes** | 3 corrigées (04/04) |
| URLs Supabase hardcodées | **0 restantes** | 2 externalisées via process.env |
| console.error non-DEV | **0 restantes** | 2 protégés par __DEV__ |
| Douglas-Peucker | **Implémenté** | geo.ts + NavigationScreen + FreeHikeScreen |
| Composants | **43** | +20 extraits des écrans (04/04) |
| Hooks | **35** | +1 useAnimatedCounter extrait |
| Tests unitaires | **5 fichiers (78+ tests)** | geo, formatters, moderation, badges, gpxExport |
| Vulnérabilités npm | 5 (2 HIGH, 3 MOD) | Dev deps transitives — pas de risque production |
| RLS policies | **70 actives** | Vérifié via MCP le 04/04 |
| Realtime côté app | **2 tables** | direct_messages + sortie_messages |
| Badges | **18** | Vérifié dans badges.ts |
| Migrations SQL | **22 fichiers** | 20 numéros (005 splitée en a/b/c) |
| RGPD suppression/export | 19 tables | OK |
| ProGuard | Activé | OK |
| ErrorBoundary | Présent | OK |
| Sentry | Installé | DSN manquant (action Nicolas) |

## Fait récemment

- [x] Refactoring majeur des 3 gros écrans — 4 avril 2026
  - ProfileScreen : 1398 → 598 lignes (10 composants + 1 hook extraits)
  - TrailDetailScreen : 1155 → 872 lignes (5 composants extraits)
  - FeedScreen : 1099 → 434 lignes (5 composants + 1 utilitaire extraits)
  - Total : 20 nouveaux composants, 1 hook, 1 utilitaire dateUtils.ts
- [x] 3 nouveaux fichiers de tests — 4 avril 2026
  - moderation.test.ts (20 tests), badges.test.ts (34 tests), gpxExport.test.ts (24 tests)
  - Total : 5 fichiers de tests, 78+ test cases
- [x] Setup GitHub Pages pour les pages légales — 4 avril 2026
  - legal-pages/ : index.html, confidentialite.html, cgu.html, CNAME, README
- [x] trails.json déplacé vers data-raw/ (pas bundlé dans l'app)
- [x] .gitignore enrichi (*.apk, *.aab, *.ipa, .gradle/)
- [x] CLAUDE.md : 4 docs manquantes référencées
- [x] Implémentation Douglas-Peucker + corrections audit chirurgical — 4 avril 2026
- [x] Migration couleurs hardcodées (54 total) — 27 mars + 4 avril
- [x] 9 sprints correctifs (A→I) : score 5.2 → 9.0/10
- [x] Migrations 014→019 déployées
- [x] Sentry installé, ProGuard activé
- [x] RGPD : suppression/export 19 tables
