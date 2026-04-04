# Sprint Planning — Randonnée Réunion
**Phase 1 MVP | Vibe Coding IA | Mars 2026**

---

## Contexte & Hypothèses

> Ce sprint planning est calibré pour du **vibe coding assisté par IA (Claude Code)**.
> Un développeur solo + IA peut traiter en 1 semaine ce qu'une équipe de 2 devs ferait en 3-4 semaines.
> Chaque tâche est formulée comme un **prompt actionnable** pour Claude Code.

**Stack cible :** React Native + Expo | Supabase + PostGIS | MapLibre GL | TypeScript

**Conventions :**
- 🔴 Bloquant — doit être fini avant la tâche suivante
- 🟠 Priorité haute
- 🟡 Peut être parallélisé
- ✅ Terminé

---

## Sprint 1 — Fondations (Jours 1–5)

**Objectif :** Avoir un projet qui tourne, une BDD avec des sentiers et une auth fonctionnelle.

### Jour 1 — Setup & Infrastructure

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S1-01 | Init projet Expo + TypeScript | `"Crée un nouveau projet Expo avec TypeScript, ESLint, Prettier, dossiers src/screens src/components src/hooks src/lib"` | 🔴 |
| S1-02 | Setup Supabase + schéma BDD | `"Génère le script SQL Supabase complet avec PostGIS pour les tables : trails, trail_conditions, user_profiles, user_activities, map_zones, trail_zones. Inclure les index spatiaux et les Row Level Security policies."` | 🔴 |
| S1-03 | Variables d'environnement | `"Configure les variables d'environnement Expo pour Supabase URL, anon key, et les clés API météo. Crée un fichier .env.example."` | 🟠 |
| S1-04 | Navigation (React Navigation) | `"Setup React Navigation v6 avec un Bottom Tab Navigator (Carte, Sentiers, Profil) et un Stack Navigator pour la fiche sentier."` | 🟠 |

### Jour 2 — Auth & Profil utilisateur

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S1-05 | Écrans Login / Register | `"Crée les écrans Login et Register avec Supabase Auth. Email/password + OAuth Google. Utilise React Hook Form pour la validation. Design épuré, fond sombre."` | 🔴 |
| S1-06 | Persistence session | `"Gère la persistence de la session Supabase avec SecureStore Expo. Redirect automatique vers Home si déjà connecté."` | 🔴 |
| S1-07 | Hook useAuth | `"Crée un hook useAuth qui expose : user, session, signIn, signUp, signOut, isLoading. Utilise Zustand pour le state global."` | 🟠 |

### Jours 3–4 — Import données sentiers

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S1-08 | Script import sentiers | `"Écris un script Node.js qui importe les données des sentiers (nom, distance, dénivelé, difficulté, région, description, coordonnées GPS départ) et les insère dans la table trails Supabase via l'API REST."` | 🔴 |
| S1-09 | Seed data 20 sentiers pilotes | `"Génère un fichier seed.sql avec 20 sentiers représentatifs de La Réunion couvrant toutes les régions et difficultés. Inclure les coordonnées GPS réelles."` | 🟠 |
| S1-10 | Validation et normalisation data | `"Crée un script de validation qui vérifie que tous les sentiers ont : coordonnées GPS valides, difficulté dans l'enum, durée estimée plausible (distance/dénivelé). Log les anomalies."` | 🟡 |

### Jour 5 — Écran Liste Sentiers (base)

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S1-11 | Fetch sentiers depuis Supabase | `"Crée un hook useTrails qui fetch les sentiers depuis Supabase avec pagination (20 par page), filtres (difficulté, région, durée max, type), et cache local avec React Query."` | 🔴 |
| S1-12 | Composant TrailCard | `"Crée un composant TrailCard réutilisable affichant : nom, distance, dénivelé, durée, difficulté (badge coloré), région. Design card moderne avec ombre légère, fond dark."` | 🟠 |
| S1-13 | Écran liste avec filtres | `"Crée l'écran TrailListScreen avec FlatList virtualisée, barre de recherche, bottom sheet de filtres (difficulté, durée, région, type). Animation smooth d'ouverture du bottom sheet."` | 🟠 |

