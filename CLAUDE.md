# CLAUDE.md — Randonnee Reunion
> Fichier de contexte lu automatiquement par Claude Code a chaque session.
> Derniere mise a jour : 19 mars 2026

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
| Cartographie | Mapbox GL (@rnmapbox/maps v10, styles Outdoors/Satellite/Light/Dark, clustering) |
| Traces sentiers | GeoJSON LineString scrapes de Randopitons.re (710/710) + JSON bundle local |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime + Storage) |
| State management | Zustand (5 stores) |
| Data fetching | React Query (@tanstack/react-query) |
| Navigation | React Navigation v7 (bottom tabs + native stacks) |
| Animations | React Native Reanimated + Gesture Handler |
| Bottom sheet | @gorhom/bottom-sheet |
| Meteo | Open-Meteo API (gratuit, coordonnees exactes, UV, rafales, sunrise/sunset, visibilite) |
| Statut ONF | Scraping live onf.fr (cache 1h, matching strict 2+ mots) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage (bucket avatars, 2MB max) |
| Image picker | expo-image-picker (photo profil) |
| Date picker | @react-native-community/datetimepicker |
| Elevation | Open-Elevation API (profil altitude SVG) |
| Routing | OSRM foot profile (itineraire pieton vers depart) |
| SVG | react-native-svg (profil elevation) |
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
    │   ├── screens/            <- 15 ecrans
    │   │   ├── OnboardingScreen, LoginScreen, RegisterScreen
    │   │   ├── MapScreen, TrailListScreen, TrailDetailScreen
    │   │   ├── NavigationScreen, CreateSortieScreen
    │   │   ├── SortiesScreen, SortieDetailScreen
    │   │   ├── ProfileScreen, UserProfileScreen (profil public), SettingsScreen
    │   │   ├── FeedScreen, FriendsScreen
    │   ├── components/         <- 15 composants
    │   │   ├── BaseMap (forwardRef + flyTo), TrailMarkers (clustering)
    │   │   ├── TrailCard, DifficultyBadge, TrailStatusBadge
    │   │   ├── WeatherWidget, DownloadButton, ReportForm (multi-type)
    │   │   ├── SOSButton, SortieChat, IslandProgressMap
    │   │   ├── OfflineBanner, PremiumPaywall, TrailReportCard
    │   │   ├── ElevationProfile (profil altitude SVG)
    │   ├── hooks/              <- 23 hooks
    │   │   ├── useSupabaseTrails (710 trails + WKB parser)
    │   │   ├── useTrailTrace (traces GPS depuis gpx_url)
    │   │   ├── useWeather (Open-Meteo, UV, rafales, sunrise/sunset, visibilite)
    │   │   ├── useTrailStatus (ONF scraping strict)
    │   │   ├── useTrailReports + useSorties (slug→UUID resolution)
    │   │   ├── useSortieChat (Realtime + Alert erreur)
    │   │   ├── useFriends (amis, demandes, recherche users)
    │   │   ├── useFeed (posts, likes, toggle)
    │   │   ├── useAvatar (upload photo profil Supabase Storage)
    │   │   ├── useElevation (Open-Elevation API, profil altitude)
    │   │   ├── useFavorites (sentiers favoris Supabase)
    │   │   ├── useTrailReviews (avis/commentaires sentiers)
    │   │   ├── useTrailPhotos (galerie photos sentiers)
    │   │   ├── useRouting (OSRM foot profile, itineraire pieton)
    │   │   ├── useAuth, useOnboarding, useGPSTracking, etc.
    │   ├── stores/             <- 5 stores Zustand
    │   │   ├── authStore (auto-creation profil user_profiles)
    │   │   ├── progressStore (gamification 710 sentiers Supabase)
    │   │   ├── themeStore, offlineStore, premiumStore
    │   ├── navigation/         <- 7 fichiers
    │   │   ├── RootTabs (4 onglets: Carte, Sentiers, Sorties, Profil)
    │   │   ├── TrailStack, SortiesStack, ProfileStack, AuthStack
    │   │   ├── types.ts, index.ts
    │   ├── data/               <- trails.json (710 sentiers bundle local ~10MB)
    │   ├── lib/                <- parseWKB, supabase, queryClient, formatters, zones, badges, mockTrails, geo (haversine + bearing)
    │   ├── types/              <- trail, user, sortie, report
    │   └── constants/          <- theme, map (styles Positron + OpenTopoMap + Dark + colors)
    └── supabase/
        ├── migrations/
        │   ├── 001_initial_schema.sql (trails, user_profiles, activities, zones)
        │   ├── 002_sorties.sql (sorties, participants, messages + RLS + Realtime)
        │   ├── 003_trail_reports_sos.sql (trail_reports, emergency_contacts)
        │   ├── 004_social.sql (friendships, posts, post_likes + RLS)
        │   └── 005_reviews_favorites.sql (trail_reviews, user_favorites + RLS)
        └── seed/ (710 sentiers + 706 descriptions)
