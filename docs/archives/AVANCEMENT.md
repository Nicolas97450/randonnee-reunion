# Avancement — Randonnee Reunion

---

## 22 mars 2026 — Audit ultra-complet + Plan de deploiement

### Audit exhaustif 7 domaines (7 agents paralleles)
- [x] Securite & RLS : **7.3/10** — token Mapbox expose, storage policies, moderation client-only
- [x] Architecture & Code : **8.2/10** — TypeScript strict, 0 any, ecrans trop longs
- [x] UX & Ecrans : **8.2/10** — 174 accessibilityLabel, 33 couleurs hardcodees
- [x] Backend & Donnees : **8.8/10** — 710 sentiers, 25 tables, 90 RLS policies, N+1 elimine
- [x] GPS & Cartographie : **7.8/10** — crash-safe excellent, offline maps manquant
- [x] Build & Deploiement : **6.8/10** — config build parfaite, blockers operationnels
- [x] Social & Gamification : **9.0/10** — 21 badges, 8 defis, DM Realtime, feed, sorties
- [x] **Note globale : 8.0/10**
- [x] Rapport complet : `docs/AUDIT_22_MARS_2026.md`

### Plan de deploiement cree
- [x] 6 sprints planifies (Sprint 10-15) + post-lancement (Sprint 16+)
- [x] Separation CLAUDE / NICOLAS pour chaque tache
- [x] Timeline : 3 semaines jusqu'a publication stores
- [x] Budget : ~126 EUR (domaine + comptes stores)
- [x] Plan complet : `docs/PLAN_DEPLOIEMENT.md`

### Prochaines actions immediates
- [ ] **NICOLAS** : Revoquer token Mapbox + creer Sentry + commander domaine
- [ ] **CLAUDE** : Sprint 10 — correctifs securite (validation upload, storage policies, couleurs, FlatList perf)

---

## 21 mars 2026 — Audit V2 + 9 Sprints Correctifs

### Audit exhaustif V2
- [x] Audit 10 domaines par 5 agents en parallele : 71 issues identifiees
- [x] Score initial : 5.2/10 (9 CRITIQUE, 21 HAUTE, 30 MOYENNE, 7 FAIBLE)
- [x] Rapport documente : `docs/AUDIT_COMPLET_V2_20_MARS_2026.md`
- [x] Template d'audit reutilisable : `docs/PROMPT_AUDIT_TEMPLATE.md`
- [x] Plan de sprints : `docs/PLAN_SPRINTS_CORRECTIFS.md`

### 9 Sprints Correctifs (67/71 issues fixees)
- [x] **Sprint A** — Memory leaks Realtime, ErrorBoundary, Haversine, GPS filtering, race condition
- [x] **Sprint B** — Migration 014 : RLS policies (posts friends, live_tracking), DELETE policies, FK, 5 index, trigger, upload validation, feed N+1
- [x] **Sprint C** — Hors-sentier point-a-ligne, SecureStore GPS, auto-validation 80%, cooldowns 60s, altitude smoothing
- [x] **Sprint D** — Migration 015 : blocked_users, rate limiting DMs/friends, moderation keywords, conversation permission, notifications persistantes
- [x] **Sprint E** — Migration 016 : RPCs anti-triche (validate_trail, compute_xp, zone_progress), streaks UTC+4 + backup serveur
- [x] **Sprint F** — Erreurs specifiques mutations, types stricts, type guard leaderboard, cache 3j, pagination 50 msgs
- [x] **Sprint G** — HomeTab dans onglets, username sanitization, FlatList perf, accessibility
- [x] **Sprint H** — Politique RGPD corrigee (live tracking, DMs, transferts EU), suppression compte 19 tables, POST_NOTIFICATIONS
- [x] **Sprint I** — Migration 017 : Sentry installe, ProGuard active, soft delete posts/DMs, Realtime cleanup

### Audit final
- [x] Score final : **9.0/10** (0 CRITIQUE, 1 HAUTE restante)
- [x] Rapport : `docs/AUDIT_FINAL_POST_SPRINTS.md`

### Migrations deployees sur Supabase
- [x] 014_rls_security_fixes.sql (10 policies, 5 index, 3 FK, 1 trigger)
- [x] 015_social_security.sql (blocked_users, notifications, notification_preferences)
- [x] 016_server_validation.sql (3 RPCs, user_streaks)
- [x] 017_soft_delete_realtime.sql (soft delete, Realtime cleanup)

