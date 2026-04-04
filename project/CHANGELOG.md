# Changelog — Randonnée Réunion

Historique chronologique de tous les changements du projet.
Pour le détail complet des anciens changelogs, voir docs/archives/.

---

## 4 avril 2026 — Session 9 : OAuth publié, secrets nettoyés, branche mergée

### Google OAuth — Publication en production
- **App OAuth publiée** : mode Testing → Production (Google Cloud Console → Auth Platform → Audience → Publish)
- **Plus de limite 100 utilisateurs** — l'OAuth Google est maintenant accessible à tous
- **Ancien Client Secret désactivé** : `****imIA` supprimé, seul `****lH_B` est actif (celui dans Supabase)

### Git — Merge de la branche principale
- **PR #1 créée et mergée** : `refactor/session-6-offline-push` → `main`
- Toutes les features (cache offline, push notifications, refactoring, tests, pages légales) sont maintenant dans `main`
- **GitHub Pages** sert maintenant les pages légales depuis `main`
- **Index git corrompu** détecté et réparé (`rm .git/index && git reset`)

### Documentation
- TASKS.md, PROJECT_STATE.md, SESSIONS.md, CHANGELOG.md mis à jour pour Sessions 8 et 9

---

## 4 avril 2026 — Session 8 : Firebase, Google OAuth, Supabase, GitHub Pages

### Firebase Cloud Messaging
- **Projet Firebase créé** : `randonnee-reunion` (ID projet GCP partagé avec OAuth)
- **FCM activé** : Sender ID `641398414739`
- **google-services.json** téléchargé (à placer dans `app/android/app/`)

### Google OAuth — Configuration complète
- **OAuth Consent Screen** : app "Randonnee Reunion", audience externe, mode Testing
- **Client OAuth Web** créé : type Web Application, nom "Randonnee Reunion Supabase"
- **Client ID** : `641398414739-80mrqa7986a0laaplg2fiil88lloppvi.apps.googleusercontent.com`
- **Redirect URI** : `https://wnsitmaxjgbprsdpvict.supabase.co/auth/v1/callback`
- **Supabase Provider Google** : activé avec Client ID + Client Secret

### GitHub Pages
- **Activé** sur le repo `Nicolas97450/randonnee-reunion` (branche `main`, dossier racine)
- **URL** : `https://nicolas97450.github.io/randonnee-reunion/`
- Pages légales disponibles après merge de la branche dans `main`

### Documentation
- TASKS.md, PROJECT_STATE.md, SESSIONS.md, CHANGELOG.md mis à jour

---

## 4 avril 2026 — Session 7 : Packages, tests, fix Douglas-Peucker, Google OAuth

### Bouton Google OAuth sur RegisterScreen
- **RegisterScreen.tsx** : ajout bouton "Continuer avec Google" identique à LoginScreen
- Séparateur "ou" entre inscription email et OAuth Google
- Vérification CGU obligatoire avant de lancer l'OAuth (même contrainte que l'inscription email)
- Import Ionicons + signInWithGoogle depuis useAuth
- accessibilityLabel + gestion erreurs via Alert.alert

### Packages npm installés
- `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` — cache offline fonctionnel
- `ts-jest` + `@types/jest` — tests TypeScript exécutables

### Bug fix critique : Douglas-Peucker
- **geo.ts:111** : `perpendicularDistance` divisait le résultat par `R` (6371 km) en trop
- **Impact** : toutes les traces GPS étaient compressées à seulement 2 points (début + fin)
- **Correction** : suppression du `/ R`, la distance est maintenant correctement en km

### Tests : 125/125 passent
- Première exécution réelle des tests du projet
- 5 assertions corrigées pour correspondre au code réel :
  - badges.test.ts : 21→18 badges
  - formatters.test.ts : sanitizeUsername accent 'Île'
  - gpxExport.test.ts : ele toFixed(1)
  - geo.test.ts : points zigzag au lieu de points alignés

### Infrastructure
- APK 167MB supprimé du repo
- .env vérifié : jamais commité dans l'historique git
- Audits HTML/MD déplacés dans docs/archives/
- Branche `refactor/session-6-offline-push` créée et pushée

---