```

---

## Donnees en base (Supabase)

- **710 sentiers** avec traces GPS exactes (GeoJSON LineString dans gpx_url)
- **710 descriptions** nettoyees (pas de references photos)
- **11 regions** couvertes, toutes mappees en 18 zones de gamification
- **5 utilisateurs** avec profils (auto-creation a la connexion)
- **Tables** : trails, trail_conditions, user_profiles, user_activities, map_zones, trail_zones, sorties, sortie_participants, sortie_messages, trail_reports, user_emergency_contacts, friendships, posts, post_likes, trail_reviews, user_favorites
- **Storage** : bucket `avatars` (public, 2MB max, jpeg/png/webp)

---

## Phase actuelle

**SPRINTS 1+2+3 TERMINES** — Build local fonctionnel avec toutes les features (19 mars 2026).

### Features dans ce build :
- 710 sentiers avec traces GPS exactes sur la carte + JSON bundle local (~10MB)
- Carte Positron par defaut avec toggle OpenTopoMap (courbes de niveau, reliefs)
- Profil d'elevation SVG (Open-Elevation API, sous-echantillonnage 50 points)
- Meteo montagne enrichie (Open-Meteo : UV, rafales, sunrise/sunset, visibilite, alertes contextuelles)
- Statut ONF (scraping strict 2+ mots)
- GPS tracking temps reel (trace verte vif)
- Marqueurs depart (vert) et arrivee (rouge) sur la carte de navigation
- Ligne orange utilisateur vers depart du sentier + distance affichee
- Routing pieton OSRM (foot profile, plus driving)
- Badge difficulte affiche en navigation
- Stats altitude courante et distance vers depart en navigation
- Alerte hors-sentier integree dans NavigationScreen (useOffTrailAlert)
- Gamification vivante : validation GPS auto (80% du sentier), progression % temps reel
- Signalements multiples avec alerte proximite
- Sorties de groupe + chat temps reel
- Onglet Sorties dedie
- Systeme d'amis (recherche, demande, accepter/refuser)
- Feed communaute (posts libres, likes, partage progression, feed friends-only)
- Profil public (UserProfileScreen)
- Avis et commentaires sur les sentiers (trail_reviews, notes 1-5)
- Sentiers favoris (user_favorites)
- Galerie photos sentiers (useTrailPhotos)
- Photo de profil (upload Supabase Storage)
- Filtres bottom sheet ameliores
- Briefing depart (meteo + conditions avant sortie)
- Suggestions sentiers sur la carte
- Auto-recentrage carte
- Calendrier natif pour dates
- Descriptions collapsibles
- Gamification 710 sentiers / 18 zones
- Logo 1A (montagne + sentier vert)
- SafeAreaProvider (Android nav bar)
- Accessibilite (labels sur tous les boutons)
- React.memo sur composants de liste (performances)

### Prochaines etapes (Sprint 4) :
1. Tester l'APK sur Android reel
2. Corriger les bugs remontes
3. Nom de domaine (randonnee-reunion.re)
4. Comptes stores (Apple Developer 99$/an + Google Play 25$)
5. Notifications push (FCM)
6. Mode offline (cache persistant React Query)
7. Mettre a jour docs legales (RGPD : photos, avis, favoris)
8. Build production + soumission stores

---

## Points de vigilance build

- `babel-preset-expo` DOIT etre dans package.json
- `compileSdkVersion: 36` requis (androidx.core 1.17)
- NE PAS mettre `kotlinVersion` dans app.json
- NE PAS mettre `@maplibre/maplibre-react-native` dans les plugins app.json (legacy dep, le code utilise @rnmapbox/maps)
- `react-native.config.js` avec packageName explicite
- `.env` contient les secrets — NE PAS commiter
- Variables EAS configurees : EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_MAPBOX_TOKEN, EXPO_PUBLIC_METEO_API_KEY
- EXPO_PUBLIC_METEO_API_KEY n'est plus utilisee (Open-Meteo est gratuit sans cle)
- Confirmation email DESACTIVEE dans Supabase Auth
- user_profiles : auto-creation dans authStore (trigger DB non deploye)
- MOCK_TRAILS : 0 reference dans le code (tout vient de Supabase)
- JSON trails bundle : `src/data/trails.json` (~10MB), 710 sentiers avec traces nettoyees
- Carte par defaut : Positron (vectoriel, supporte les overlays). OpenTopoMap en toggle (raster, peut avoir des soucis de z-order)
- OSRM : profil `foot` (pas `driving`) pour le routing pieton
- Build local : WSL Ubuntu + Java 17 + Node 18 + EAS CLI
- `gradle.properties` : Kotlin 2.0.21, buildTools 36.1.0, Gradle 8.13, JVM heap 4096m

---

## Conventions de code

- TypeScript strict — pas de `any`
- Composants : PascalCase (`TrailCard.tsx`)
- Hooks : camelCase avec prefixe `use` (`useTrails.ts`)
- Toutes les couleurs via COLORS constants (jamais hardcode)
- accessibilityLabel sur tous les boutons/inputs
- Slug→UUID : toujours resoudre via resolveTrailId() avant requetes Supabase
- Commits : `feat:` / `fix:` / `perf:` + description
