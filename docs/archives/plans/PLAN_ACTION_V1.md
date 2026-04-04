# PLAN D'ACTION V1 — Rendre l'app operationnelle
> Date : 18 mars 2026
> Objectif : Corriger tous les bugs critiques, enrichir la carte, integrer les features orphelines

---

## Statut — 19 mars 2026

Execution par 4 agents en parallele (18 mars soir), puis session marathon Sprint 1+2+3 (nuit 18-19 mars).

- **Phase 1 (Bugs critiques)** : TERMINEE. Parsing end_point corrige, liked_by_me corrige, variable hoisting ProfileScreen corrige.
- **Phase 2 (Carte/Navigation)** : TERMINEE. NavigationScreen enrichi. lib/geo.ts cree. MapScreen avec toggle topo/Positron. Profil elevation SVG. OSRM foot. Auto-recentrage. Suggestions sentiers.
- **Phase 3 (Social/Feed)** : TERMINEE. staleTime reduit, boutons agrandis, liked_by_me OK. Avis/commentaires, favoris, galerie photos, profil public, feed friends-only ajoutes.
- **Phase 4 (Features orphelines)** : TERMINEE. useOffTrailAlert integre. Gamification vivante (validation GPS auto 80%). Meteo montagne enrichie.
- **Phase 5 (Validation/Build)** : EN ATTENTE. Rebuild APK necessaire pour valider les corrections.

---

## Equipe deploiee

| Role | Mission |
|------|---------|
| **Architecte** | Planification, coherence globale, validation |
| **Agent GPS/Traces** | Auditer les donnees en base, corriger le parsing, fiabiliser les traces |
| **Agent Carte/Navigation** | Enrichir MapScreen + NavigationScreen (marqueurs, distance, couleurs, infos) |
| **Agent Social/Feed** | Corriger les bugs feed, likes, posts, rendre les features accessibles |
| **Agent UI/Integration** | Safe area, features orphelines, coherence navigation |

---

## PHASE 1 — BUGS CRITIQUES (priorite absolue)

### 1.1 Traces GPS corrompues
**Fichiers** : `useSupabaseTrails.ts`, `useTrailTrace.ts`, `scrape-traces.mjs`

**Problemes identifies** :
- `end_point` est toujours egal a `start_point` (ligne 30 de useSupabaseTrails.ts)
- Le scraper peut inverser lat/lng selon le format source
- Aucun feedback si un trace est null ou corrompu
- Les traces peuvent demarrer d'un point central au lieu du vrai depart

**Actions** :
- [x] Auditer les donnees en base : `SELECT slug, gpx_url FROM trails LIMIT 10`
- [x] Verifier l'ordre des coordonnees (lng,lat vs lat,lng) dans gpx_url
- [x] Corriger le parsing de `end_point` dans useSupabaseTrails.ts
- [x] Ajouter un log/feedback quand un trace est null
- [ ] Si les donnees sont corrompues, relancer le scraper avec validation

### 1.2 Feed — liked_by_me jamais calcule
**Fichier** : `useFeed.ts`

**Probleme** : Le hook ne filtre pas les likes par user_id courant. `liked_by_me` est toujours undefined.

**Actions** :
- [x] Recuperer le user_id courant dans useFeed
- [x] Filtrer post_likes par user_id pour calculer liked_by_me
- [x] Verifier que le toggle like/unlike fonctionne visuellement

### 1.3 ProfileScreen — variable hoisting bug
**Fichier** : `ProfileScreen.tsx`

**Probleme** : `completedZones` utilise avant sa definition dans handleShareProgress.

**Actions** :
- [x] Deplacer la declaration de completedZones avant handleShareProgress

### 1.4 Tab bar — chevauchement boutons Android
**Fichier** : `RootTabs.tsx`

**Statut** : Deja corrige (useSafeAreaInsets). A inclure dans le prochain build.

---

## PHASE 2 — ENRICHIR LA CARTE ET LA NAVIGATION

### 2.1 NavigationScreen — marqueurs et infos manquants
**Fichier** : `NavigationScreen.tsx`

**Problemes** :
- Pas de marqueur pour le point de depart du sentier
- Pas de distance utilisateur → point de depart
- Pas de distinction couleur (trajet vers depart vs trace du sentier)
- Stats limitees (distance, duree, points)

