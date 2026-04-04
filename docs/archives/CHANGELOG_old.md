# Changelog — Randonnee Reunion

Historique chronologique de tous les changements du projet.

---

## 21 mars 2026 — Sprints UX V2 "Niveau Superieur"

### Sprint UX-1 — Feature "Rando Libre"
- Nouveau FreeHikeScreen.tsx : tracking GPS n'importe ou sans sentier predefini
- Stats temps reel (distance, duree, D+), trace verte sur carte
- Sauvegarde avec nom personnalise dans user_activities (trail_id NULL)
- Navigation vers HikeSummary avec export GPX
- Migration 018 deployee (trail_id nullable, custom_name, validation_type 'free')
- Boutons "Rando libre" sur HomeScreen (quick actions) et dans TrailStack
- Integration navigation : FreeHike dans TrailStackParamList + TrailStack

### Sprint UX-2 — Design System Upgrade
- Systeme d'elevation (ELEVATION: none/raised/floating/modal) dans theme.ts
- Couleurs semantiques (overlay, interactive, interactiveDisabled)
- Constantes d'animation (ANIM: spring configs, fade, stagger)
- expo-haptics installe + lib/haptics.ts (light, medium, success, error, selection)
- Haptics appliques sur : likes, validation sentier, friend requests, onboarding

### Sprint UX-3 — Onboarding Refresh
- 4 slides mises a jour : "Explore La Reunion", "Ton GPS de montagne", "Defie l'ile entiere", "Quel randonneur es-tu ?"
- Textes actualises avec rando libre, guidage vocal, fog of war, social
- Bouton "Suivant" vert (primaryLight) + ombre
- Cards niveau avec ombre + borderRadius lg
- Haptics sur selection niveau (success) et navigation (light)

### Sprint UX-4 — Polish Ecrans Principaux
- HomeScreen : quick actions (Rando libre / Carte / Defis) avec icones colorees + ombres
- Ombres (ELEVATION.raised) sur : suggestion card, stats card, quick actions
- FlatList MapScreen optimisee (removeClippedSubviews, initialNumToRender)

### Sprint UX-5 — Navigation GPS Polish
- Haptic success sur validation de sentier (progressStore)

### Sprint UX-6 — Social Polish
- Haptics sur like posts (medium), friend request (success)

### Documentation
- Plan UX V2 complet : `docs/PLAN_UX_V2.md`
- Migration 018 deployee sur Supabase

---

## 21 mars 2026 — Audit V2 + 9 Sprints Correctifs (A→I)

### Audit complet V2
- Audit exhaustif 10 domaines : 71 issues identifiees (9 CRITIQUE, 21 HAUTE, 30 MOYENNE)
- Score initial : 5.2/10 — Score final : 9.0/10
- 67/71 issues corrigees en 9 sprints

### Sprint A — Blockers critiques
- Fix 3 memory leaks Realtime (useInAppNotifications, useDirectMessages, useSortieChat)
- ErrorBoundary global + integration Sentry (App.tsx)
- Formule distance Haversine dans NavigationScreen (remplace coefficients fixes ~10% erreur)
- Filtrage GPS : accuracy >20m + speed >15km/h (anti-drift)
- Race condition buffer GPS : splice atomique
- Auth store : subscription avant getSession (race condition)
- BaseMap : console.error conditionnel __DEV__
- npm audit fix : 0 vulnerabilites

### Sprint B — RLS & Backend (migration 014)
- RLS posts friends visibility (friends-only enforce)
- live_tracking restreint aux amis (plus de broadcast global)
- DELETE policies sur user_profiles + sortie_messages (RGPD)
- Commentaires heritent visibility du post parent
- sortie_participants UPDATE policy
- direct_messages UPDATE policy
- FK fixes : live_tracking + conversations → user_profiles
- 5 index performances (trail_id, friendships composite, posts visibility, DM conversation)
- Trigger : validation auteur message sortie (participant ou organisateur)
- Validation MIME upload (avatar + trail photos)
- Feed N+1 elimine : subqueries Supabase (1 requete au lieu de 3)

