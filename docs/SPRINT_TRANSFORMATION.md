# Sprint Transformation — 19 mars 2026
> Objectif : Passer de "app qui marche" a "cador de la rando reunionnaise"
> Cout : 0 EUR — tout est gratuit
> Duree estimee : 8-9h

---

## Bloc 0 : Fix urgents (30 min)

### 0.1 Likes fonctionnels
- Fichier : `useFeed.ts` → `useToggleLike`
- Ajouter `onError` dans la mutation
- Optimistic update (coeur change immediatement, revert si erreur)

### 0.2 Bouton retour fiche sentier
- Fichier : `TrailDetailScreen.tsx`
- Custom headerLeft avec `canGoBack()` / `navigate('TrailList')`

### 0.3 Boutons zoom +/- carte
- Fichiers : `BaseMap.tsx` (getZoom), `MapScreen.tsx` (boutons)

---

## Bloc 1 : Design Strava — Refonte NavigationScreen (2h)

### Layout cible (inspire du screenshot Strava)
```
┌─────────────────────────────────────┐
│  <   Randonnee                   ⚙  │  Header 1 ligne
├─────────────────────────────────────┤
│  [Boussole]              [Recentrer]│
│                                     │
│           CARTE 75%                 │
│      (IGN Plan v2 par defaut)       │
│                                     │
│  [Point bleu GPS]                   │
│                                [i]  │
├─────────────────────────────────────┤
│   0          0:00:00           0    │  ENORME
│   KM          TEMPS          KM/H  │  petit
│                                     │
│  [Camera]   [=== DEMARRER ===]      │  CTA geant
└─────────────────────────────────────┘
```

### Pendant la rando
```
│   3.2        1:15:00         2.5   │  ENORME
│   KM          TEMPS          KM/H  │
│  ══════════════════════ 65%        │  Barre progression
│  ~45 min restantes                  │
│  [Camera]   [=== ARRETER ===]  [SOS]│
```

### Principes
- Carte = STAR (75% ecran)
- MOINS c'est PLUS — zero overlay inutile
- Stats lisibles en marchant, en plein soleil
- Bouton impossible a rater

---

## Bloc 2 : Carte IGN + POI (1h)

### 2.1 Fonds de carte
- Fichier : `constants/map.ts`
- Ajouter MAP_STYLE_IGN (Plan v2) et MAP_STYLE_SATELLITE (Orthophotos)
- IGN par defaut, selecteur 3 fonds

### 2.2 POI Overpass sur la carte
- Nouveau hook : `useOverpassPOI.ts`
- Requete Overpass bbox La Reunion : restaurants, abris, sources eau, points de vue
- Cache 24h dans AsyncStorage
- Afficher comme marqueurs avec icones sur la carte

---

## Bloc 3 : Sauvegarde + historique (1h30)

### 3.1 Sauvegarder trace GPS complete
- Fichier : `NavigationScreen.tsx` → handleToggleTracking
- Sauvegarder dans user_activities : trace GeoJSON, distance, duree, D+, date

### 3.2 Ecran "Mes randonnees"
- Nouvel ecran : `MyHikesScreen.tsx`
- Liste des randos avec mini-carte, stats, date
- Navigation depuis ProfileScreen

### 3.3 Post automatique
- Apres validation sentier → creer un post achievement avec carte + stats

### 3.4 Export GPX
- Convertir trace GeoJSON en GPX
- Partager via expo-sharing

---

## Bloc 4 : Ecran fin de rando celebration (1h)

### Nouvel ecran : `HikeSummaryScreen.tsx`
```
     BRAVO !
     [Carte avec trace verte]

     13.6 km · 2200m D+ · 6h45
     Vitesse moy: 2.0 km/h

     Plus rapide que 72% des randonneurs
     Record perso D+ !

     43/710 sentiers (6.1%)
     Defi "3 Cirques" : 8/12

     [Partager]  [Export GPX]  [Accueil]
```

---

## Bloc 5 : Gamification niveau pro (1h30)

### 5.1 Niveaux
- 8 niveaux dans badges.ts
- Titre affiche sur le profil et dans les posts
- Animation Lottie au passage de niveau

### 5.2 Badges La Reunion
- Gardien de Mafate, Volcanologue, Maitre 3 Cirques, etc.
- Detection automatique depuis user_activities

### 5.3 Streaks
- Table user_streaks dans Supabase
- Semaines consecutives avec >= 1 rando
- Flamme sur le profil

### 5.4 XP
- 1 km = 10 XP, 100m D+ = 50 XP, validation = 100 XP
- Calcul automatique, affichage dans le profil

### 5.5 Dashboard perso
- Stats semaine/mois (km, D+, temps, nombre randos)
- Records personnels automatiques
- Objectif configurable

---

## Bloc 6 : Navigation avancee (1h)

### 6.1 Mode nuit auto
- Si heure < sunrise ou > sunset → MAP_STYLE_DARK
- Toggle manuel possible

### 6.2 Alerte cyclonique
- Poll `vigilance.meteofrance.fr` toutes les heures
- Bandeau rouge si dept 974 >= orange

### 6.3 Estimation batterie
- expo-battery → estimation heures restantes
- < 30% → mode eco (tracking 30s)

### 6.4 Carte orientee
- MapLibre Camera heading = GPS heading
- Toggle Nord-up / Heading-up

---

## APIs integrees dans ce sprint

| API | URL | Usage |
|-----|-----|-------|
| IGN Plan v2 | `data.geopf.fr/wmts?...PLANIGNV2...` | Carte topo par defaut |
| IGN Orthophotos | `data.geopf.fr/wmts?...ORTHOIMAGERY...` | Vue satellite |
| Overpass API | `overpass-api.de` | POI (snacks, abris, eau, vues) |
| Meteo-France Vigilance | `vigilance.meteofrance.fr` | Alertes cycloniques |
| expo-battery | package npm | Niveau batterie |
| expo-haptics | package npm | Retour haptique |

---

*Document cree le 19 mars 2026 — pret a deployer l'equipe*
