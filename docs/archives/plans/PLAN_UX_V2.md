# PLAN UX V2 — "Niveau Superieur"
> Date : 21 mars 2026
> Objectif : Passer de 7.5/10 en design a 9.5/10
> Prerequis : Audit V2 termine (score 9.0/10), APK stable

---

## Vue d'ensemble

| Sprint | Focus | Duree estimee |
|---|---|---|
| Sprint UX-1 | Feature "Rando Libre" (GPS sans sentier) | ~3-4h |
| Sprint UX-2 | Design System upgrade (typo, ombres, animations) | ~3-4h |
| Sprint UX-3 | Onboarding refait + HomeScreen refresh | ~2-3h |
| Sprint UX-4 | Ecrans principaux — polish UX | ~3-4h |
| Sprint UX-5 | Navigation GPS — polish immersif | ~2-3h |
| Sprint UX-6 | Social & Profil — polish final | ~2-3h |

**Total estime : ~16-20h**

---

## SPRINT UX-1 — Feature "Rando Libre"
> Permettre a l'utilisateur de tracker une marche/rando n'importe ou, sans sentier predefini.

### Concept
L'utilisateur appuie sur un bouton "Demarrer une rando libre" depuis HomeScreen ou MapScreen. Le GPS track sa position, il obtient ses stats (distance, D+, duree, pace), et a la fin il peut sauvegarder sa trace avec un nom personnalise.

### Taches

#### 1.1 Nouveau hook `useFreeHike.ts`
- Reutilise `useGPSTracking` (deja tout le tracking, backup, filtering)
- Pas de sentier de reference (trailId = null)
- Pas d'alerte hors-sentier (pas de referenceTrail)
- Stats identiques (distance, duree, D+, pace)
- A la fin : sauvegarder dans user_activities avec `trail_id = NULL` et `validation_type = 'free'`

#### 1.2 Ecran `FreeHikeScreen.tsx`
- Carte plein ecran avec position GPS
- Trace verte en temps reel
- Stats widget (distance, duree, vitesse, D+)
- Bouton Stop → Resume de la rando
- Pas de progression % (pas de sentier de reference)
- Bouton "Sauvegarder" → nom personnalise + sauvegarde

#### 1.3 Ecran `FreeHikeSummaryScreen.tsx`
- Resume post-rando : stats, carte de la trace, profil elevation
- Input pour nommer sa rando ("Balade du dimanche", "Tour du quartier")
- Bouton sauvegarder → INSERT dans user_activities
- Bouton partager (post dans le feed optionnel)
- Export GPX

#### 1.4 Migration 018 : adapter user_activities pour rando libre
- `trail_id` doit etre NULLABLE (ou deja le cas ?)
- Ajouter colonne `custom_name TEXT` pour nommer les randos libres
- RLS : meme policy que les activites classiques

#### 1.5 Integration dans la navigation
- Bouton "Rando libre" sur HomeScreen (CTA secondaire)
- Bouton "Rando libre" sur MapScreen (FAB ou dans le menu)
- Nouvel ecran dans TrailStack ou SortiesStack
- Liste "Mes randos" (MyHikesScreen) doit afficher les randos libres aussi

#### 1.6 Ecran MyHikesScreen enrichi
- Onglets : "Sentiers valides" / "Randos libres"
- Chaque rando libre affiche : nom, date, distance, duree, mini carte

### Definition of Done
- [ ] L'utilisateur peut demarrer un tracking GPS sans choisir un sentier
- [ ] Les stats se mettent a jour en temps reel
- [ ] A la fin, il peut nommer et sauvegarder sa rando
- [ ] La rando apparait dans MyHikes
- [ ] La trace est exportable en GPX

---

## SPRINT UX-2 — Design System Upgrade
> Passer d'un design "generique" a un design "premium outdoor".

### Taches

#### 2.1 Typographie custom (Inter ou Poppins)
- Installer `expo-font` + charger les fonts
- Definir la hierarchie : Display (28), Title (22), Subtitle (18), Body (15), Caption (13), Overline (11)
- Appliquer partout via un TextStyle helper

#### 2.2 Systeme d'elevation (ombres)
- Definir 4 niveaux : flat, raised (cards), floating (FAB, modals), overlay
- Appliquer sur tous les composants (cards, boutons, bottom sheets)
- Platform-specific : shadowOffset iOS, elevation Android

#### 2.3 Animations standardisees
- Creer `lib/animations.ts` avec configs Reanimated :
  - `SPRING_ENTER` : entree de composant (spring damping 15)
  - `SPRING_PRESS` : feedback appui (scale 0.97)
  - `TIMING_FADE` : fade in/out (300ms ease)
  - `STAGGER_DELAY` : 80ms entre elements de liste
- Appliquer sur les cartes, boutons, transitions

#### 2.4 Haptics
- Installer `expo-haptics`
- Ajouter sur : boutons principaux, likes, validation sentier, toggle, erreur
- Types : light (bouton), medium (action), success (validation), error (vibration)

#### 2.5 Couleurs semantiques
- Ajouter dans theme.ts : interactive, interactive_disabled, overlay, surface_elevated
- Utiliser partout au lieu de couleurs hardcodees

#### 2.6 Skeleton loaders partout
- Remplacer les ActivityIndicator par des Skeleton shapes
- Appliquer sur : feed, trail detail, profil, leaderboard, meteo

### Definition of Done
- [ ] Font custom chargee et appliquee
- [ ] Ombres coherentes sur toutes les cards
- [ ] Animations d'entree sur les listes
- [ ] Haptics sur les interactions principales
- [ ] 0 ActivityIndicator visible (remplace par Skeleton)

---