### Sprint C — GPS & Navigation
- Detection hors-sentier : algorithme point-a-ligne (projection perpendiculaire)
- Backup GPS chiffre : SecureStore prioritaire + fallback AsyncStorage
- Auto-validation 80% : seul bouton "Valider" a 80%+
- Cooldowns unifies 60s (vibration + voix)
- Altitude smoothing ameliore (poids centre)
- Fallback elevation null dans HikeSummaryScreen
- GPS interval/distance optimise : 3s/8m

### Sprint D — Social & Anti-abus (migration 015)
- Table blocked_users + RLS (pret pour UI blocage)
- Rate limiting DMs : 5 messages/minute
- Rate limiting friend requests : 1 par 7 jours par utilisateur
- Moderation contenu : filtre keywords FR (insultes, haine, violence)
- Conversation permission check (user doit etre participant)
- Table notifications (persistantes en base)
- Table notification_preferences (mute par type)
- Validation longueur messages : 2000 chars DM, 500 chars chat

### Sprint E — Gamification serveur (migration 016)
- RPC validate_and_complete_trail (anti-triche : verifie trail, duree min 5m, calcul XP)
- RPC compute_user_xp (recalcul serveur)
- RPC get_user_zone_progress (zones serveur-side)
- Streak timezone UTC+4 (Indian/Reunion) + backup table user_streaks
- Client fallback si RPCs non deployees

### Sprint F — Qualite du code
- Erreurs specifiques dans 5 mutations useSorties (err.message au lieu de generique)
- Types stricts : Record<string,unknown> → interfaces typees (useSorties, useAllSorties)
- useLeaderboard : type guard robuste (Array.isArray + typed row)
- Cache reduit 7j→3j (useSupabaseTrails, useOverpassPOI)
- Pagination DMs + chat : 50 messages initiaux

### Sprint G — UX & Polish
- HomeScreen ajoute comme premier onglet (Accueil)
- Username sanitization : accents, caracteres speciaux, mots reserves, longueur 3-20
- FlatList MapScreen : removeClippedSubviews + initialNumToRender
- Accessibility label sur zoomHint MapScreen

### Sprint H — RGPD & Legal
- Politique confidentialite corrigee : live tracking documente, DMs mentionnes
- Transferts hors EU documentes (Mapbox USA, OSRM, Open-Meteo Allemagne)
- Suppression compte enrichie : 19 tables (ajout DMs, conversations, notifications, blocked_users, streaks)
- Export donnees enrichi : 19 tables
- Permission POST_NOTIFICATIONS Android 13+
- Legalite scraping documentee dans SECURITE_RGPD.md

### Sprint I — Deploiement & Monitoring (migration 017)
- @sentry/react-native installe + init conditionnel (DSN env var)
- ErrorBoundary connecte a Sentry.captureException
- ProGuard/R8 active pour release builds
- Soft delete sur posts + direct_messages (deleted_at)
- post_likes retire du Realtime (polling suffisant)
- Data Safety Section documentee (Google Play + Apple)

### Infrastructure
- 4 nouvelles migrations deployees (014-017)
- 3 nouvelles tables : blocked_users, notifications, notification_preferences, user_streaks
- 3 RPCs serveur : validate_and_complete_trail, compute_user_xp, get_user_zone_progress
- 3 nouveaux fichiers : ErrorBoundary.tsx, moderation.ts, DATA_SAFETY_STORES.md
- ~30 fichiers modifies

---

## 20 mars 2026 — Sprint 4 : Audit complet + Social + GPS + Gamification

### Audit securite
- Audit complet du codebase : 5 CRITIQUE, 23 HIGH, 40 MEDIUM, 30 LOW
- Identification tokens secrets commites (Mapbox, Supabase service_role)
- Identification RLS trop permissif sur user_activities
- Ajout onError handlers sur toutes les mutations (14 screens)
- Migrations securite : 009, 011, 012