**Livrable Sprint 1 :** App qui boot, auth fonctionnelle, liste de sentiers affichée depuis Supabase.

---

## Sprint 2 — Cartes & GPS (Jours 6–10)

**Objectif :** Cartes offline téléchargeables et navigation GPS temps réel fonctionnelle.

### Jour 6 — Setup MapLibre

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S2-01 | Intégration MapLibre GL Native | `"Installe et configure @maplibre/maplibre-react-native. Crée un composant BaseMap qui affiche la carte de La Réunion centrée sur l'île. Style sombre personnalisé."` | 🔴 |
| S2-02 | Affichage sentiers sur carte | `"Ajoute une couche LineLayer sur la carte qui affiche tous les sentiers sous forme de lignes colorées selon la difficulté (vert/orange/rouge). Clusters pour les points de départ."` | 🟠 |
| S2-03 | Écran carte principale | `"Crée l'écran MapScreen avec la carte plein écran, un bouton de recentrage GPS, et une bottom sheet qui slide up quand on tape sur un sentier pour afficher TrailCard."` | 🟠 |

### Jours 7–8 — Téléchargement offline

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S2-04 | Génération fichiers .pmtiles | `"Écris un script bash qui : (1) télécharge les tuiles OSM via Overpass API pour le bbox de chaque sentier, (2) utilise tippecanoe pour générer les tuiles vectorielles, (3) convertit en .pmtiles avec pmtiles CLI, (4) upload sur Cloudflare R2."` | 🔴 |
| S2-05 | URL signées Supabase Storage | `"Crée une Edge Function Supabase qui vérifie les droits premium (≤ 3 sentiers gratuits), puis retourne une URL signée de 15 minutes pour télécharger le .pmtiles du sentier demandé."` | 🔴 |
| S2-06 | Téléchargement in-app | `"Crée un hook useOfflineMap(trailId) qui : récupère l'URL signée, télécharge le .pmtiles avec expo-file-system (avec progress callback), stocke le chemin local dans SQLite (expo-sqlite)."` | 🔴 |
| S2-07 | Indicateur de progression download | `"Crée un composant DownloadButton qui affiche : 'Télécharger (X Mo)' → progress bar animée → 'Carte disponible offline ✓'. Gère les erreurs réseau avec retry."` | 🟠 |

### Jours 9–10 — GPS Navigation

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S2-08 | Position GPS temps réel | `"Crée un hook useGPSTracking qui utilise expo-location pour suivre la position toutes les 5 secondes en foreground. Stocke les points dans un buffer mémoire + flush vers expo-sqlite toutes les 100 points."` | 🔴 |
| S2-09 | Mode navigation sur carte offline | `"Crée l'écran NavigationScreen qui charge la carte offline du sentier depuis le fichier local .pmtiles, affiche la trace GPX de référence, et le point GPS de l'utilisateur mis à jour en temps réel."` | 🔴 |
| S2-10 | Alerte hors-sentier | `"Implémente une alerte vibration + notification quand la position GPS s'écarte de plus de 200m de la trace GPX de référence."` | 🟡 |

**Livrable Sprint 2 :** On peut télécharger la carte d'un sentier et se géolocaliser dessus sans réseau.

---

## Sprint 3 — Données Live & Gamification (Jours 11–15)

**Objectif :** Météo + état OMF intégrés. Carte de l'île gamifiée fonctionnelle.

