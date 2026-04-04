# Randonnée Réunion

App mobile de randonnée **100% dédiée à l'île de La Réunion**. 710 sentiers avec traces GPS, gamification territoriale (fog of war), features sociales (DM, feed, sorties de groupe), guidage vocal, GPS tracking background crash-safe.

## Stack technique

- **Mobile** : React Native + Expo SDK 55
- **Carte** : Mapbox GL (@rnmapbox/maps v10, 4 styles : Outdoor/Satellite/Light/Dark)
- **Backend** : Supabase (PostgreSQL + PostGIS + Auth + Realtime + Storage)
- **State** : Zustand (5 stores) + React Query
- **Navigation** : React Navigation v7 (6 onglets)
- **Météo** : Open-Meteo (gratuit, pas de clé)
- **Build** : EAS Build (cloud) ou local WSL Ubuntu

Détails : @docs/05-architecture/tech-stack.md

## Commandes essentielles

```bash
cd app && npx expo start          # Dev
cd app && eas build -p android    # Build Android
cd app && npx expo run:android    # Run local
```

## Architecture du code

```
app/src/
├── screens/        ← 26 écrans
├── components/     ← 43 composants
├── hooks/          ← 35 hooks
├── stores/         ← 5 stores Zustand (auth, progress, theme, offline, premium)
├── navigation/     ← 6 stacks (Root, Trail, Sorties, Social, Profile, Auth)
├── lib/            ← utilitaires (supabase, parseWKB, geo, moderation, badges, zones)
├── data/           ← trails.json (~10MB, 710 sentiers bundle local)
├── types/          ← trail, user, sortie, report
└── constants/      ← theme, map styles
```

## Conventions de code

- TypeScript strict — pas de `any`
- Composants PascalCase, hooks camelCase avec `use`, stores camelCase+Store
- Couleurs via COLORS constants — JAMAIS hardcodé
- `accessibilityLabel` sur tous les boutons/inputs
- `resolveTrailId()` avant requêtes Supabase (slug→UUID)
- Commits : `feat:` / `fix:` / `perf:` / `docs:` + description
- onError handler sur TOUTES les mutations React Query

## Documentation du projet

### Produit et stratégie
- @docs/01-discovery/problem-statement.md — Problème, cible, valeur
- @docs/01-discovery/competitive-analysis.md — Concurrence
- @docs/01-discovery/user-personas.md — Personas utilisateurs
- @docs/02-product/PRD.md — Requirements produit
- @docs/02-product/features-roadmap.md — Roadmap
- @docs/03-business/business-model.md — Business plan
- @docs/03-business/go-to-market.md — Plan de lancement
- @docs/03-business/store-listing.md — Fiche stores (ASO, screenshots, description)

### Architecture technique
- @docs/05-architecture/tech-stack.md — Stack et justifications
- @docs/05-architecture/system-design.md — Architecture système
- @docs/05-architecture/database-schema.md — Schéma BDD (25+ tables, 19 migrations, 5 RPCs)
- @docs/06-operations/deployment.md — Checklist pré-déploiement
- @docs/06-operations/deployment-plan.md — Plan de déploiement détaillé
- @docs/06-operations/security-checklist.md — Checklist sécurité

### Legal
- @docs/04-legal/privacy-policy.md — RGPD
- @docs/04-legal/compliance-log.md — Journal conformité
- @docs/04-legal/data-processing.md — Registre des traitements de données

## État du projet

- @project/PROJECT_STATE.md — État actuel, blockers, métriques
- @project/TASKS.md — Tâches à faire / en cours / fait
- @project/CHANGELOG.md — Journal des changements
- @project/SESSIONS.md — Historique des sessions
- @project/DECISIONS.md — Décisions prises (ne pas revenir dessus)

## Données en base

- **710 sentiers** avec traces GPS exactes (PostGIS + JSON bundle local)
- **25 tables** Supabase avec **70 policies RLS**
- **5 RPCs** : get_leaderboard, get_user_rank, validate_and_complete_trail, compute_user_xp, get_user_zone_progress
- **22 fichiers migration** SQL (20 numéros, 005 splitée en a/b/c)
- **Realtime SQL** : sortie_messages, direct_messages, post_comments, live_tracking
- **Realtime app** (subscriptions JS) : direct_messages, sortie_messages uniquement
- **Cache offline** : React Query persistant (AsyncStorage, TTL 3 jours)
- **Push notifications** : code prêt (usePushNotifications), migration 020, attente config Firebase

## Règles critiques

1. **JAMAIS** de clés API ou secrets dans le code → `.env` uniquement
2. **TOUJOURS** vérifier `project/DECISIONS.md` avant un choix d'architecture
3. **TOUJOURS** mettre à jour `project/TASKS.md` après chaque session
4. Après ajout d'une feature → mettre à jour PRD + CHANGELOG + compliance si données perso
5. Chaque nouvelle table Supabase → policies RLS obligatoires

## Points de vigilance build

- `babel-preset-expo` DOIT être dans package.json
- `compileSdkVersion: 36` requis (androidx.core 1.17)
- NE PAS mettre `kotlinVersion` dans app.json
- NE PAS mettre `@maplibre/maplibre-react-native` dans les plugins (legacy, remplacé par Mapbox)
- `.env` contient les secrets — NE PAS commiter
- `gradle.properties` : Kotlin 2.0.21, buildTools 36.1.0, Gradle 8.13, JVM heap 4096m

## Comptes et services

| Service | Détail |
|---|---|
| GitHub | github.com/Nicolas97450/randonnee-reunion |
| Expo | @nicolasreunionlouis/randonnee-reunion |
| Supabase | wnsitmaxjgbprsdpvict.supabase.co |
| Météo | Open-Meteo (gratuit, pas de clé) |