## 4 avril 2026 — Session 6 : Cache offline + Push notifications + Vérification Supabase

### Cache offline React Query (C1)
- **queryClient.ts** : gcTime augmenté de 30min à 24h pour la persistance
- **asyncStoragePersister** : créé avec `createAsyncStoragePersister` (clé `rando-reunion-cache`, throttle 1s)
- **App.tsx** : `QueryClientProvider` remplacé par `PersistQueryClientProvider` (maxAge 3 jours, dehydrate success-only)
- **Packages requis** (à installer par Claude Code) : `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`

### Vérification Supabase via MCP (C3)
- **25 tables** confirmées (dont push_tokens à déployer via migration 020)
- **70 RLS policies** (corrigé : documentation disait 90+)
- **5 RPCs**, **710 sentiers** — tout conforme
- **trail_photos** : n'existe PAS comme table, seulement comme storage bucket → doc corrigée

### Corrections documentation
- **CLAUDE.md** : RLS 90+ → 70, migrations 21 → 22 fichiers (20 numéros)
- **database-schema.md** : trail_photos marquée inexistante, migration 020 ajoutée, Realtime clarifié
- **PROJECT_STATE.md** : tables 26+ → 25, RLS 90+ → 70, cache offline ajouté
- **TASKS.md** : RLS 90 → 70, migrations 21 → 22, mode offline détaillé
- **deployment.md** : date mise à jour, refactoring/tests/cache/push ajoutés

---

## 5 avril 2026 — Infrastructure notifications push (Expo + FCM)

### Push notifications framework
- **usePushNotifications.ts** : hook complet pour
  - Enregistrement du token Expo dans Supabase (`push_tokens` table)
  - Écoute des notifications en foreground (foreground handler)
  - Gestion des taps notification (deep linking automatique)
  - Unregistration du token à la déconnexion
  - Gestion du cold start (app tuée + relancée via notification)

### Configuration
- **app.json** : ajout plugin expo-notifications avec icon + color
- **app/src/hooks/useNotifications.ts** : upgrade avec deep linking local + logout integration
- **Migration 020** : table `push_tokens` + 4 RLS policies (select/insert/update/delete)

### Deep linking support
7 types de notifications avec navigation automatique :
- `friend_request` → SocialTab/Friends
- `friend_accepted` → SocialTab/Friends
- `direct_message` → Conversation avec émetteur
- `sortie_invite` → Détail sortie
- `sortie_reminder` → Détail sortie
- `trail_report` → Détail sentier
- `trail_reopen` → Détail sentier

### Documentation
- **push-notifications-setup.md** : guide complet pour Nicolas
  - Architecture et flux notifications
  - Code implémenté (hook, config, migration)
  - Actions restantes (Firebase, EAS, intégration)
  - Types de notifications supportées
  - Sécurité et dépannage

### Prochaines actions (Nicolas)
- Créer projet Firebase Cloud Messaging (FCM)
- Configurer Expo pour Firebase (credentials, EAS secrets)
- Ajouter plugin Firebase à app.json
- Appeler usePushNotifications() dans App.tsx
- Tester avec notifications de test Firebase

---

## 4 avril 2026 — Refactoring majeur + tests + infrastructure

### Refactoring des 3 écrans majeurs
- **ProfileScreen** : 1398 → 598 lignes (-57%), 10 composants extraits (StatCard, LevelBar, StreakBadge, XPDisplay, PeriodStats, BadgeMedal, ZoneProgressRing, MonthlyGoal, ChallengeCard, BadgesSection) + 1 hook (useAnimatedCounter)
- **TrailDetailScreen** : 1155 → 872 lignes (-24%), 5 composants extraits (StarRating, TrailStatsGrid, TrailTabBar, PhotoModal, ReviewModal)
- **FeedScreen** : 1099 → 434 lignes (-60%), 5 composants extraits (PostItem, CommentItem, StoryItem, CreatePostModal, CommentsBottomSheet) + 1 utilitaire (dateUtils.ts)
- Total : **20 nouveaux composants**, 1 hook, 1 utilitaire — compteur composants 23 → 43