### Nouveaux fichiers
- [x] `src/components/ErrorBoundary.tsx` — ecran crash recovery + Sentry
- [x] `src/lib/moderation.ts` — filtre contenu FR (insultes, haine)
- [x] `docs/DATA_SAFETY_STORES.md` — declarations Google Play + Apple
- [x] `docs/AUDIT_COMPLET_V2_20_MARS_2026.md`
- [x] `docs/AUDIT_FINAL_POST_SPRINTS.md`
- [x] `docs/PROMPT_AUDIT_TEMPLATE.md`
- [x] `docs/PLAN_SPRINTS_CORRECTIFS.md`
- [x] `docs/ACTIONS_MANUELLES_NICOLAS.md`

### Restant (post-beta)
- [ ] Chiffrement E2E des DMs (Supabase at-rest suffit pour beta)
- [ ] Creer projet Sentry + ajouter DSN
- [ ] Comptes Apple Developer + Google Play
- [ ] Adapter les descriptions de sentiers si necessaire

---

## 17 mars 2026 — Jour 1 : Code des 6 sprints

- [x] Init Expo SDK 55 + TypeScript
- [x] Schema BDD PostgreSQL + PostGIS + RLS
- [x] Supabase client + Auth (email)
- [x] React Navigation (tabs + stack)
- [x] 20 sentiers seed
- [x] TrailCard + TrailListScreen avec filtres
- [x] MapLibre GL + carte interactive
- [x] GPS tracking temps reel
- [x] Alerte hors-sentier
- [x] Store offline (structure .pmtiles preparee, serveur non disponible)
- [x] Hooks meteo + ONF (appels directs, pas d'Edge Functions)
- [x] WeatherWidget + TrailStatusBadge
- [x] Gamification (18 zones, carte colorisable)
- [x] Onboarding 3 ecrans
- [x] Dark/Light mode + Settings
- [x] Feature Sorties (chat, participants)
- [x] Config EAS Build
- [x] Descriptions stores

---

## 18 mars 2026 — Jour 2 : Build, scraping, V2 complete

### Build Android
- [x] Build dev reussi (724a48f9) — teste sur emulateur
- [x] Fix : babel-preset-expo (cause racine crash autolinking)
- [x] Fix : compileSdkVersion 35→36
- [x] Fix : trigger handle_new_user
- [x] Fix : confirmation email desactivee
- [x] Build preview V2 COMPLET — **f174732b** — termine

### Scraping & Donnees
- [x] 710 sentiers issus de donnees terrain avec GPS reels
- [x] 706 descriptions detaillees (1500-2000 chars chacune)
- [x] Migration 002 Sorties executee dans Supabase
- [x] Migration 003 Trail Reports + SOS executee dans Supabase (17/03/2026 via CLI)
- [x] Open-Meteo integre (gratuit, sans cle — remplace Meteo-Concept)
- [x] Google OAuth configure (Google Cloud + Supabase)
- [x] Migration 004 social executee (friendships, posts, post_likes)

### V2 — Features codees et integrees

#### Donnees & APIs
- [x] 710 sentiers reels avec GPS (donnees terrain locales)
- [x] 706 descriptions detaillees
- [x] Meteo 3 jours (Open-Meteo, coordonnees exactes, descriptions tropicales — PAS Meteo-Concept)
- [x] Statut ONF dynamique (scraping live onf.fr, cache 1h, matching strict 2+ mots)

#### Carte & Navigation
- [x] Carte MapLibre interactive (fond Positron clair, markers colores, clustering par difficulte)
- [x] GPS tracking temps reel (position, trace verte, stats)
- [x] Alerte hors-sentier (200m, vibration)
- [x] Bouton SOS urgence (appel PGHM, SMS avec GPS, numeros urgence)
- [x] Bouton SOS integre dans NavigationScreen + TrailDetailScreen

#### Game Changers
- [x] Waze de la rando — Signalements terrain temps reel
  - 11 types (boue, arbre, eau, brouillard, danger...)
  - Position GPS automatique, expire apres 48h
  - Formulaire de signalement (ReportForm)
  - Affichage des signalements sur la fiche sentier
  - Integre dans NavigationScreen (bouton + modal)
- [x] Bouton SOS urgence
  - Appel direct PGHM Reunion (0262 930 930)
  - SMS avec coordonnees GPS + altitude + lien Google Maps
  - Numeros urgence expandables (SAMU, Pompiers, 112)
  - Fonctionne sans internet (GPS = satellites, SMS = 2G)

#### Social — Sorties de groupe
- [x] Creer une sortie (formulaire complet)
- [x] Chat temps reel (Supabase Realtime)
- [x] Gestion participants (accepter/refuser)
- [x] Bouton "Organiser une sortie" sur chaque sentier
- [x] Onglet Sorties dedie dans la navigation
- [ ] Notifications push — Rappel J-1 avant sortie — hook code mais PAS CONNECTE
- [ ] Integration Strava — Export activite + deep link — hook code mais PAS CONNECTE
- [ ] Partage position live en sortie — PAS CODE
- [ ] Auto-fermeture chat 24h — PAS CODE

#### Social — Reseau (migration 004)
- [x] Systeme d'amis (recherche utilisateurs, demande, accepter/refuser/supprimer)
- [x] Feed communaute (posts texte, likes avec liked_by_me corrige)
- [x] Partage de progression dans le feed
- [x] Photo de profil (upload Supabase Storage, 2MB max, jpeg/png/webp)

#### Gamification
- [x] 18 zones geographiques (carte qui se colorie)
- [x] Progression par zone (gris → vert gradient)
- [x] 14 badges (progression, distance, denivele, regions, social, communaute)
  - Premier Pas, Randonneur, Explorateur, Legendaire
  - 50km, 200km, Sommet 3000m, Grimpeur 10000m D+
  - Maitre des Cirques, Zone Complete, Tour de l'Ile
  - Leader (premiere sortie), Sentinelle, Veilleur

#### Authentification & Securite
- [x] Connexion email + mot de passe
- [x] Connexion Google OAuth
- [x] Session SecureStore (persistee)
- [x] Onboarding 3 ecrans (adapte aux features actuelles)

#### RGPD & Conformite
- [x] Document SECURITE_RGPD.md complet
- [x] Bouton "Supprimer mon compte" (Settings → Zone dangereuse)
- [x] Export donnees personnelles en JSON (RGPD Art. 20)
- [x] Liens Politique de confidentialite + CGU dans Settings
- [x] useAccountActions hook (export + suppression)
- [x] Popup disclaimer SOS (avertissement premiere utilisation) dans SOSButton.tsx
- [x] Checkbox CGU obligatoire a l'inscription dans RegisterScreen.tsx
- [x] Documents legaux rediges : politique de confidentialite + CGU (private/legal/)

#### Monetisation
- [x] premiumStore (Zustand) avec beta mode
- [x] PremiumPaywall component (19.99 EUR/an ou 2.99 EUR/mois)
- [x] react-native-purchases installe (package uniquement)
- [ ] RevenueCat — PAS CONFIGURE (pas de compte, pas de produits in-app)
- [x] SettingsScreen : statut abonnement + bouton premium
- [x] Beta mode ON par defaut (tout accessible pendant les tests, paywall non actif)

#### UX
- [x] Dark / Light / System mode
- [x] Offline banner (detection reseau)
- [x] SettingsScreen complet (premium, theme, offline, RGPD, about, danger zone)

#### Branding & Assets
- [x] Brand guide cree (private/branding/brand-guide.html + design-tokens.json)
- [x] Checklist pre-deploiement creee (docs/PRE_DEPLOIEMENT.md)
- [x] Checklist test app creee (private/dashboards/checklist-test-app.html)

#### Infrastructure
- [x] Migration 003 executee dans Supabase (trail_reports + user_emergency_contacts)
- [x] Supabase CLI lie au projet (npx supabase db query --linked)

### Audit UX & Corrections (18/03 apres-midi)
- [x] Audit accessibilite/UX : score **69 → 83/100**
- [x] Fix contraste : textMuted #78716c → #8a8178, icones SOS primary → primaryLight
- [x] Fix TypeScript FlashList (retrait estimatedItemSize)
- [x] Plugin expo-sqlite ajoute dans app.json
- [x] Packages Expo mis a jour (17/17 checks passed)
- [ ] Nouveau build preview lance (en attente)

### Verification technique
- [x] TypeScript : zero erreur
- [x] Expo Doctor : 17/17 checks passed (packages a jour)
- [x] Git : tout pousse sur main

---

## 18 mars 2026 (soir) — Corrections multi-agents V1

Execution du PLAN_ACTION_V1 par 4 agents en parallele (GPS, Carte, Social, UI).

### Agent GPS/Traces
- [x] Corrige parsing `end_point` dans `useSupabaseTrails.ts` (prenait toujours le premier point au lieu du dernier)
- [x] Ajout warnings dans `useTrailTrace.ts` quand une trace est null ou corrompue
- [x] Ajout auto-swap coordonnees (detection et correction automatique lat/lng inverses)

### Agent Carte/Navigation
- [x] Cree `src/lib/geo.ts` : fonctions haversine (distance entre 2 points) et bearing (direction)
- [x] NavigationScreen enrichi :
  - Marqueur vert au point de depart du sentier
  - Marqueur rouge au point d'arrivee
  - Ligne orange utilisateur vers depart du sentier
  - Badge difficulte affiche pendant la navigation
  - Stats altitude courante et distance vers le depart

### Agent Social/Feed
- [x] Corrige `liked_by_me` dans `useFeed.ts` (filtrage par user_id courant)
- [x] Fix variable hoisting `completedZones` dans `ProfileScreen.tsx`
- [x] Reduit `staleTime` du feed de 2 min a 30 secondes
- [x] Agrandi boutons sociaux (Feed/Amis) dans ProfileScreen

### Agent UI/Integration
- [x] Integre `useOffTrailAlert` dans NavigationScreen (alerte hors-sentier active en navigation)
- [x] Verifie fonctionnement OfflineBanner
- [x] Verifie coherence navigation entre ecrans

### Configuration build
- [x] `gradle.properties` mis a jour : Kotlin 2.0.21, buildTools 36.1.0, Gradle 8.13, JVM heap 4096m

---

## 19 mars 2026 (nuit) — Session marathon 18h-3h : Sprints 1+2+3 + UX + audit donnees

Session intensive de 9 heures. Audit final des skills, 3 sprints d'amelioration, nettoyage des traces, nouvelles features.

### Audit final skills (AUDIT_FINAL_SKILLS.md)
- [x] Audit best practices mobile-design, react-native-design, mobile-backend
- [x] Score amelioration (pas de refonte) — stack validee, trous comblables
- [x] Identification de 9 priorites Sprint 1

### Sprint 1 — Corrections critiques et APIs gratuites
- [x] OSRM foot profile : routing pieton au lieu de driving (useRouting.ts)
- [x] Carte topo OpenTopoMap : style raster avec courbes de niveau (map.ts, BaseMap.tsx, MapScreen.tsx)
- [x] Toggle topo/Positron sur la carte (bouton couches)
- [x] Positron reste le defaut (meilleur support overlays MapLibre)
- [x] React.memo sur composants de liste (TrailCard, SortieChat, FeedScreen, FriendsScreen, SortieDetailScreen)
- [x] Meteo enrichie : UV, rafales, sunrise/sunset, visibilite + alertes contextuelles (useWeather.ts, WeatherWidget.tsx)
- [x] Profil d'elevation SVG (useElevation.ts + ElevationProfile.tsx + react-native-svg)
- [x] Open-Elevation API avec sous-echantillonnage 50 points
- [x] Suppression console.log (useNotifications.ts, RegisterScreen.tsx)

### Sprint 2 — Nouvelles features
- [x] Avis et commentaires sentiers (useTrailReviews.ts, migration 005)
- [x] Sentiers favoris (useFavorites.ts, migration 005)
- [x] Galerie photos sentiers (useTrailPhotos.ts)
- [x] Profil public utilisateur (UserProfileScreen.tsx)
- [x] Feed friends-only (posts amis uniquement)
- [x] Posts libres dans le feed (pas seulement partage progression)
- [x] Migration 005_reviews_favorites.sql (trail_reviews + user_favorites + RLS)

### Sprint 3 — Gamification vivante + UX
- [x] Gamification vivante : validation GPS auto quand > 80% du sentier parcouru
- [x] Progression % temps reel en navigation
- [x] Filtres bottom sheet ameliores
- [x] Briefing depart (conditions + meteo avant sortie)
- [x] Suggestions sentiers sur la carte (sentiers proches)
- [x] Auto-recentrage carte sur la position utilisateur

### Audit et nettoyage donnees
- [x] JSON bundle local des 710 sentiers (src/data/trails.json, ~10MB)
- [x] Traces GPS nettoyees (points parasites supprimes)
- [x] Verification ordre coordonnees (lng,lat)

### Bilan technique
- 15 ecrans (+ UserProfileScreen)
- 15 composants (+ ElevationProfile)
- 23 hooks (+ useElevation, useFavorites, useTrailReviews, useTrailPhotos, useRouting)
- 5 stores Zustand
- 5 migrations SQL (+ 005_reviews_favorites)
- JSON bundle local trails.json (~10MB)

---

## 20 mars 2026 — Sprint 4 : Audit complet + Social + GPS + Gamification

Session majeure : audit de securite complet, puis implementation massive de nouvelles features.

### Audit complet du codebase
- [x] Audit automatise : 5 CRITIQUE, 23 HIGH, 40 MEDIUM, 30 LOW identifies
- [x] Token Mapbox secret identifie dans gradle.properties (a revoquer)
- [x] Cle service_role Supabase identifiee dans .env (a deplacer cote serveur)
- [x] RLS user_activities trop permissif identifie (migration 009 correctif)

### Social — Messagerie privee & Notifications
- [x] Onglet Social dedie (SocialStack dans RootTabs, 5eme onglet)
- [x] InboxScreen : liste des conversations DM
- [x] ConversationScreen : messages prives en temps reel
- [x] useDirectMessages hook (CRUD + Supabase Realtime)
- [x] SearchScreen : recherche d'utilisateurs
- [x] Notifications in-app : 6 types (friend_request, friend_accepted, sortie_invite, sortie_reminder, new_dm, trail_report)
- [x] useInAppNotifications hook (Supabase Realtime)
- [x] Composant InAppNotifications (overlay toast)
- [x] NotificationsScreen : historique des notifications
- [x] Migration 010_realtime_and_dms.sql deployee

### GPS & Navigation avancee
- [x] Guidage vocal TTS (useVoiceGuidance + expo-speech)
- [x] GPS tracking background (expo-task-manager)
- [x] expo-keep-awake (ecran actif pendant navigation)
- [x] GPS crash-safe : sauvegarde AsyncStorage des points, reprise apres crash
- [x] Distance Haversine precise (remplacement calcul approximatif)
- [x] Lissage altitude (suppression bruit GPS)
- [x] Boussole magnetometre (expo-sensors)
- [x] Compression traces Douglas-Peucker
- [x] Auto-validation a 80% du sentier parcouru

### Stats & Resume de randonnee
- [x] useUserStats hook (stats enrichies)
- [x] HikeSummaryScreen : resume post-hike complet
- [x] Pace (min/km), altitude max/min, denivele negatif (D-)
- [x] Profil d'elevation dans le resume
- [x] Partage post-hike fonctionnel

### Gamification avancee
- [x] Fog of war : carte gamification 3 modes de visualisation
- [x] Badges medailles ronds (SVG)
- [x] Anneaux de progression par zone (SVG)
- [x] LeaderboardScreen + leaderboard RPC Supabase (migration 013)
- [x] ChallengesScreen : defis communautaires
- [x] useCommunityChallenge hook

### Carte & UX
- [x] 4 styles carte Mapbox : Outdoor, Satellite, Light, Dark
- [x] Migration de MapLibre vers Mapbox (@rnmapbox/maps)
- [x] Profil prive (toggle visibilite)
- [x] SOS appel 112
- [x] Skeleton loading component
- [x] GradientHeader component

### Securite & Stabilite
- [x] onError handlers sur toutes les mutations (14 screens corriges)
- [x] Migration 009_security_fixes.sql (corrections RLS)
- [x] Migration 011_fix_participant_policies.sql
- [x] Migration 012_fix_foreign_keys.sql
- [x] Migration 013_leaderboard_rpc.sql

### Ecrans supplementaires
- [x] HomeScreen (accueil)
- [x] MyHikesScreen (historique randonnees)
- [x] TrailReplayScreen (replay d'une trace)
- [x] SearchScreen (recherche globale)
- [x] LeaderboardScreen (classement)
- [x] ChallengesScreen (defis)
- [x] InboxScreen (messagerie)
- [x] ConversationScreen (conversation DM)
- [x] NotificationsScreen (historique notifications)

### Hooks supplementaires
- [x] useVoiceGuidance, useDirectMessages, useInAppNotifications, useUserStats
- [x] useLeaderboard, useCommunityChallenge, useCycloneAlert
- [x] useLiveShare, useOverpassPOI, useFriendStories
- [x] useAllSorties, useTrailDetail

### Bilan technique Sprint 4
- 25 ecrans (+ HomeScreen, HikeSummaryScreen, TrailReplayScreen, MyHikesScreen, SearchScreen, InboxScreen, ConversationScreen, NotificationsScreen, LeaderboardScreen, ChallengesScreen)
- 18 composants (+ Skeleton, GradientHeader, InAppNotifications)
- 34 hooks (+ 11 nouveaux)
- 5 stores Zustand (inchanges)
- 13 migrations SQL (+ 005a/b/c, 006, 007, 008, 009, 010, 011, 012, 013)
- 6 fichiers navigation (+ SocialStack)

---

## Ce qui reste a faire

### Avant deploiement stores
- [x] Build preview V2 reussi (f174732b)
- [x] Executer migration 003 dans Supabase (trail_reports + user_emergency_contacts) — FAIT 17/03/2026
- [x] Supabase CLI lie au projet — FAIT 17/03/2026
- [x] Documents legaux rediges (politique confidentialite + CGU) — FAIT 17/03/2026
- [x] Brand guide cree (brand-guide.html + design-tokens.json) — FAIT 17/03/2026
- [x] Disclaimer SOS (popup premiere utilisation) — FAIT 17/03/2026
- [x] Checkbox CGU obligatoire a l'inscription — FAIT 17/03/2026
- [x] Checklist test app creee — FAIT 17/03/2026
- [x] Checklist pre-deploiement creee — FAIT 17/03/2026
- [ ] Tester sur Android reel
- [ ] Corriger les bugs remontes
- [ ] Branding (logo, icone, couleurs, nom definitif)
- [ ] Heberger politique de confidentialite + CGU (URL web)
- [ ] Creer compte Apple Developer (99$/an)
- [ ] Creer compte Google Play Developer (25$)
- [ ] Configurer RevenueCat (produits in-app)
- [ ] Screenshots stores
- [ ] Soumission App Store + Play Store

### Ameliorations futures (Sprint 5+)
- [ ] Cartes offline (.pmtiles) — serveur Linux necessaire, pas de serveur
- [ ] Notifications push — hook code mais pas connecte (serveur push requis, FCM)
- [ ] Cache persistant React Query avec AsyncStorage (sentiers + meteo offline)
- [ ] Integration Strava — hook code mais pas connecte (compte Strava requis)
- [ ] Partage position live en sortie — hook code (useLiveShare) mais pas teste
- [ ] Auto-fermeture chat 24h — pas code
- [ ] Analytics (PostHog ou Amplitude) — pas implemente
- [ ] Page "Mes donnees" (Art. 15 RGPD) — pas codee
- [ ] Covoiturage vers les departs de sentier
- [ ] Moderation photos/avis (moderation requise avant ouverture publique)
- [ ] Version anglaise
- [ ] Apple Watch / Garmin
- [ ] Partenariat officiel ONF/IRT

---

## Historique des builds

| Date | Build ID | Profil | Contenu | Resultat |
|---|---|---|---|---|
| 17/03 | 724a48f9 | development | S1-S6 sans MapLibre | **SUCCES** |
| 18/03 | 998cc97e | preview | MapLibre + meteo + ONF | Annule (queue longue) |
| 18/03 | a7fe037c | preview | Idem | Annule (queue longue) |
| 18/03 | f174732b | preview | **V2 COMPLETE** — toutes features | Build termine |
| 18/03 | local | debug + release | V2 + social (amis, feed, likes, photo profil) + corrections multi-agents | **Build local OK** (quota EAS atteint) |

---

## Comptes et acces

| Service | Compte | Statut |
|---|---|---|
| GitHub | Nicolas97450 | Actif |
| Expo/EAS | @nicolasreunionlouis | Actif |
| Supabase | wnsitmaxjgbprsdpvict | Actif (710 sentiers + 706 descriptions) |
| Google Cloud | valiant-student-484810-k1 | OAuth configure |
| Open-Meteo | Gratuit, sans cle | Actif (remplace Meteo-Concept) |
| Apple Developer | Non cree | Requis pour App Store |
| Google Play | Non cree | Requis pour Play Store |
| RevenueCat | Non cree | Requis pour les paiements |

---

*Document mis a jour le 20 mars 2026 — Sprint 4 en cours : DM, notifications Realtime, guidage vocal, GPS background crash-safe, fog of war, leaderboard, badges SVG, boussole, 4 styles Mapbox, securite, audit complet*
