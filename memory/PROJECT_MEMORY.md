# PROJECT_MEMORY.md — Randonnee Reunion
> Memoire longue du projet. Mise a jour le 17 mars 2026.

---

## Porteur du projet

- **Nom** : Nicolas
- **Profil** : Data Analyst junior, Reunionnais
- **Approche dev** : Vibe coding avec Claude Code — 6 sprints en 1 session
- **Plateformes cibles** : iOS + Android
- **Date de demarrage** : 17 mars 2026

---

## Vision produit

Creer **la reference numerique pour la randonnee a La Reunion** :
- Toutes les infos officielles (sentiers OMF, meteo)
- Cartes offline (critique pour Mafate = 0 reseau)
- Gamification : colorier l'ile au fil des sentiers
- Feature sociale : organiser des randos en groupe

**Positionnement :** *"La premiere app qui te donne envie de decouvrir toute La Reunion — pas juste de t'y retrouver."*

---

## Comptes et acces

| Service | Compte | Statut |
|---|---|---|
| GitHub | Nicolas97450 | Actif |
| Expo/EAS | @nicolasreunionlouis | Actif |
| Supabase | wnsitmaxjgbprsdpvict.supabase.co | Actif, schema deploye |
| meteo-concept.com | Cle API dans .env | Actif |
| Apple Developer | Non cree | Requis pour App Store (99$/an) |
| Google Play | Non cree | Requis pour Play Store (25$ une fois) |

---

## Historique des sprints

### Sprint 1 — Fondations (17 mars 2026)
- Init Expo SDK 55 + TypeScript strict
- ESLint + Prettier + path aliases (@/)
- React Navigation : bottom tabs (Carte/Sentiers/Profil) + stack
- Schema PostgreSQL + PostGIS + RLS policies
- 20 sentiers seed avec GPS reels
- Supabase client + SecureStore session
- Auth : Login/Register + Zustand store
- React Query setup + hook useTrails

### Sprint 2 — Cartes & GPS (17 mars 2026)
- MapLibre GL Native v10 (style CartoDB dark)
- Markers colores par difficulte sur la carte
- MapScreen : carte plein ecran + bottom sheet
- TrailDetailScreen : mini carte, stats, download, CTA
- GPS tracking temps reel (5s interval)
- Alerte hors-sentier (Haversine, 200m, vibration)
- Store offline (download/delete .pmtiles)
- NavigationScreen avec stats live

### Sprint 3 — Donnees Live & Gamification (17 mars 2026)
- Edge Function /weather (proxy meteo-concept, cache 30min)
- Edge Function /trail-status (scrape OMF, cache 1h)
- Edge Function /tiles-download-url (URL signees)
- WeatherWidget (previsions 3 jours)
- TrailStatusBadge (ouvert/ferme/degrade)
- 18 zones geographiques pour la gamification
- IslandProgressMap (carte gris → vert)
- progressStore (Zustand) : validation sentiers, zones
- ProfileScreen : carte ile, stats, progression par zone

### Sprint 4 — Polish UX (17 mars 2026)
- Onboarding 3 ecrans (Explore / Offline / Gamification)
- Dark/Light/System theme (Zustand store)
- SettingsScreen : theme, cartes offline, infos app
- OfflineBanner : detection auto NetInfo
- ProfileStack : Profil → Parametres navigation

### Sprint 5 — Build & Stores (17 mars 2026)
- Config EAS Build (development, preview, production)
- Descriptions stores (FR, ASO optimise)
- expo-dev-client pour development builds
- Fix : expo-build-properties (minSdkVersion 26 pour MapLibre)
- Fix : retrait MapLibre des plugins Expo (pas de config plugin)
- Fix : alignement versions packages SDK 55

### Sprint 6 — Feature Sorties (17 mars 2026)
- Migration 002 : tables sorties, participants, messages
- RLS policies (organisateur, participants, chat)
- Supabase Realtime active sur sortie_messages
- Hooks : create, join, cancel, accept/refuse participants
- Chat temps reel (useSortieChat)
- CreateSortieScreen (formulaire complet)
- SortieDetailScreen (onglets Chat / Participants)

---

## Decisions produit

| # | Decision | Raison |
|---|---|---|
| 1 | React Native + Expo | Ecosysteme MapLibre mature, TypeScript, time to market |
| 2 | MapLibre + PMTiles | Open-source, 100% offline, pas de licence Mapbox |
| 3 | Supabase | PostGIS inclus, Realtime pour chat, gratuit au MVP |
| 4 | Validation GPS + fallback manuel | Ne pas frustrer en zone sans GPS precis |
| 5 | Freemium 3 cartes offline | Bon levier de conversion, meteo/OMF restent gratuits |
| 6 | Feature Sorties en Sprint 6 | Complexe, apres validation du core |

---

## Bugs connus / Points de vigilance

- **MapLibre** ne doit PAS etre dans les plugins app.json (crash autolinking)
- **expo-build-properties** requis avec minSdkVersion 26
- **react-native-worklets** est un peer dependency silencieux de reanimated
- Le `.env` contient la cle Supabase + meteo — ne pas commiter
- Les Edge Functions ne sont pas encore deployees sur Supabase
- La migration 002_sorties.sql n'est pas encore executee dans Supabase

---

## Concurrence

| Concurrent | Notre avantage |
|---|---|
| Randopitons | UX moderne, gamification, meteo, OMF, Sorties |
| AllTrails | Zero donnee Reunion, pas de gamification |
| Komoot | Pas de focus Reunion, pas de donnees OMF |
| Strava | Outil post-sortie, integration prevue V2 |

**Fenetre d'opportunite : 12-18 mois**

---

## Metriques cibles

| Metrique | Cible | Delai |
|---|---|---|
| Telechargements actifs | 10 000 | M6 |
| Note stores | >= 4.5/5 | M3 |
| Retention J30 | >= 40% | M3 |
| Conversion freemium | >= 8% | M6 |

---

## Couts

| Poste | Cout |
|---|---|
| Infrastructure MVP | ~0 EUR/mois (free tiers) |
| Apple Developer | 99 USD/an |
| Google Play | 25 USD (une fois) |
| Meteo API | Gratuit (500 appels/jour) |
| Expo EAS | Gratuit (30 builds/mois) |

---

*Derniere mise a jour : 17 mars 2026 — Tous les sprints termines*
