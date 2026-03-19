# PRD — Randonnée Réunion
**Application mobile de randonnée pour l'île de La Réunion**

> Version 2.2 | 19 mars 2026 | Statut : Sprints 1+2+3 termines, build local fonctionnel, pre-deploiement

---

## Résumé exécutif

**Randonnée Réunion** est une application mobile (iOS & Android) qui centralise toutes les informations necessaires au randonneur sur l'ile de La Reunion : referencement complet des 710 sentiers avec traces GPS reelles, carte interactive MapLibre (Positron + toggle OpenTopoMap), profil d'elevation SVG, meteo montagne enrichie (UV, rafales, visibilite) via Open-Meteo, etat des sentiers via l'ONF, GPS integre avec navigation enrichie et routing pieton OSRM, systeme de gamification vivante (18 zones, validation GPS auto, progression %), fonctionnalites sociales (amis, feed communaute/friends-only, avis/commentaires, favoris, sorties de groupe avec chat temps reel, profil public), galerie photos sentiers, et photo de profil.

---

## 1. Problème

Les randonneurs à La Réunion — qu'ils soient locaux ou touristes — doivent aujourd'hui jongler entre plusieurs sources d'information disparates : le site de l'OMF pour l'état des sentiers, des applications météo génériques, des fichiers GPX épars, des forums et des PDF non interactifs. Il n'existe pas de solution unifiée, moderne et mobile-first qui réponde à l'ensemble de leurs besoins.

