# AUDIT SPRINT UX — 19 mars 2026

Audit systematique de toutes les nouvelles features, tables Supabase, RPCs, navigation, storage et compilation.

---

## 1. Fichiers features — Existence et contenu

| Fichier | Existe | Contenu reel |
|---|---|---|
| `app/src/screens/HomeScreen.tsx` | OUI | Ecran accueil complet (meteo, feed, suggestions, onboarding level) |
| `app/src/screens/SearchScreen.tsx` | OUI | Recherche globale (sentiers + utilisateurs, SectionList) |
| `app/src/screens/LeaderboardScreen.tsx` | OUI | Classement avec medailles or/argent/bronze |
| `app/src/screens/ChallengesScreen.tsx` | OUI | Defis thematiques avec barres de progression |
| `app/src/screens/TrailReplayScreen.tsx` | OUI | Replay anime avec Mapbox Camera |
| `app/src/screens/HikeSummaryScreen.tsx` | OUI | Celebration post-rando avec carte trace, animations Reanimated, partage |
| `app/src/screens/MyHikesScreen.tsx` | OUI | Historique randonnees avec export GPX |
| `app/src/components/Skeleton.tsx` | OUI | Skeleton loading anime (Reanimated) |
| `app/src/components/GradientHeader.tsx` | OUI | Header gradient simule (sans expo-linear-gradient) |
| `app/src/hooks/useLeaderboard.ts` | OUI | RPC get_leaderboard + get_user_rank |
| `app/src/hooks/useFriendStories.ts` | OUI | Stories amis (activites recentes < 24h) |
| `app/src/hooks/useLiveShare.ts` | OUI | Partage position temps reel via live_tracking |
| `app/src/hooks/useCommunityChallenge.ts` | OUI | Defis communautaires depuis community_challenges |
| `app/src/lib/challenges.ts` | OUI | 710+ defis thematiques pre-configures La Reunion |

**Resultat : 14/14 fichiers presents avec contenu fonctionnel.**

---

## 2. Supabase — Tables et RPCs

### Tables presentes en base

| Table | Existe | Donnees |
|---|---|---|
| `trails` | OUI | 710 sentiers |
| `trail_conditions` | OUI | - |
| `trail_reports` | OUI | - |
| `trail_reviews` | OUI | 1 review (test) |
| `trail_zones` | OUI | - |
| `map_zones` | OUI | - |
| `user_profiles` | OUI | - |
| `user_activities` | OUI | - |
| `user_favorites` | OUI | vide |
| `user_emergency_contacts` | OUI | - |
| `sorties` | OUI | - |
| `sortie_participants` | OUI | - |
| `sortie_messages` | OUI | - |
| `friendships` | OUI | - |
| `posts` | OUI | - |
| `post_likes` | OUI | - |
| `post_comments` | OUI | vide (nouvelle table) |
| `community_challenges` | OUI | 1 defi actif (Mars: 1000 km collectifs) |
| `live_tracking` | OUI | vide (pret pour le live share) |

### RPCs

| RPC | Fonctionne | Resultat |
|---|---|---|
| `get_leaderboard(lim: 5)` | OUI | Retourne 1 utilisateur (nixo, 1 trail, 14.70 km) |
| `get_user_rank(uid)` | OUI | Retourne rang 1 pour nixo |

**Resultat : 19 tables presentes, 2 RPCs fonctionnelles.**

---

## 3. Navigation — Routes enregistrees

### types.ts
| Route | Declaree |
|---|---|
| `HomeTab` | OUI (RootTabParamList) |
| `MapTab` | OUI |
| `TrailsTab` | OUI |
| `SortiesTab` | OUI |
| `ProfileTab` | OUI |
| `HikeSummary` | OUI (TrailStackParamList) |
| `TrailReplay` | OUI (TrailStack + ProfileStack) |
| `MyHikes` | OUI (ProfileStackParamList) |
| `Challenges` | OUI |
| `Leaderboard` | OUI |
| `Search` | OUI |
| `UserProfile` | OUI |