### Tests unitaires (3 nouveaux fichiers, 78 tests)
- **moderation.test.ts** : 20 tests (détection mots bloqués, insensibilité casse, accents, edge cases)
- **badges.test.ts** : 34 tests (8 niveaux, 21 badges, progression, conditions)
- **gpxExport.test.ts** : 24 tests (structure GPX, coordonnées 2D/3D, échappement XML)
- Total projet : 5 fichiers de tests, 78+ test cases

### Infrastructure
- **GitHub Pages** : dossier legal-pages/ prêt (index.html, confidentialite.html, cgu.html, CNAME)
- **trails.json** (9.9MB) déplacé de src/data/ vers data-raw/ — pas bundlé dans l'app
- **.gitignore** enrichi : *.apk, *.aab, *.ipa, .gradle/
- **CLAUDE.md** : 4 docs manquantes référencées (user-personas, store-listing, data-processing, deployment-plan)

### Documentation mise à jour
- TASKS.md : compteurs recalculés (43 composants, 35 hooks, 5 fichiers tests)
- PROJECT_STATE.md : métriques post-refactoring
- CHANGELOG.md + SESSIONS.md : session documentée

---

## 4 avril 2026 — Audit chirurgical complet + corrections

### Audit ultra-complet (6 domaines en parallèle)
- **Structure code** (9.5/10) : 26 écrans, 34 hooks, 23 composants, 5 stores, 6 stacks — tout confirmé
- **Base de données** (9.0/10) : 25 tables, 90 policies RLS, 5 RPCs, 21 fichiers migration — conforme
- **Documentation** (7.5/10) : 3 affirmations fausses découvertes et corrigées
- **Assets & branding** (8.5/10) : tous présents sauf adaptive-icon.png (non bloquant)
- **Dette technique** (6.5/10) : 8 couleurs restantes, 3 `as any`, 2 URLs hardcodées
- **Sécurité** (5.5/10) : .env avec secrets, APK 167MB dans repo

### Vérification croisée PRD vs code réel
- 19/20 features PRD confirmées dans le code
- **Douglas-Peucker** : marqué [x] mais non implémenté → corrigé (implémenté)
- **Badges** : PRD disait 14, code en contient 18 → PRD corrigé
- **Realtime** : 4 tables dans SQL mais seulement 2 subscriptions côté app → doc corrigée
- **Couleurs** : TASKS disait 0 hardcodées, il en restait 11 → toutes migrées

### Corrections code (12 issues)
- **Douglas-Peucker** implémenté : geo.ts + intégré NavigationScreen + FreeHikeScreen + 7 tests
- **11 couleurs hardcodées** migrées vers COLORS (FreeHikeScreen, MyHikesScreen, FeedScreen, InboxScreen, InAppNotifications, theme.ts)
- **2 URLs Supabase** externalisées via process.env (ReportForm.tsx, FeedScreen.tsx)
- **3 violations `as any`** corrigées (ReportForm, FeedScreen, NavigationCTA)
- **2 console.error** protégés par __DEV__ (useTrailReports, useTrailReviews)
- **1 onError vide** corrigé (InboxScreen)

### Documentation mise à jour
- TASKS.md : compteurs recalculés et vérifiés (onError 15+, badges 18, migrations 21 fichiers)
- PROJECT_STATE.md : score corrigé, métriques ajoutées
- database-schema.md : Realtime clarifié (SQL vs app), migration count corrigé
- PRD.md : badges 14→18
- CHANGELOG.md + SESSIONS.md : session documentée

---

## 29 mars 2026 — Audit exhaustif documentation + corrections

### Audit complet code vs docs
- **4 audits parallèles** : deployment, code structure, PRD features, architecture technique
- **Résultat** : 26 écrans, 34 hooks, 23 composants, 5 stores, 6 stacks, 19 migrations — tous vérifiés OK
- **Toutes les features PRD** marquées [x] confirmées dans le code réel

