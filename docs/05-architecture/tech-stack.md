# Stack technique — Randonnée Réunion

## Choix et justifications

| Composant | Choix | Justification |
|---|---|---|
| Framework mobile | React Native + Expo SDK 55 | Cross-platform, TypeScript, EAS Build cloud |
| Cartographie | Mapbox GL (@rnmapbox/maps v10) | 4 styles natifs, clustering, meilleur support RN que MapLibre |
| Backend | Supabase (PostgreSQL + PostGIS) | Géo-requêtes, Realtime chat, Auth, Storage, gratuit MVP |
| State management | Zustand (5 stores) | Léger, pas de boilerplate, persist middleware |
| Data fetching | React Query (@tanstack/react-query) | Cache, retry, pagination, mutations |
| Navigation | React Navigation v7 | Bottom tabs + native stacks, 6 onglets |
| Animations | React Native Reanimated + Gesture Handler | Performant, thread UI natif |
| Bottom sheet | @gorhom/bottom-sheet | Standard RN, performant |
| Météo | Open-Meteo API | Gratuit, illimité, couvre La Réunion |
| Statut ONF | Scraping onf.fr | Pas de serveur, cache 1h |
| Auth | Supabase Auth | Email + Google OAuth |
| Storage | Supabase Storage | Avatars (2MB), photos sentiers |
| Élévation | Open-Elevation API | Profil altitude SVG |
| Routing | OSRM foot profile | Itinéraire piéton vers départ |
| SVG | react-native-svg | Profils, badges, anneaux progression |
| Voix | expo-speech | Guidage vocal TTS |
| Capteurs | expo-sensors | Magnétomètre / boussole |
| Background | expo-task-manager + expo-keep-awake | GPS background, crash-safe |
| Monitoring | Sentry | Crash reporting production |
| Build | EAS Build (cloud) ou local WSL Ubuntu | Android + iOS |

## Alternatives écartées

- **MapLibre** : problèmes de build EAS, plugin legacy (→ Mapbox)
- **Firebase** : pas de PostGIS, NoSQL pas adapté aux données géo (→ Supabase)
- **Météo-Concept** : 500 appels/jour limité (→ Open-Meteo illimité)
- **Redux** : trop de boilerplate pour un projet solo (→ Zustand)
- **Flutter** : moins de libs cartographie RN matures (→ React Native)

Voir project/DECISIONS.md pour le contexte complet de chaque décision.
