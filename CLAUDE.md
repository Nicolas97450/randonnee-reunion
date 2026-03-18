# CLAUDE.md — Randonnee Reunion
> Fichier de contexte lu automatiquement par Claude Code a chaque session.
> Derniere mise a jour : 18 mars 2026

---

## C'est quoi ce projet ?

Application mobile de randonnee **100% dediee a l'ile de La Reunion**.
Stack cross-platform iOS + Android, gamification territoriale, features sociales.

**Repo GitHub** : https://github.com/Nicolas97450/randonnee-reunion
**Compte Expo** : @nicolasreunionlouis/randonnee-reunion
**Supabase** : https://wnsitmaxjgbprsdpvict.supabase.co
**API Meteo** : Open-Meteo (gratuit, pas de cle — couvre La Reunion)

---

## Stack technique

| Composant | Choix |
|---|---|
| Framework mobile | React Native + Expo SDK 55 |
| Cartographie | MapLibre GL Native v10 (carte Positron, clustering) |
| Traces sentiers | GeoJSON LineString scrapes de Randopitons.re (710/710) |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime + Storage) |
| State management | Zustand (5 stores) |
| Data fetching | React Query (@tanstack/react-query) |
| Navigation | React Navigation v7 (bottom tabs + native stacks) |
| Animations | React Native Reanimated + Gesture Handler |
| Bottom sheet | @gorhom/bottom-sheet |
| Meteo | Open-Meteo API (gratuit, mondial, coordonnees exactes) |
| Statut ONF | Scraping live onf.fr (cache 1h, matching strict 2+ mots) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage (bucket avatars, 2MB max) |
| Image picker | expo-image-picker (photo profil) |
| Date picker | @react-native-community/datetimepicker |
| Build | EAS Build (cloud) ou local via WSL Ubuntu |

---

## Structure du projet

```
/
├── CLAUDE.md
├── memory/PROJECT_MEMORY.md
├── docs/
│   ├── PRD_Randonner_Reunion.md
│   ├── ARCHITECTURE_Randonner_Reunion.md
│   ├── ROADMAP.md
│   ├── SPRINT_PLANNING.md
│   ├── AVANCEMENT.md
│   ├── SECURITE_RGPD.md
│   ├── PRE_DEPLOIEMENT.md
│   └── strategie/
│       ├── BUSINESS_PLAN.md
│       ├── PLAN_LANCEMENT.md
│       ├── ANALYSE_CONCURRENTIELLE.md
│       └── STORE_LISTING.md
├── private/
│   ├── dashboards/
│   ├── legal/ (politique-confidentialite.html + cgu.html)
│   └── branding/ (brand-guide.html + design-tokens.json)
└── app/
    ├── App.tsx (SafeAreaProvider + NavigationContainer)
    ├── app.json
    ├── eas.json
    ├── .env (secrets non commites)
    ├── scripts/ (scrape-traces.mjs, full-test-v2.mjs)
    ├── src/
    │   ├── screens/            <- 14 ecrans
    │   │   ├── OnboardingScreen, LoginScreen, RegisterScreen
    │   │   ├── MapScreen, TrailListScreen, TrailDetailScreen
    │   │   ├── NavigationScreen, CreateSortieScreen
    │   │   ├── SortiesScreen, SortieDetailScreen
    │   │   ├── ProfileScreen, SettingsScreen
    │   │   ├── FeedScreen, FriendsScreen
    │   ├── components/         <- 14 composants
    │   │   ├── BaseMap (forwardRef + flyTo), TrailMarkers (clustering)
    │   │   ├── TrailCard, DifficultyBadge, TrailStatusBadge
    │   │   ├── WeatherWidget, DownloadButton, ReportForm (multi-type)
    │   │   ├── SOSButton, SortieChat, IslandProgressMap
    │   │   ├── OfflineBanner, PremiumPaywall, TrailReportCard
    │   ├── hooks/              <- 20 hooks
    │   │   ├── useSupabaseTrails (710 trails + WKB parser)
    │   │   ├── useTrailTrace (traces GPS depuis gpx_url)
    │   │   ├── useWeather (Open-Meteo, descriptions tropicales)
    │   │   ├── useTrailStatus (ONF scraping strict)
    │   │   ├── useTrailReports + useSorties (slug→UUID resolution)
    │   │   ├── useSortieChat (Realtime + Alert erreur)
    │   │   ├── useFriends (amis, demandes, recherche users)
    │   │   ├── useFeed (posts, likes, toggle)
    │   │   ├── useAvatar (upload photo profil Supabase Storage)
    │   │   ├── useAuth, useOnboarding, useGPSTracking, etc.
    │   ├── stores/             <- 5 stores Zustand
    │   │   ├── authStore (auto-creation profil user_profiles)
    │   │   ├── progressStore (gamification 710 sentiers Supabase)
    │   │   ├── themeStore, offlineStore, premiumStore
    │   ├── navigation/         <- 7 fichiers
    │   │   ├── RootTabs (4 onglets: Carte, Sentiers, Sorties, Profil)
    │   │   ├── TrailStack, SortiesStack, ProfileStack, AuthStack
    │   │   ├── types.ts, index.ts
    │   ├── lib/                <- parseWKB, supabase, queryClient, formatters, zones, badges, mockTrails
    │   ├── types/              <- trail, user, sortie, report
    │   └── constants/          <- theme, map (styles + colors)
    └── supabase/
        ├── migrations/
        │   ├── 001_initial_schema.sql (trails, user_profiles, activities, zones)
        │   ├── 002_sorties.sql (sorties, participants, messages + RLS + Realtime)
        │   ├── 003_trail_reports_sos.sql (trail_reports, emergency_contacts)
        │   └── 004_social.sql (friendships, posts, post_likes + RLS)
        └── seed/ (710 sentiers + 706 descriptions)
```