### Jours 11–12 — APIs externes

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S3-01 | Edge Function météo | `"Crée une Edge Function Supabase /weather?lat=X&lng=Y qui proxy l'API Météo-France, retourne température min/max, précipitations, icône météo pour J et J+2. Cache KV 30 minutes."` | 🔴 |
| S3-02 | Composant météo sur fiche sentier | `"Crée un composant WeatherWidget qui affiche sur la fiche sentier : icône météo, température, probabilité pluie pour aujourd'hui et demain. Chargement skeleton pendant le fetch."` | 🟠 |
| S3-03 | Edge Function état OMF | `"Crée une Edge Function Supabase /trail-status?trailId=X qui scrape l'état du sentier depuis sentiers.reunion.fr, parse le HTML, retourne {status: 'ouvert'|'ferme'|'degrade', message, updatedAt}. Cache 1 heure."` | 🔴 |
| S3-04 | Badge statut sentier | `"Crée un composant TrailStatusBadge qui affiche un badge coloré (vert/rouge/orange) avec l'état OMF sur la fiche sentier et sur la TrailCard. Affiche un warning si le sentier est fermé."` | 🟠 |

### Jours 13–15 — Gamification

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S3-05 | Zones géographiques GeoJSON | `"Génère un fichier GeoJSON avec les 18 zones géographiques de La Réunion (cirques, massifs, zones côtières) avec polygones précis. Insère dans la table map_zones Supabase."` | 🔴 |
| S3-06 | Carte gamifiée | `"Crée le composant IslandProgressMap basé sur MapLibre qui : affiche les zones en gris (#D1D5DB) par défaut, colorie en vert avec gradient selon le % de complétion de chaque zone, animation smooth de colorisation."` | 🔴 |
| S3-07 | Validation de sentier | `"Crée la logique de validation : (1) GPS auto : compare trace enregistrée avec GPX référence (algo Hausdorff, seuil 200m, couverture ≥ 70%), (2) fallback : bouton 'Valider manuellement'. Insère dans user_activities."` | 🔴 |
| S3-08 | Calcul zones débloquées | `"Crée une Edge Function ou fonction Supabase qui, après validation d'un sentier, calcule les zones dont le % de complétion a changé et retourne la nouvelle carte de progression de l'utilisateur."` | 🟠 |
| S3-09 | Écran profil + progression | `"Crée l'écran ProfileScreen avec : IslandProgressMap, compteur sentiers réalisés / total, historique des 10 dernières sorties, stats (km total, dénivelé cumulé)."` | 🟠 |

**Livrable Sprint 3 :** L'app est fonctionnellement complète. Météo, OMF, gamification opérationnels.

---

## Sprint 4 — Polish UX (Jours 16–20)

**Objectif :** App belle, fluide, et prête pour la beta.

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S4-01 | Écrans onboarding | `"Crée 3 écrans d'onboarding animés : (1) 'Explore La Réunion' avec carte de l'île, (2) 'Navigue hors réseau' avec icône carte offline, (3) 'Colorie ton île' avec animation de colorisation. Skip disponible."` | 🟠 |
| S4-02 | Dark / Light mode | `"Implémente un ThemeProvider avec dark mode et light mode. L'app suit le mode système par défaut. Toggle manuel dans les paramètres. Toutes les couleurs via tokens de thème."` | 🟠 |
| S4-03 | Fiche sentier complète | `"Améliore l'écran TrailDetailScreen : galerie photos (placeholders pour V2), onglets Info / Carte / Météo, bouton 'Commencer la rando' proéminent, partage du sentier."` | 🟠 |
| S4-04 | Animations & micro-interactions | `"Ajoute des animations Reanimated 3 sur : ouverture de fiche sentier (slide up), validation de sentier (confetti + flash de colorisation sur la carte), download complété (checkmark animé)."` | 🟡 |
| S4-05 | Gestion offline & erreurs | `"Crée un composant OfflineBanner qui s'affiche quand l'app est hors réseau. Adapte les écrans pour afficher uniquement les données disponibles localement (sentiers téléchargés, historique)."` | 🟠 |
| S4-06 | Optimisation performance | `"Profile l'app avec Flipper. Optimise : lazy loading des images, mémoïsation des composants lourds (carte, liste), réduction des re-renders Zustand."` | 🟡 |