Ce manque crée de la friction avant chaque sortie (temps de préparation long, risque d'information incorrecte ou périmée) et prive les randonneurs d'une expérience de progression et de découverte motivante sur le long terme.

---

## 2. Objectifs

- Devenir **la référence numérique** pour la randonnée à La Réunion dans les 12 mois suivant le lancement.
- Atteindre **10 000 téléchargements actifs** dans les 6 premiers mois post-lancement.
- Obtenir une **note moyenne ≥ 4,5/5** sur l'App Store et le Play Store à 3 mois.
- Faire progresser le **taux de conversion freemium → premium à ≥ 8%** à 6 mois.
- Générer un **taux de rétention à J30 ≥ 40%** grâce à la mécanique de gamification.

---

## 3. Non-Objectifs (hors scope V1)

| Hors scope | Raison |
|---|---|
| Moderation contenu communautaire | Avis, photos, posts codes mais moderation automatique non implementee — a adresser avant ouverture publique |
| Randonnées hors de La Réunion | Focus géographique volontaire pour la V1 |
| Guidage audio sur sentier | Coût de production du contenu trop élevé pour le MVP |
| Réservation d'hébergements ou de guides | Hors du périmètre produit core |
| Application web | Priorisation mobile-first, web en V3 si pertinent |

---

## 4. Utilisateurs cibles

### Persona A — Le Réunionnais passionné
> Marc, 34 ans, Saint-Denis. Randonneur régulier, connaît plusieurs sentiers emblématiques mais veut découvrir les moins fréquentés. Motivé par le challenge de "compléter" l'île. Utilise son téléphone Android.

### Persona B — Le touriste aventurier
> Sofia, 28 ans, touriste depuis Lyon pour 2 semaines. Ne connaît pas l'île, cherche des sentiers adaptés à son niveau, a besoin de contexte, de météo et de cartes qui fonctionnent sans réseau.

---

## 5. User Stories

### Découverte & Exploration
- En tant que **randonneur**, je veux **consulter la liste complète des sentiers de La Réunion avec filtres (difficulté, durée, dénivelé, région)** afin de trouver rapidement un sentier adapté à mon niveau et mon temps disponible.
- En tant que **touriste**, je veux **voir les sentiers géolocalisés sur une carte de l'île** afin de planifier mon itinéraire en fonction de ma zone d'hébergement.

### Cartes & Navigation hors-ligne
- En tant que **randonneur**, je veux **télécharger la carte d'un sentier avant ma sortie** afin de pouvoir naviguer sans connexion internet sur le terrain.
- En tant que **randonneur**, je veux **suivre ma position GPS en temps réel sur la carte du sentier** afin de ne pas me perdre même sans réseau.

### Conditions & Météo
- En tant que **randonneur**, je veux **consulter la météo prévue sur le point de départ et d'arrivée du sentier** afin d'évaluer les conditions avant de partir.
- En tant que **randonneur**, je veux **connaître l'état officiel du sentier (ouvert / fermé / dégradé) via l'OMF** afin d'éviter de me rendre sur un sentier inaccessible.

### Gamification & Progression
- En tant que **utilisateur régulier**, je veux **voir une carte de l'île se "colorier" au fur et à mesure que je valide des sentiers** afin d'avoir une représentation visuelle de ma progression et d'être motivé à explorer davantage.
- En tant que **randonneur**, je veux **valider la réalisation d'un sentier (via GPS ou manuellement)** afin de l'enregistrer dans mon historique et débloquer la zone correspondante sur ma carte.

---

## 6. Exigences

### P0 — Must-Have (MVP V1)

**Référencement des sentiers**
- [x] Base de données complète : 710 sentiers scrapes de Randopitons.re avec GPS reels
- [x] Fiche détaillée par sentier : distance, dénivelé, durée estimée, difficulté, point de départ, description (1500-2000 car.)
- [x] Filtres : difficulté, durée, région, type
- [x] Recherche textuelle par nom de sentier

**Cartes & Navigation**
- [x] Carte MapLibre interactive (Positron par defaut + toggle OpenTopoMap avec courbes de niveau)
- [x] Navigation GPS temps reel (position, trace verte, stats altitude + distance vers depart)
- [x] Navigation enrichie : marqueur depart (vert), arrivee (rouge), ligne orange vers depart, badge difficulte
- [x] Routing pieton OSRM (foot profile, itineraire marcheur vers depart)
- [x] Profil d'elevation SVG (Open-Elevation API, sous-echantillonnage 50 points)
- [x] Alerte hors-sentier (200m, vibration, banniere rouge)
- [x] Auto-recentrage carte sur la position utilisateur
- [x] Suggestions sentiers proches sur la carte
- [ ] Telechargement cartes offline .pmtiles — PAS FONCTIONNEL (serveur Linux requis, pas de serveur)

**Securite & Urgence**
- [x] Bouton SOS urgence (appel PGHM, SMS GPS + altitude, numeros urgence)
- [x] Signalements terrain temps reel — "Waze de la rando" (11 types, expiration 48h)

**État des sentiers & Météo**
- [x] Statut ONF dynamique (scraping live onf.fr, cache 1h, matching strict 2+ mots)
- [x] Meteo montagne enrichie via Open-Meteo (UV, rafales, sunrise/sunset, visibilite, alertes contextuelles)
- [x] Badges statut sentier (vert/rouge/orange)

**Gamification**
- [x] Carte interactive de l'île avec 18 zones géographiques
- [x] Validation de sentier (GPS auto quand > 80% parcouru, ou manuel)
- [x] Progression % temps reel pendant la navigation
- [x] Colorisation de la zone (gradient gris → vert)
- [x] Compteur de sentiers réalisés / total
- [x] 14 badges (distance, denivele, regions, social, communaute)

**Social — Sorties de groupe**
- [x] Creer/rejoindre des sorties groupe
- [x] Chat temps reel (Supabase Realtime)
- [x] Gestion participants (accepter/refuser)
- [ ] Notifications push rappel J-1 — hook code mais PAS CONNECTE (pas de serveur push)
- [ ] Integration Strava — hook code mais PAS CONNECTE (pas de compte Strava configure)

**Social — Reseau**
- [x] Systeme d'amis (recherche utilisateurs, envoi demande, accepter/refuser/supprimer)
- [x] Feed communaute (posts libres + partage progression, likes avec liked_by_me)
- [x] Feed friends-only (posts amis uniquement)
- [x] Profil public utilisateur (UserProfileScreen)
- [x] Avis et commentaires sur les sentiers (notes 1-5, migration 005)
- [x] Sentiers favoris (migration 005)
- [x] Galerie photos sentiers (useTrailPhotos)
- [x] Photo de profil (upload Supabase Storage, 2MB max, jpeg/png/webp)

**RGPD & Conformite**
- [x] Suppression de compte + export donnees JSON
- [x] Liens politique de confidentialite + CGU
- [x] Popup disclaimer SOS (avertissement premiere utilisation)
- [x] Checkbox CGU obligatoire a l'inscription
- [x] Documents legaux complets rediges (politique confidentialite + CGU)

**UX & Design**
- [x] Design moderne, dark/light/system mode
- [x] Onboarding 3 écrans
- [x] Support iOS 16+ et Android 10+

**Monetisation**
- [x] Composant PremiumPaywall code (19.99 EUR/an ou 2.99 EUR/mois)
- [ ] RevenueCat — PAS CONFIGURE (package installe mais pas de compte/produits)
- [x] Beta mode ON (tout accessible pendant les tests, paywall non actif)

---

### P1 — Nice-to-Have (V1.5 — Semaines 6-10)

- [x] Systeme de badges et recompenses (14 badges : distance, denivele, regions, social, communaute)
- [x] Integration meteo avancee : UV, rafales, visibilite, sunrise/sunset
- [x] Suggestions de sentiers basees sur la localisation actuelle
- [ ] Export de l'historique en PDF ou partage sur reseaux sociaux
- [x] Mode nuit pour l'interface carte (dark mode + carte Dark Matter)
- [ ] Notifications push : alerte reouverture sentier favori

#### Feature "Sorties" -- Randonnees sociales planifiees

**Description**
Un utilisateur peut créer une "Sortie" en liant un sentier, une date et une heure de départ. Les autres utilisateurs peuvent découvrir les sorties publiques sur un sentier et demander à rejoindre. Un chat de groupe s'ouvre entre les participants pour se coordonner avant, pendant et après la rando.

**User stories**
- En tant que **randonneur**, je veux **créer une Sortie sur un sentier avec date, heure et nombre de places** afin d'organiser une randonnée avec d'autres personnes.
- En tant que **randonneur**, je veux **voir les Sorties prévues sur un sentier** afin de rejoindre un groupe existant plutôt que de partir seul.
- En tant que **participant**, je veux **accéder à un chat de groupe** afin de me coordonner avec les autres (point de rendez-vous, covoiturage, matériel).
- En tant que **organisateur**, je veux **accepter ou refuser les demandes de participation** afin de gérer le niveau et la taille du groupe.
- En tant que **participant**, je veux **partager ma position en live** avec le groupe uniquement pendant la sortie, afin de rester groupé sur le sentier.

**Exigences techniques (P1) — TOUTES CODEES (18/03/2026)**
- [x] Table `sorties` : trail_id, organisateur_id, date, heure_depart, places_max, description, statut
- [x] Table `sortie_participants` : sortie_id, user_id, statut (en_attente/accepte/refuse)
- [x] Table `sortie_messages` : sortie_id, user_id, contenu, created_at
- [x] Chat temps reel via **Supabase Realtime**
- [ ] Notifications push : rappel J-1 — hook code mais pas connecte (pas de serveur push)
- [ ] Partage de position live — pas code
- [ ] Auto-fermeture du chat 24h — pas code

**Règles métier**
- Sortie visible sur la fiche du sentier + dans une section "Sorties à venir" sur l'accueil
- Maximum 20 participants par sortie (limite anti-abus)
- Organisateur peut annuler jusqu'à 2h avant le départ (notification automatique aux participants)
- Validation du sentier automatique pour tous les participants qui ont partagé leur position pendant la sortie

**Modèle freemium**
- Rejoindre une sortie : **gratuit**
- Créer une sortie : **gratuit** (1 sortie active max en gratuit, illimité en premium)
- Chat de groupe : **gratuit pour tous les participants**

---

### P2 — Future Considerations (V3+)

- [x] Contenu communautaire : photos, avis, conditions du jour — CODE (moderation non implementee)
- Guidage vocal sur sentier
- Intégration avec appareils connectés (Garmin, Apple Watch)
- Version web responsive
- Multilangues (EN, DE pour les touristes internationaux)

---

## 7. Modèle Freemium

| Fonctionnalité | Gratuit | Premium |
|---|---|---|
| Consultation des fiches sentiers | ✅ Illimité | ✅ Illimité |
| Cartes hors-ligne | 3 sentiers max | ✅ Illimité |
| GPS temps réel | ✅ | ✅ |
| Météo & état OMF | ✅ | ✅ |
| Gamification / carte de l'île | ✅ | ✅ |
| Historique complet des sorties | 10 dernières | ✅ Illimité |
| Stats avancées (dénivelé cumulé, km/mois) | ❌ | ✅ |
| Export GPX personnel | ❌ | ✅ |

> **Prix suggéré** : 2,99€/mois ou 19,99€/an

---

## 8. Métriques de succès

### Indicateurs avancés (leading)
- Taux d'activation J7 (utilisateur ayant consulté ≥ 3 sentiers ET téléchargé ≥ 1 carte)
- Nombre de sentiers validés par utilisateur actif par mois
- Taux d'ouverture des alertes météo/OMF

### Indicateurs retardés (lagging)
- Téléchargements cumulés à M1, M3, M6
- Rétention J7, J30, J90
- Taux de conversion free → premium à M3 et M6
- Note moyenne stores à M3

---

## 9. Questions ouvertes

| # | Question | Responsable | Priorite | Statut |
|---|---|---|---|---|
| Q1 | ~~L'API ONF est-elle accessible publiquement ?~~ | Business / Legal | ~~Bloquant~~ | RESOLU — scraping live onf.fr (pas d'API officielle) |
| Q2 | ~~Quelle source de donnees pour les fiches sentiers ?~~ | Data / Engineering | ~~Bloquant~~ | RESOLU — 710 sentiers scrapes de Randopitons.re |
| Q3 | ~~Quelle librairie cartographique ?~~ | Engineering | ~~Haute~~ | RESOLU — MapLibre GL Native v10 (fond Positron) |
| Q4 | Cout de stockage pour les tuiles cartographiques offline par utilisateur ? | Engineering | Haute | OUVERT — cartes offline pas encore fonctionnelles |
| Q5 | ~~Validation GPS obligatoire ou declaration manuelle ?~~ | Product / Design | ~~Moyenne~~ | RESOLU — GPS auto + fallback manuel |
| Q6 | Contraintes legales liees aux donnees geographiques (IGN) ? | Legal | Moyenne | OUVERT — donnees Randopitons.re, pas IGN |