**Actions** :
- [x] Ajouter marqueur vert (drapeau) au point de depart du sentier
- [x] Ajouter marqueur rouge au point d'arrivee
- [x] Calculer et afficher la distance utilisateur → depart (haversine)
- [x] Ligne orange : utilisateur → depart du sentier
- [x] Ligne bleue : trace du sentier
- [x] Ligne verte : trace GPS de l'utilisateur
- [x] Ajouter badge difficulte sur l'ecran de navigation
- [x] Ajouter altitude courante dans les stats
- [ ] Ajouter vitesse moyenne (reporte)

### 2.2 MapScreen — carte plus riche
**Fichier** : `MapScreen.tsx`, `BaseMap.tsx`, `TrailMarkers.tsx`

**Problemes** :
- Carte Positron trop simple pour la randonnee
- Pas assez d'infos au premier coup d'oeil
- Clusters sans indication de difficulte

**Actions** :
- [x] Evaluer des tiles outdoor — OpenTopoMap integre avec toggle topo/Positron
- [ ] Ajouter legende des couleurs de difficulte sur la carte
- [ ] Ameliorer les clusters (couleur dominante par difficulte)
- [ ] Afficher le nom du sentier au tap sur un marqueur

### 2.3 Fonction utilitaire de distance
**Fichier** : nouveau `lib/geo.ts`

**Actions** :
- [x] Implementer haversine distance (2 coordonnees → km)
- [x] Implementer bearing (direction vers un point)
- [x] Utiliser dans NavigationScreen et TrailDetailScreen

---

## PHASE 3 — FEATURES SOCIALES ACCESSIBLES

### 3.1 Feed plus visible
**Probleme** : Le feed est cache derriere un bouton dans ProfileScreen, pas evident a trouver.

**Actions** :
- [ ] Evaluer : ajouter un 5e onglet "Communaute" dans RootTabs, OU
- [x] Rendre les boutons Feed/Amis plus visibles dans ProfileScreen
- [x] Decision : garder 4 onglets (pas surcharger) mais rendre les boutons plus gros/visibles

### 3.2 Nouveaux posts qui n'apparaissent pas
**Probleme** : Cache staleTime de 2 min + invalidation potentiellement manquee.

**Actions** :
- [x] Reduire staleTime du feed a 30 secondes
- [x] Forcer refetch apres creation d'un post
- [x] Ajouter pull-to-refresh visuel (deja present mais verifier)

### 3.3 Partage de progression
**Probleme** : Le bouton "Partager" utilise completedZones avant sa definition.

**Actions** :
- [x] Fix variable hoisting (Phase 1)
- [ ] Ameliorer le contenu du post partage (ajouter emoji, stats plus detaillees)

---

## PHASE 4 — INTEGRATION DES FEATURES ORPHELINES

### 4.1 Features codees mais non connectees

| Feature | Hook/Composant | Action |
|---------|---------------|--------|
| Notifications | useNotifications.ts | Connecter pour rappels de sortie |
| Alerte hors-sentier | useOffTrailAlert.ts | Integrer dans NavigationScreen |
| Export Strava | useStravaExport.ts | Evaluer si pertinent pour V1 |
| Premium Paywall | PremiumPaywall.tsx | Reporter a V2 (pas prioritaire) |
| Offline Banner | OfflineBanner.tsx | Deja dans App.tsx, verifier visibilite |

**Decisions** :
- [x] Integrer useOffTrailAlert dans NavigationScreen (securite)
- [ ] Integrer useNotifications pour rappels de sorties
- [x] Reporter Strava et Premium a V2
- [ ] Nettoyer le code mort (ou le commenter proprement)

---

## PHASE 5 — VALIDATION ET BUILD

- [ ] Tester toutes les corrections
- [ ] Rebuild APK release
- [ ] Test sur telephone Android reel
- [x] Documenter les changements dans AVANCEMENT.md

---

## Criteres de succes

1. Les traces GPS correspondent aux vrais sentiers de La Reunion
2. La carte de navigation montre : position, depart, arrivee, distance, trace colore
3. Le feed affiche les nouveaux posts immediatement
4. Les likes s'affichent correctement (coeur rouge/gris)
5. Les boutons de nav Android ne chevauchent plus la tab bar
6. L'alerte hors-sentier fonctionne en navigation
7. L'app est coherente : toutes les features codees sont accessibles
