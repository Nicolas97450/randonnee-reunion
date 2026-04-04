# État du projet — Randonnée Réunion

> Dernière mise à jour : 4 avril 2026 (Session 7)

## Phase actuelle

**INFRASTRUCTURE COMPLÈTE + PRÊT BETA** — Packages installés, tests passent (125/125), branche pushée. Firebase et actions Nicolas en attente.

- Score audit : ~8.5/10 (post-corrections)
- 9 sprints correctifs + audit chirurgical + refactoring complet
- 22 fichiers migration SQL (20 numéros, 005 splitée en a/b/c)
- 710 sentiers avec traces GPS exactes
- **Cache offline** (4 avril) : React Query persistant via PersistQueryClientProvider + AsyncStorage (TTL 3 jours, gcTime 24h)
- **Notifications push** (4 avril) : usePushNotifications hook complet + app.json + migration 020 + deep linking 7 types
- **Vérification Supabase** (4 avril) : 25 tables, 70 RLS policies, 5 RPCs, 710 sentiers — tout conforme
- **Refactoring** (4 avril) : 3 écrans majeurs refactorisés, 20 composants extraits, 3 fichiers de tests ajoutés

## Métriques du code

| Métrique | Valeur |
|---|---|
| Écrans | 26 |
| Hooks | 35 |
| Composants | 43 (+20 extraits le 04/04) |
| Stores Zustand | 5 |
| Stacks navigation | 6 |
| Migrations SQL | 22 fichiers (20 numéros, 005a/b/c) |
| Tables Supabase | 25 (+ push_tokens en migration 020, à déployer) |
| Policies RLS | 70 (vérifié via MCP le 04/04) |
| RPCs Supabase | 5 |
| Sentiers | 710 |
| Tests unitaires | 5 fichiers, 78+ tests |
| onError handlers | 15+/15+ (100%) |
| Couleurs hardcodées | 0 (54 migrées au total) |
| `as any` violations | 0 |
| URLs hardcodées | 0 |
| Badges gamification | 18 |
| Realtime app (subscriptions) | 2 tables (direct_messages, sortie_messages) |

## Taille des écrans principaux (post-refactoring)

| Écran | Avant | Après | Réduction |
|---|---|---|---|
| ProfileScreen | 1398 | 598 | -57% |
| FeedScreen | 1099 | 434 | -60% |
| TrailDetailScreen | 1155 | 872 | -24% |
| NavigationScreen | 1469 | 1185 | -19% |

## Blockers actuels

1. **Sentry DSN manquant** → Nicolas doit créer le projet Sentry
2. **Comptes stores non créés** → Apple Developer (99$/an) + Google Play (25$)
3. **Nom de domaine** → randonnee-reunion.re à commander
4. ~~**APK 167MB dans le repo**~~ → **SUPPRIMÉ** (Session 7)

## Prochaines étapes prioritaires

1. ~~**Claude Code** : installer packages npm~~ → **FAIT** (Session 7)
2. ~~**Claude Code** : supprimer APK, vérifier .env, commit + push~~ → **FAIT** (Session 7)
3. **Nicolas** : créer projet Sentry + comptes stores + domaine
4. **Nicolas** : configurer Firebase (google-services.json) pour les push notifications
5. **Nicolas** : déployer migration 020 (push_tokens) : `npx supabase db push --linked`
6. Tester l'APK sur Android réel
7. Build production + soumission stores

## Bugs connus

- Bug Douglas-Peucker corrigé (Session 7) — traces GPS n'étaient compressées qu'à 2 points
- 4 issues restantes de l'audit V2 (non critiques)
- 5 vulnérabilités npm (2 high, 3 moderate — dev deps transitives, pas de risque production)