---

## Donnees en base (Supabase)

- **710 sentiers** avec traces GPS exactes (GeoJSON LineString dans gpx_url)
- **710 descriptions** nettoyees (pas de references photos)
- **11 regions** couvertes, toutes mappees en 18 zones de gamification
- **5 utilisateurs** avec profils (auto-creation a la connexion)
- **Tables** : trails, trail_conditions, user_profiles, user_activities, map_zones, trail_zones, sorties, sortie_participants, sortie_messages, trail_reports, user_emergency_contacts, friendships, posts, post_likes
- **Storage** : bucket `avatars` (public, 2MB max, jpeg/png/webp)

---

## Phase actuelle

**BUILD LOCAL EN COURS** — APK avec toutes les features sociales + 50 corrections.

### Features dans ce build :
- 710 sentiers avec traces GPS exactes sur la carte
- Carte claire (Positron) avec clustering intelligent
- Meteo Open-Meteo (coordonnees exactes, descriptions tropicales)
- Statut ONF (scraping strict 2+ mots)
- GPS tracking temps reel (trace verte vif)
- Signalements multiples avec alerte proximite
- Sorties de groupe + chat temps reel
- Onglet Sorties dedie
- Systeme d'amis (recherche, demande, accepter/refuser)
- Feed communaute (posts, likes, partage progression)
- Photo de profil (upload Supabase Storage)
- Calendrier natif pour dates
- Descriptions collapsibles
- Gamification 710 sentiers / 18 zones
- Logo 1A (montagne + sentier vert)
- SafeAreaProvider (Android nav bar)
- Accessibilite (labels sur tous les boutons)

### Prochaines etapes :
1. Tester l'APK sur Android reel
2. Corriger les bugs remontes
3. Mettre a jour docs legales (RGPD : photos, posts, amis)
4. Comptes stores (Apple Developer 99$/an + Google Play 25$)
5. Nom de domaine (randonnee-reunion.re)
6. Build production + soumission stores

---

## Points de vigilance build

- `babel-preset-expo` DOIT etre dans package.json
- `compileSdkVersion: 36` requis (androidx.core 1.17)
- NE PAS mettre `kotlinVersion` dans app.json
- NE PAS mettre `@maplibre/maplibre-react-native` dans les plugins app.json
- `react-native.config.js` avec packageName explicite
- `.env` contient les secrets — NE PAS commiter
- Variables EAS configurees : EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_METEO_API_KEY
- EXPO_PUBLIC_METEO_API_KEY n'est plus utilisee (Open-Meteo est gratuit sans cle)
- Confirmation email DESACTIVEE dans Supabase Auth
- user_profiles : auto-creation dans authStore (trigger DB non deploye)
- MOCK_TRAILS : 0 reference dans le code (tout vient de Supabase)
- Build local : WSL Ubuntu + Java 17 + Node 18 + EAS CLI

---

## Conventions de code

- TypeScript strict — pas de `any`
- Composants : PascalCase (`TrailCard.tsx`)
- Hooks : camelCase avec prefixe `use` (`useTrails.ts`)
- Toutes les couleurs via COLORS constants (jamais hardcode)
- accessibilityLabel sur tous les boutons/inputs
- Slug→UUID : toujours resoudre via resolveTrailId() avant requetes Supabase
- Commits : `feat:` / `fix:` / `perf:` + description
