# CLAUDE.md — Randonnee Reunion
> Fichier de contexte lu automatiquement par Claude Code a chaque session.
> Derniere mise a jour : 17 mars 2026 — Tous les sprints termines

---

## C'est quoi ce projet ?

Application mobile de randonnee **100% dediee a l'ile de La Reunion**.
Stack cross-platform iOS + Android, fonctionnement hors-ligne, gamification territoriale.

**Repo GitHub** : https://github.com/Nicolas97450/randonnee-reunion
**Compte Expo** : @nicolasreunionlouis/randonnee-reunion
**Supabase** : https://wnsitmaxjgbprsdpvict.supabase.co

**Differenciateurs cles vs concurrents :**
- Seule app avec integration etat des sentiers OMF en temps reel
- Carte de l'ile qui se colorise au fur et a mesure qu'on realise des sentiers
- Feature "Sorties" : planifier une rando et inviter d'autres randonneurs avec chat groupe
- Fonctionne sans reseau sur le terrain (cartes .pmtiles offline)

---

## Stack technique

| Composant | Choix |
|---|---|
| Framework mobile | React Native + Expo SDK 55 |
| Cartographie | MapLibre GL Native v10 |
| Format cartes offline | PMTiles |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime) |
| State management | Zustand |
| Data fetching | React Query (@tanstack/react-query) |
| Navigation | React Navigation v6 (bottom tabs + native stack) |
| Animations | React Native Reanimated + Gesture Handler |
| Bottom sheet | @gorhom/bottom-sheet |
| Meteo API | meteo-concept.com (cle dans .env) |
| Build | EAS Build (Expo) |

---

## Structure du projet

```
/
├── CLAUDE.md
├── memory/PROJECT_MEMORY.md
├── docs/
│   ├── PRD_Randonner_Reunion.md
│   ├── ARCHITECTURE_Randonner_Reunion.md
│   ├── ANALYSE_CONCURRENTIELLE.md
│   ├── ROADMAP.md
│   ├── SPRINT_PLANNING.md
│   ├── STORE_LISTING.md
│   └── AVANCEMENT.md              <- Suivi des avancements date
└── app/
    ├── App.tsx                     <- Point d'entree (onboarding + auth + nav)
    ├── app.json                    <- Config Expo
    ├── eas.json                    <- Config EAS Build
    ├── .env                        <- Secrets (non commite)
    ├── src/
    │   ├── screens/                <- 10 ecrans
    │   │   ├── OnboardingScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   ├── MapScreen.tsx
    │   │   ├── TrailListScreen.tsx
    │   │   ├── TrailDetailScreen.tsx
    │   │   ├── NavigationScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   ├── SettingsScreen.tsx
    │   │   ├── CreateSortieScreen.tsx
    │   │   └── SortieDetailScreen.tsx
    │   ├── components/             <- 8 composants
    │   │   ├── BaseMap.tsx
    │   │   ├── TrailMarkers.tsx
    │   │   ├── TrailCard.tsx
    │   │   ├── DifficultyBadge.tsx
    │   │   ├── TrailStatusBadge.tsx
    │   │   ├── WeatherWidget.tsx
    │   │   ├── DownloadButton.tsx
    │   │   ├── IslandProgressMap.tsx
    │   │   ├── OfflineBanner.tsx
    │   │   └── SortieChat.tsx
    │   ├── hooks/                  <- 8 hooks
    │   │   ├── useAuth.ts
    │   │   ├── useTrails.ts
    │   │   ├── useWeather.ts
    │   │   ├── useGPSTracking.ts
    │   │   ├── useOffTrailAlert.ts
    │   │   ├── useOnboarding.ts
    │   │   ├── useThemeColors.ts
    │   │   ├── useSorties.ts
    │   │   └── useSortieChat.ts
    │   ├── stores/                 <- 4 stores Zustand
    │   │   ├── authStore.ts
    │   │   ├── offlineStore.ts
    │   │   ├── progressStore.ts
    │   │   └── themeStore.ts
    │   ├── navigation/             <- Navigateurs
    │   │   ├── types.ts
    │   │   ├── RootTabs.tsx
    │   │   ├── TrailStack.tsx
    │   │   ├── ProfileStack.tsx
    │   │   └── AuthStack.tsx
    │   ├── lib/                    <- Utilitaires
    │   │   ├── supabase.ts
    │   │   ├── queryClient.ts
    │   │   ├── mockTrails.ts
    │   │   ├── formatters.ts
    │   │   └── zones.ts
    │   ├── types/                  <- Types TypeScript
    │   │   ├── trail.ts
    │   │   ├── user.ts
    │   │   └── sortie.ts
    │   └── constants/              <- Theme, couleurs, carte
    │       ├── theme.ts
    │       └── map.ts
    └── supabase/
        ├── migrations/
        │   ├── 001_initial_schema.sql
        │   └── 002_sorties.sql
        ├── seed/
        │   └── seed_trails.sql
        └── functions/
            ├── weather/index.ts
            ├── trail-status/index.ts
            └── tiles-download-url/index.ts
```

---

## Phase actuelle

**TOUS LES SPRINTS TERMINES** — Phase de test et deploiement.

Prochaine etape : tester l'APK de dev sur Android, corriger les bugs, puis deployer.

---

## Schema BDD

Tables Supabase (2 migrations) :
- `trails` — 20 sentiers avec coordonnees GPS reelles
- `trail_conditions` — etat OMF (cache 1h)
- `user_profiles` — profil etendu (premium, avatar)
- `user_activities` — sentiers valides (GPS ou manuel)
- `map_zones` — 18 zones geographiques
- `trail_zones` — liaison sentiers / zones
- `sorties` — evenements rando planifies
- `sortie_participants` — gestion des membres
- `sortie_messages` — chat temps reel (Supabase Realtime)

---

## Conventions de code

- TypeScript strict — pas de `any`
- Composants : PascalCase (`TrailCard.tsx`)
- Hooks : camelCase avec prefixe `use` (`useTrails.ts`)
- Commits : `feat: S1-01 description` (un par tache)
- Git flow : feature branches + merge --no-ff vers main

---

## Points de vigilance build

- `@maplibre/maplibre-react-native` ne doit PAS etre dans la liste plugins de app.json (pas de config plugin Expo)
- `expo-build-properties` requis pour minSdkVersion 26 (MapLibre)
- `react-native-worklets` est un peer dependency de reanimated
- Le `.env` n'est pas commite (secrets). Pour les builds EAS, configurer les env vars dans le dashboard Expo