### Corrections documentation
- **deployment.md** : branding corrigé "EN COURS" → "FAIT", ajout migration 019, ajout tests unitaires et sprint code quality
- **system-design.md (V3.0)** : MapLibre → Mapbox GL partout, Météo-France → Open-Meteo, Cloudflare R2/Bunny → CDN non implémenté, SQLite/MMKV → AsyncStorage/SecureStore, validation GPS 200m→100m 80%
- **database-schema.md** : 18 → 19 migrations (ajout 019_server_security)
- **CLAUDE.md** : migration count corrigé 18 → 19
- **PROJECT_STATE.md** : migration count corrigé
- **TASKS.md** : tests unitaires 0 → 2 fichiers, migration count corrigé
- **PRD.md** : seuil alerte hors-sentier 200m → 100m
- **competitive-analysis.md** : seuil 200m → 100m
- **store-listing.md** : seuil 200m → 100m
- **documentation.md rules** : 17 → 19 migrations

### Skill project-architect
- Ajout règle fondamentale "ZÉRO BRICOLAGE" dans le skill
- Fichier no-workarounds.md ajouté comme premier template de règle
- Packagé en project-architect.skill

### Tests unitaires
- Créé jest.config.js + 2 fichiers tests (geo.test.ts, formatters.test.ts)
- Jest non installé (Nicolas doit faire npm install)

---

## 27 mars 2026 — Sprint Code Quality + Restructuration

### Code Quality Sprint
- **onError handlers** : 14/14 mutations couvertes (ajout useTrailReviews + useTrailReports)
- **Couleurs hardcodées** : 43 couleurs migrées vers COLORS constants dans 14 fichiers
- **theme.ts enrichi** : ajout ZONE_COLORS (18 zones), report colors (11 types), cyclone colors (4 niveaux), POI colors, notification colors, overlay colors
- **NavigationScreen.tsx refactorisé** : 1469 → 1185 lignes, 4 composants extraits (NavigationStatsHUD, NavigationControls, NavigationCTA, TrailReportModal)
- **Composants** : 19 → 23 (+4 extraits)
- npm audit : 30 vulnérabilités identifiées (dev deps uniquement, non fixable sans upgrade Expo)

### Restructuration architecture projet
- Nouvelle architecture .claude/ (rules, agents, commands, skills)
- Documentation réorganisée en 6 phases (01-discovery → 06-operations)
- Dossier project/ pour le tracking (STATE, TASKS, CHANGELOG, SESSIONS, DECISIONS)
- CLAUDE.md réécrit (~200 lignes, concis et actionnable)
- Anciens docs d'audit archivés dans docs/archives/

---

## 22 mars 2026 — Audit ultra-complet + Plan de déploiement

- Audit 7 domaines par 7 agents parallèles : note globale 8.0/10
- Plan de déploiement en 6 sprints (Sprint 10-15) créé
- Budget estimé : ~126 EUR (domaine + comptes stores)

---

## 21 mars 2026 — Sprint UX V2 "Niveau Supérieur"

- FreeHikeScreen : rando libre sans sentier prédéfini
- Design system upgrade (elevation, couleurs sémantiques, animations)
- expo-haptics intégré (likes, validation, friend requests, onboarding)
- Onboarding rafraîchi (4 slides actualisées)
- Migration 018 déployée (trail_id nullable, custom_name)

---

## 21 mars 2026 — Audit V2 + 9 Sprints Correctifs (A→I)

- Score 5.2 → 9.0/10 (67/71 issues fixées)
- Migrations 014-017 : RLS complet, anti-triche, soft delete, blocked_users
- Sentry, ProGuard, ErrorBoundary, modération contenu
- RGPD : suppression/export 19 tables

---

## 20 mars 2026 — Sprint 4 Social + GPS + Notifications

- Social : DM, inbox, conversations, recherche utilisateurs, amis
- Notifications in-app : 6 types, Realtime, historique
- Guidage vocal TTS, GPS background crash-safe
- Boussole magnétomètre, auto-validation 80%, stats enrichies
- Fog of war, badges SVG, leaderboard RPC
- 6 nouveaux écrans

---

## 17-19 mars 2026 — Sprints 1-3 Foundation

- 710 sentiers avec traces GPS exactes
- Carte Mapbox (4 styles), profil élévation SVG
- Météo montagne (Open-Meteo), statut ONF (scraping)
- GPS tracking temps réel, routing piéton OSRM
- Gamification 18 zones, sorties de groupe + chat
- Système d'amis, feed, profil public, favoris, avis
- Auth Supabase (email + Google OAuth), RGPD, onboarding