**Livrable Sprint 4 :** App visuellement soignée, animée, performante.

---

## Sprint 5 — Beta & Lancement (Jours 21–25)

**Objectif :** Valider avec de vrais utilisateurs et soumettre aux stores.

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S5-01 | Build TestFlight (iOS) | `"Configure eas build pour iOS en mode preview. Génère le profil de provisioning et soumets le build sur TestFlight."` | 🔴 |
| S5-02 | Build Firebase App Distribution (Android) | `"Configure eas build pour Android en mode preview. Distribue via Firebase App Distribution avec liste d'emails beta testeurs."` | 🔴 |
| S5-03 | Analytics (PostHog) | `"Intègre PostHog pour tracker : ouvertures app, sentiers consultés, cartes téléchargées, sentiers validés, écrans de conversion freemium. Respect RGPD : opt-in au premier lancement."` | 🟠 |
| S5-04 | Corrections beta J1–J3 | Selon remontées beta | Variable | 🔴 |
| S5-05 | Screenshots stores | `"Génère les screenshots App Store et Play Store (6 formats iOS + 3 formats Android) en simulateur avec les plus belles vues de l'app."` | 🟠 |
| S5-06 | Description stores | `"Rédige la description App Store et Play Store en français, optimisée ASO, avec les keywords : randonnée réunion, sentiers réunion, carte offline randonnée, GPS randonnée."` | 🟠 |
| S5-07 | **Soumission App Store + Play Store** | Lancement officiel | 🔴 |

**Livrable Sprint 5 :** 🚀 App en ligne sur les deux stores.

---

## Récapitulatif

```
Jour  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
S1    [████████████████████]
      Setup  Auth  Data  Liste

S2                        [████████████████████]
                          MapLibre  Offline  GPS

S3                                             [████████████████]
                                               Météo  OMF  Gamif

S4                                                          [████████████]
                                                            Polish  Anim

S5                                                                       [███████]
                                                                         Beta  🚀
```

---

## Sprint 6 — Feature Sorties (Jours 31–38)

**Objectif :** Permettre aux randonneurs de créer des sorties groupées avec chat et position partagée.

> Ce sprint démarre après le lancement store (fin S5) et les premières semaines de traction.

### Jours 31–32 — Modèle de données & Backend

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S6-01 | Migration BDD Sorties | `"Ajoute les tables Supabase : sorties (id, trail_id, organisateur_id, date, heure_depart, places_max, description, statut), sortie_participants (sortie_id, user_id, statut enum: en_attente/accepte/refuse), sortie_messages (sortie_id, user_id, contenu, created_at). Ajoute les RLS policies : seuls les participants acceptés peuvent lire les messages."` | 🔴 |
| S6-02 | API Sorties | `"Crée les hooks Supabase : useCreateSortie, useJoinSortie, useSortieParcipants, useSortiesByTrail. Inclure la logique de limite (1 sortie active max en gratuit, illimité premium)."` | 🔴 |
| S6-03 | Notifications participation | `"Crée une Edge Function Supabase qui trigger sur insert dans sortie_participants : envoie une push notification Expo à l'organisateur ('Nouvelle demande de [username]') et au participant lors de l'acceptation/refus."` | 🟠 |