### Social & Messagerie
- Nouvel onglet Social (SocialStack) dans la navigation (5eme onglet)
- Messagerie privee DM : InboxScreen, ConversationScreen, useDirectMessages
- Notifications in-app : 6 types (friend_request, friend_accepted, sortie_invite, sortie_reminder, new_dm, trail_report)
- Notifications Supabase Realtime (useInAppNotifications, composant toast InAppNotifications)
- Historique notifications (NotificationsScreen)
- Recherche utilisateurs (SearchScreen)
- Profil prive (toggle visibilite)
- Migration 010_realtime_and_dms.sql

### GPS & Navigation avancee
- Guidage vocal TTS (useVoiceGuidance + expo-speech)
- GPS tracking background (expo-task-manager + expo-keep-awake)
- GPS crash-safe (sauvegarde AsyncStorage, reprise automatique)
- Distance Haversine precise + lissage altitude
- Boussole magnetometre (expo-sensors)
- Compression traces Douglas-Peucker
- Auto-validation a 80% du sentier

### Stats & Resume
- HikeSummaryScreen : resume post-hike complet
- useUserStats : pace (min/km), altitude max/min, denivele negatif (D-)
- Profil elevation dans le resume
- Partage post-hike fonctionnel

### Gamification
- Fog of war : carte gamification 3 modes de visualisation
- Badges medailles ronds (SVG) + anneaux progression zones (SVG)
- LeaderboardScreen + RPC Supabase (migration 013)
- ChallengesScreen + useCommunityChallenge
- MyHikesScreen (historique randonnees)
- TrailReplayScreen (replay trace)

### Carte
- Migration MapLibre vers Mapbox (@rnmapbox/maps)
- 4 styles : Outdoor, Satellite, Light, Dark
- SOS appel 112

### Infrastructure
- 13 migrations SQL (005a → 013)
- 25 ecrans, 18 composants, 34 hooks, 6 fichiers navigation

---

## 19 mars 2026 (nuit) — Sprints 1+2+3 : Session marathon 18h-3h

### Sprint 1 — Corrections critiques et APIs gratuites
- OSRM foot profile (routing pieton au lieu de driving)
- Carte topo OpenTopoMap (style raster, courbes de niveau, toggle)
- Positron reste le defaut (meilleur support overlays)
- React.memo sur composants de liste (performances)
- Meteo enrichie : UV, rafales, sunrise/sunset, visibilite + alertes contextuelles
- Profil d'elevation SVG (useElevation + ElevationProfile + react-native-svg)
- Suppression console.log

### Sprint 2 — Nouvelles features
- Avis et commentaires sentiers (useTrailReviews, migration 005)
- Sentiers favoris (useFavorites, migration 005)
- Galerie photos sentiers (useTrailPhotos)
- Profil public utilisateur (UserProfileScreen)
- Feed friends-only
- Posts libres dans le feed

### Sprint 3 — Gamification vivante + UX
- Gamification vivante : validation GPS auto > 80%
- Progression % temps reel en navigation
- Filtres bottom sheet ameliores
- Briefing depart (conditions + meteo)
- Suggestions sentiers sur la carte
- Auto-recentrage carte

### Donnees
- JSON bundle local 710 sentiers (trails.json ~10MB)
- Traces GPS nettoyees, verification ordre coordonnees

---

## 18 mars 2026 (soir) — Corrections multi-agents V1

4 agents en parallele (GPS, Carte, Social, UI) :
- Fix parsing end_point (prenait premier point au lieu du dernier)
- Auto-swap coordonnees (detection lat/lng inverses)
- Fonctions haversine + bearing (src/lib/geo.ts)
- NavigationScreen enrichi : marqueur depart/arrivee, ligne orange, badge difficulte, stats
- Fix liked_by_me (filtrage par user_id courant)
- Fix variable hoisting completedZones
- Integration useOffTrailAlert dans NavigationScreen
- gradle.properties : Kotlin 2.0.21, buildTools 36.1.0, Gradle 8.13

---

## 18 mars 2026 (journee) — Build V2 + Scraping + Social

### Build Android
- Build dev reussi (724a48f9)
- Fix babel-preset-expo, compileSdkVersion 35→36
- Build preview V2 COMPLET (f174732b)