## SPRINT UX-3 — Onboarding + HomeScreen Refresh
> Premiere impression = retention.

### Taches

#### 3.1 Onboarding redesign
- 4 slides mise a jour avec les nouvelles features :
  1. "Explore La Reunion" — 710 sentiers + carte interactive + rando libre
  2. "Ton GPS de montagne" — tracking, alerte hors-sentier, guidage vocal, boussole
  3. "Defie l'ile" — fog of war, badges, streaks, leaderboard, defis
  4. "Ensemble c'est mieux" — amis, sorties, DMs, feed, partage position
- Animations d'entree par slide (fade + slide up, stagger)
- Illustrations plus visuelles (icones animees ou images)
- Bouton "C'est parti !" sur le dernier slide au lieu de "Commencer"

#### 3.2 HomeScreen refresh
- Hero card plus impactant : meteo + suggestion sentier du jour
- Quick actions : "Rando libre" / "Explorer la carte" / "Mes sentiers"
- Stats animees (compteurs qui montent)
- Section "Defis en cours" plus visible
- Section "Activite amis" plus immersive (avatars, traces)

### Definition of Done
- [ ] Onboarding reflete les features actuelles
- [ ] Animations sur chaque slide
- [ ] HomeScreen a des quick actions claires
- [ ] Transition onboarding → home fluide

---

## SPRINT UX-4 — Ecrans Principaux Polish
> Chaque ecran doit se sentir premium.

### Taches

#### 4.1 MapScreen
- Bouton FAB "Rando libre" en bas a droite
- Animation d'expansion des clusters
- Style toggle avec animation de rotation
- Suggestion cards avec ombre + animation d'entree

#### 4.2 TrailDetailScreen
- Effet parallaxe sur la carte/hero en haut
- Profil elevation avec animation de trace SVG (stroke-dasharray)
- Photos en carrousel swipeable (pas juste horizontal scroll)
- CTA "Demarrer" plus visible (gradient + pulse subtle)

#### 4.3 FeedScreen
- Posts avec animation d'entree (stagger fade)
- Double-tap pour liker (comme Instagram)
- Swipe-to-delete sur ses propres posts
- Pull-to-refresh avec animation custom

#### 4.4 FriendsScreen
- Animation de recherche (expand input)
- Card d'ami avec avatar + mini stats inline
- Accept/refuse avec swipe (gauche = refuser, droite = accepter)

#### 4.5 Etats vides enrichis
- Illustrations pour chaque etat vide (pas juste icone + texte)
- Animations (icon bounce ou pulse)
- CTA visible et attrayant

### Definition of Done
- [ ] Chaque ecran a des animations d'entree
- [ ] Interactions enrichies (double-tap, swipe)
- [ ] Etats vides avec illustrations

---

## SPRINT UX-5 — Navigation GPS Immersive
> L'ecran de navigation est le coeur de l'experience terrain.

### Taches

#### 5.1 HUD (Head-Up Display) redesign
- Stats en bas dans un bandeau semi-transparent (pas un widget opaque)
- Grandes polices pour distance et D+ (lisibilite soleil)
- Bouton stop plus accessible (coin inferieur)

#### 5.2 Feedback en temps reel
- Marqueur GPS anime (pulse doux)
- Distance restante avec countdown
- Notification visuelle a chaque km (toast vert)
- Badge debloque en overlay si completion

#### 5.3 Boussole amelioree
- Fleche directionnelle vers le prochain waypoint
- Indicateur de cap (N/S/E/O)
- Transition douce de rotation (Reanimated)

#### 5.4 Ecran resume post-rando
- Confettis (deja fait)
- Carte de la trace avec animation de dessin
- Stats avec compteurs animes
- Comparaison avec record personnel

### Definition of Done
- [ ] HUD lisible en plein soleil
- [ ] Marqueur GPS anime
- [ ] Boussole fluide
- [ ] Resume immersif

---

## SPRINT UX-6 — Social & Profil Polish
> Le social est le differentateur vs AllTrails.

### Taches

#### 6.1 ProfileScreen
- Header avec image de fond (derniere rando ou avatar large)
- Stats en overlay sur le header
- Badges en grille 3 colonnes avec animation d'apparition
- Bouton "Partager mon profil" (deep link futur)

#### 6.2 Leaderboard
- Top 3 sur podium visuel (or, argent, bronze)
- Animation d'entree des rangs
- Ton rang mis en evidence (highlight)

#### 6.3 InboxScreen / ConversationScreen
- Avatar + timestamp + preview dans la liste
- Indicateur "en ligne" (si live tracking actif)
- Bulles de message avec animation d'apparition

### Definition of Done
- [ ] Profil visuellement riche
- [ ] Leaderboard avec podium
- [ ] Messages fluides

---

## CHECKLIST GLOBALE

A la fin de tous les sprints UX :
- [ ] Feature rando libre fonctionnelle
- [ ] Font custom (Inter/Poppins)
- [ ] Haptics sur toutes les interactions
- [ ] Animations d'entree sur toutes les listes
- [ ] Skeleton loaders partout
- [ ] Onboarding mis a jour
- [ ] 0 ecran "generique" — tout est polished
- [ ] Relancer un audit UX pour scorer

---

## ORDRE D'EXECUTION

```
UX-1 (Rando Libre) → UX-2 (Design System) → UX-3 (Onboarding) → UX-4 (Ecrans) → UX-5 (Navigation) → UX-6 (Social)
```

UX-1 en premier car c'est une **feature** demandee par l'utilisateur.
UX-2 ensuite car le design system impacte TOUS les ecrans suivants.
UX-3 a UX-6 dans l'ordre du parcours utilisateur (onboarding → home → ecrans → navigation → social).
