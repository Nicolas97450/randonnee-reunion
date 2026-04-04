# État du projet — Randonnée Réunion

> Dernière mise à jour : 4 avril 2026 (Session 10)

## Phase actuelle

**INFRASTRUCTURE COMPLÈTE + PRÊT BETA** — Packages installés, tests passent (125/125), branche mergée dans main. Google OAuth configuré + publié. Firebase créé. GitHub Pages actif. Sentry configuré (DSN actif). Firebase google-services.json et comptes stores en attente.

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

1. ~~**Sentry DSN manquant**~~ → **CONFIGURÉ** (Session 10) — projet créé, DSN dans `.env`
2. **Comptes stores non créés** → Apple Developer (99$/an) + Google Play (25$)
3. **Nom de domaine** → randonnee-reunion.re à commander
4. ~~**APK 167MB dans le repo**~~ → **SUPPRIMÉ** (Session 7)
5. ~~**Google OAuth non configuré**~~ → **CONFIGURÉ + PUBLIÉ** (Sessions 8-9)
6. ~~**Branche non mergée**~~ → **MERGÉE** (Session 9, PR #1)

## Prochaines étapes prioritaires

1. ~~**Claude Code** : installer packages npm~~ → **FAIT** (Session 7)
2. ~~**Claude Code** : supprimer APK, vérifier .env, commit + push~~ → **FAIT** (Session 7)
3. ~~**Cowork** : configurer Google OAuth~~ → **FAIT** (Sessions 8-9)
4. ~~**Cowork** : créer projet Firebase~~ → **FAIT** (Session 8)
5. ~~**Cowork** : activer GitHub Pages~~ → **FAIT** (Session 8)
6. ~~**Cowork** : merger branche dans main~~ → **FAIT** (Session 9, PR #1)
7. ~~**Nicolas** : créer projet Sentry + ajouter DSN dans .env~~ → **FAIT** (Session 10)
8. **Nicolas** : copier `google-services.json` dans `app/android/app/`
9. **Nicolas** : créer comptes stores (Apple Developer + Google Play)
10. **Nicolas** : commander domaine randonnee-reunion.re
11. Tester l'APK sur Android réel
12. Build production + soumission stores

## Bugs connus

- Bug Douglas-Peucker corrigé (Session 7) — traces GPS n'étaient compressées qu'à 2 points
- 4 issues restantes de l'audit V2 (non critiques)
- 5 vulnérabilités npm (2 high, 3 moderate — dev deps transitives, pas de risque production)