---

## 10. Considérations de calendrier

> ⚡ **Note** : Les délais ci-dessous sont calibrés pour un développement assisté par IA (vibe coding). Les cycles sont 3 à 5× plus rapides qu'un développement traditionnel.

### Phase 1 — MVP Core (Semaines 1–3)
- S1 : Setup projet, stack technique, base de données sentiers, schéma BDD
- S2 : Référencement sentiers + filtres + cartes offline + GPS
- S3 : Intégration météo + OMF + gamification de base (carte colorisable)
- **Fin S3 : Version beta fonctionnelle complète**

### Phase 2 — Polish & Lancement (Semaines 4–5)
- UX/UI fine-tuning, dark mode, onboarding
- Beta test avec 20–50 randonneurs locaux
- Corrections bugs critiques, optimisation performance offline
- **Fin S5 : Soumission App Store & Play Store**

### Phase 3 — Monétisation & Croissance (Semaines 6–10)
- Activation modèle freemium (paywall cartes offline > 3)
- Push notifications, partage social, badges
- Analyse métriques J30, itérations UX basées sur feedback
- **S10 : Roadmap V2 définie selon les données réelles**

---

## 11. Stack technique (confirmee)

| Composant | Choix | Detail |
|---|---|---|
| Framework mobile | React Native + Expo SDK 55 | Cross-platform iOS + Android |
| Cartographie | MapLibre GL Native v10 (Positron + toggle OpenTopoMap, clustering) | Open-source |
| Traces sentiers | GeoJSON LineString scrapes de Randopitons.re (710/710) | Supabase + JSON bundle local |
| GPS | Expo Location | Tracking temps reel, alerte hors-sentier |
| API meteo | Open-Meteo (gratuit, UV, rafales, sunrise/sunset, visibilite) | Couvre La Reunion |
| Elevation | Open-Elevation API (profil altitude SVG) | Gratuit |
| Routing | OSRM foot profile (itineraire pieton) | Gratuit |
| Statut ONF | Scraping live onf.fr (cache 1h, matching strict 2+ mots) | Pas d'API officielle |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime + Storage) | Serveurs EU |
| State management | Zustand (5 stores) | authStore, progressStore, themeStore, offlineStore, premiumStore |
| Data fetching | React Query (@tanstack/react-query) | Cache et invalidation |
| Navigation | React Navigation v7 (bottom tabs + native stacks) | 4 onglets |
| Animations | React Native Reanimated + Gesture Handler | Performance native |
| Bottom sheet | @gorhom/bottom-sheet | Fiches sentiers |
| Auth | Supabase Auth (email + Google OAuth) | JWT + SecureStore |
| Storage | Supabase Storage (bucket avatars, 2MB max) | Photos de profil |
| Build | Local Windows (Gradle 8.13, Kotlin 2.0.21, JDK 21) | Quota EAS cloud atteint |

---

*Document redige le 16 mars 2026 — Mis a jour le 19 mars 2026 (Sprints 1+2+3 termines : carte topo, elevation, meteo montagne, avis/favoris, galerie photos, profil public, gamification vivante, OSRM foot, suggestions carte)*