### Jours 33–34 — UI Création & Découverte

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S6-04 | Écran création de Sortie | `"Crée l'écran CreateSortieScreen : sélection du sentier (pré-rempli si on vient de la fiche), date picker, heure de départ, nombre de places (slider 2-20), description optionnelle, toggle public/sur invitation. Design cohérent avec le reste de l'app."` | 🔴 |
| S6-05 | Section Sorties sur fiche sentier | `"Ajoute une section 'Sorties à venir' sur TrailDetailScreen qui liste les prochaines sorties sur ce sentier avec : date, organisateur (avatar + username), places restantes, bouton 'Rejoindre'. Maximum 3 affichées, voir tout."` | 🔴 |
| S6-06 | Écran gestion de Sortie (organisateur) | `"Crée l'écran ManageSortieScreen pour l'organisateur : liste des demandes en attente avec Accepter/Refuser, liste des participants acceptés, bouton Annuler la sortie avec confirmation et notification automatique."` | 🟠 |

### Jours 35–36 — Chat temps réel

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S6-07 | Chat Supabase Realtime | `"Crée le composant SortieChat qui utilise Supabase Realtime pour écouter les nouveaux messages en temps réel sur la table sortie_messages. Affiche les messages avec avatar, username, heure. Input en bas avec envoi sur 'Enter' ou bouton. Scroll automatique vers le bas."` | 🔴 |
| S6-08 | Écran Sortie (participants) | `"Crée l'écran SortieDetailScreen : header avec sentier + date + météo du jour, liste des participants avec avatars, onglet Chat (SortieChat), onglet Carte (positions live si sortie active). Accessible uniquement aux participants acceptés."` | 🔴 |
| S6-09 | Position live dans une Sortie | `"Pendant une sortie active (date = aujourd'hui, statut = accepté), ajoute un toggle 'Partager ma position avec le groupe'. Si activé, publie la position GPS en temps réel via Supabase Realtime. Les autres participants voient les avatars des membres sur la carte du sentier."` | 🟡 |

### Jours 37–38 — Polish & Intégration

| ID | Tâche | Prompt Claude Code | Priorité |
|---|---|---|---|
| S6-10 | Section Mes Sorties sur profil | `"Ajoute un onglet 'Sorties' sur ProfileScreen : sorties à venir (organisées ou rejointes), historique des sorties passées. Chaque sortie affiche le sentier, la date, le nb de participants."` | 🟠 |
| S6-11 | Notification rappel J-1 | `"Crée une tâche cron Supabase (pg_cron) qui tourne chaque soir à 20h : envoie une push notification Expo à tous les participants d'une sortie prévue le lendemain : 'Rappel : Randonnée [nom sentier] demain à [heure] — [météo du jour]'."` | 🟠 |
| S6-12 | Validation collective post-sortie | `"Après la date d'une sortie passée, propose à chaque participant de valider le sentier en 1 tap (si position partagée pendant la sortie, validation auto). Ferme le chat 24h après la sortie."` | 🟡 |

**Livrable Sprint 6 :** Les randonneurs peuvent se retrouver, se coordonner et randonner ensemble via l'app.

---

## Vue synthétique mise à jour

```
Jour  1────5  6────10  11────15  16────20  21────25  26────30  31────38
      [S1   ] [S2    ] [S3     ] [S4     ] [S5     ] [NEXT S6] [Sorties]
      Fondations Cartes Live+Gamif Polish   Beta 🚀   Freemium  Social 🤝
```

---

## Règles de vibe coding pour ce projet

1. **Un prompt = une feature complète** — ne pas demander des morceaux, demander le composant entier fonctionnel
2. **Toujours préciser le contexte stack** au début du prompt (Expo, Supabase, MapLibre, TypeScript)
3. **Commits atomiques** après chaque tâche validée — un seul sujet par commit
4. **Tests manuels sur device réel** après chaque sprint (pas seulement simulateur pour le GPS)
5. **Garder un fichier `PROMPTS.md`** qui log les prompts Claude Code qui ont bien fonctionné — capitaliser
6. **Ne pas over-engineer** — si une feature marche à 80%, passer à la suivante et itérer après les retours beta

---

*Sprint Planning cree le 17 mars 2026 | Tous les sprints (S1-S6) codes les 17-18 mars 2026 | Build V2 f174732b termine*