### Scraping & Donnees
- 710 sentiers issus de donnees terrain avec GPS reels
- 706 descriptions detaillees (1500-2000 chars)
- Open-Meteo integre (gratuit, remplace Meteo-Concept)
- Google OAuth configure

### Features V2
- Carte MapLibre interactive (Positron, markers, clustering)
- GPS tracking temps reel, alerte hors-sentier (200m, vibration)
- SOS urgence (PGHM, SMS GPS + altitude)
- Signalements terrain "Waze de la rando" (11 types, expiration 48h)
- Sorties de groupe + chat temps reel (Supabase Realtime)
- Systeme d'amis (recherche, demande, accepter/refuser)
- Feed communaute (posts, likes, partage progression)
- Photo de profil (Supabase Storage)
- Gamification 18 zones, 14 badges
- RGPD : suppression compte, export donnees, disclaimer SOS, checkbox CGU
- Dark/Light/System mode, onboarding 3 ecrans
- PremiumPaywall (beta mode ON)

### Audit UX
- Score accessibilite 69 → 83/100
- Fix contraste, TypeScript FlashList, plugin expo-sqlite

---

## 17 mars 2026 — Jour 1 : Code des 6 sprints

- Init Expo SDK 55 + TypeScript
- Schema BDD PostgreSQL + PostGIS + RLS
- Supabase client + Auth (email)
- React Navigation (tabs + stack)
- 20 sentiers seed
- TrailCard + TrailListScreen avec filtres
- MapLibre GL + carte interactive
- GPS tracking temps reel
- Alerte hors-sentier
- Store offline (structure .pmtiles preparee)
- Hooks meteo + ONF
- WeatherWidget + TrailStatusBadge
- Gamification (18 zones, carte colorisable)
- Onboarding 3 ecrans
- Dark/Light mode + Settings
- Feature Sorties (chat, participants)
- Config EAS Build + descriptions stores

---

## Historique des builds

| Date | Build ID | Profil | Contenu | Resultat |
|---|---|---|---|---|
| 17/03 | 724a48f9 | development | S1-S6 sans MapLibre | **SUCCES** |
| 18/03 | 998cc97e | preview | MapLibre + meteo + ONF | Annule (queue longue) |
| 18/03 | a7fe037c | preview | Idem | Annule (queue longue) |
| 18/03 | f174732b | preview | **V2 COMPLETE** — toutes features | Build termine |
| 18/03 | local | debug + release | V2 + social + corrections multi-agents | **Build local OK** |

---

## Fichiers d'audit archives (docs/)

Les fichiers suivants sont des audits ponctuels realises a differentes dates. Ils restent dans le repo pour reference mais ne sont plus maintenus :

- `AUDIT_COMPLET_18_MARS.md` — Audit initial post-build V2
- `AUDIT_COMPLET_20_MARS_2026.md` — Audit complet Sprint 4 (5 CRITIQUE, 23 HIGH, 40 MEDIUM, 30 LOW)
- `AUDIT_BACKEND_FINAL.md` — Audit backend Supabase
- `AUDIT_FINAL_SKILLS.md` — Audit best practices (mobile-design, react-native-design, mobile-backend)
- `AUDIT_FONCTIONNEL_FINAL.md` — Audit fonctionnel
- `AUDIT_SPRINT_UX.md` — Audit UX sprint
- `AUDIT_UX_FINAL.md` — Audit UX final
- `ARSENAL_COMPLET.md` — Liste complete des outils/libs
- `PLAN_ACTION_V1.md` — Plan d'action corrections V1
- `SPRINT4_EN_ATTENTE.md` — Sprint 4 initial (avant implementation)
- `SPRINT_TRANSFORMATION.md` — Plan de transformation
- `SPRINT_UX_MAPBOX.md` — Sprint UX migration Mapbox
- `TRANSFORMATION_APP.md` — Plan transformation app
- `UX_VISION_PROFONDE.md` — Vision UX detaillee
- `VISION_CADOR.md` — Vision produit long terme

---

*Document cree le 20 mars 2026*