### RootTabs.tsx
- 5 onglets : Accueil (HomeScreen), Carte, Sentiers, Sorties, Profil
- Onglet Accueil present avec icone `home`

### ProfileStack.tsx
- 10 ecrans : Profile, Settings, Feed, Friends, UserProfile, MyHikes, Challenges, Leaderboard, TrailReplay, Search
- Tous imports corrects

### TrailStack.tsx
- 7 ecrans : TrailList, TrailDetail, Navigation, CreateSortie, SortieDetail, HikeSummary, TrailReplay
- HikeSummary avec `headerShown: false` (celebration plein ecran)

**Resultat : Toutes les routes declarees et enregistrees.**

---

## 4. Storage — Upload avatars

| Test | Resultat |
|---|---|
| Upload text/plain | 415 (MIME type refuse) — CORRECT, bucket securise |
| Upload image/png | 200 (succes) — CORRECT |
| Suppression test | OK (Successfully deleted) |

**Resultat : Storage bucket `avatars` fonctionne correctement avec restriction MIME.**

---

## 5. Cartographie — Migration MapLibre vers Mapbox

| Verification | Resultat |
|---|---|
| Import `@maplibre/maplibre-react-native` dans le code | ZERO (aucun import) |
| Import `@rnmapbox/maps` | OUI (BaseMap, TrailMarkers, IslandProgressMap, MapScreen, NavigationScreen, TrailDetailScreen, HikeSummaryScreen, TrailReplayScreen) |
| Styles Mapbox | OUI (outdoors-v12, satellite-streets-v12, light-v11, dark-v11) |
| Terrain 3D | OUI (mapbox-terrain-dem-v1, SkyLayer, Atmosphere) |
| Commentaire "MapLibre" residuel | 1 seul (useTrailTrace.ts ligne 29) — CORRIGE |

### Bug mineur corrige
- `useTrailTrace.ts:29` : commentaire "GeoJSON/MapLibre expects [lng, lat]" remplace par "GeoJSON/Mapbox expects [lng, lat]"
- `CLAUDE.md` : "MapLibre GL Native v10" remplace par "Mapbox GL (@rnmapbox/maps v10, ...)"
- `CLAUDE.md` : ajout `EXPO_PUBLIC_MAPBOX_TOKEN` dans les variables EAS

### Note
`@maplibre/maplibre-react-native` est encore dans `package.json` comme dependance. Elle n'est importee nulle part dans le code mais ajoute du poids inutile au bundle. Recommandation : la retirer lors du prochain nettoyage.

---

## 6. Bundle — Compilation Android

```
npx expo export --platform android --dev false
```

**Resultat : SUCCES**
- Bundle JS genere : `index-*.js` (14MB)
- Aucune erreur
- Aucun warning bloquant
- Toutes les fonts et assets inclus

---

## Resume

| Categorie | Statut | Score |
|---|---|---|
| Fichiers features | COMPLET | 14/14 |
| Tables Supabase | COMPLET | 19/19 |
| RPCs Supabase | FONCTIONNELLES | 2/2 |
| Navigation routes | COMPLET | toutes declarees |
| Storage avatars | FONCTIONNEL | MIME securise |
| Migration Mapbox | COMPLETE | 0 imports MapLibre |
| Bundle Android | COMPILE | 0 erreurs |

### Corrections appliquees
1. `app/src/hooks/useTrailTrace.ts` : commentaire MapLibre -> Mapbox
2. `CLAUDE.md` : cartographie MapLibre -> Mapbox GL (@rnmapbox/maps)
3. `CLAUDE.md` : ajout EXPO_PUBLIC_MAPBOX_TOKEN aux variables EAS

### Recommandations
1. Retirer `@maplibre/maplibre-react-native` de `package.json` (dependance morte)
2. Ajouter des donnees de test dans `community_challenges` (1 seul defi actuellement)
3. Verifier les policies RLS sur `post_comments` et `live_tracking` (tables vides, pas testees avec anon key)
