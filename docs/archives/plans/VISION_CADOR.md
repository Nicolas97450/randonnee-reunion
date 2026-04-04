# VISION CADOR — Randonnee Reunion
> "L'app que chaque randonneur reunionnais ne peut plus quitter"
> 19 mars 2026

---

## Pourquoi Strava est addictif (et pas nous)

Strava n'est PAS une app GPS. C'est une **machine a dopamine** :
1. Tu ouvres l'app TOUS LES JOURS, meme sans courir
2. Tu vois ce que font tes amis → FOMO
3. Tu bats tes records → dopamine
4. Tu recois des kudos → validation sociale
5. L'app te connait et te pousse → engagement

Notre app est un CATALOGUE. Tu l'ouvres quand tu veux randonner, tu la fermes apres. C'est le probleme fondamental.

---

## Les 7 piliers pour devenir indispensable

### PILIER 1 : "L'app me connait"
**Concept : Recommandations intelligentes**

Quand l'utilisateur ouvre l'app, au lieu d'une carte statique, il voit :

```
┌─────────────────────────────────────────┐
│  Bonjour Nicolas !                       │
│                                          │
│  PARFAIT POUR AUJOURD'HUI               │
│  ┌─────────────────────────────────────┐ │
│  │ Sentier des Tamarins                │ │
│  │ Facile · 2h · 8km · Soleil ☀       │ │
│  │ A 4 km de toi · Tu ne l'as pas     │ │
│  │ encore fait                         │ │
│  │           [Voir le sentier]         │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  PARCE QUE                               │
│  · Meteo ideale (22°C, pas de vent)     │
│  · Adapte a ton niveau                   │
│  · Proche de ta position                 │
│  · Tu n'as pas randonne depuis 5 jours  │
└─────────────────────────────────────────┘
```

**Implementation** :
- Ecran d'accueil personnalise (pas direct la carte)
- Algorithme simple : meteo du jour + position GPS + niveau + sentiers pas encore faits + derniere activite
- "Tu n'as pas randonne depuis X jours" → pression douce

### PILIER 2 : "Je progresse chaque semaine"
**Concept : Dashboard personnel**

```
┌─────────────────────────────────────────┐
│  CETTE SEMAINE                           │
│  2 randos · 18 km · 1 200m D+ · 5h30   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  65% objectif    │
│                                          │
│  CE MOIS                                 │
│  8 randos · 72 km · 4 800m D+           │
│  Record perso : 3 200m D+ en une rando  │
│                                          │
│  PROGRESSION ILE                         │
│  42/710 sentiers (5.9%)                  │
│  [====>                         ] 5.9%   │
│                                          │
│  OBJECTIF : 10 sentiers/mois            │
│  ▓▓▓▓▓▓▓▓░░  8/10 ce mois              │
└─────────────────────────────────────────┘
```

**Implementation** :
- Table `user_activities` avec TOUTES les traces sauvegardees (distance, duree, D+, trace GeoJSON)
- Calculs hebdo/mensuel/annuel
- Objectifs personnels configurables
- Records personnels automatiques

### PILIER 3 : "Mes amis sont la"
**Concept : Feed social vivant**

Le feed actuel est mort (2 posts). Il faut que le feed se REMPLISSE automatiquement :
- Quand quelqu'un termine une rando → post automatique avec carte et stats
- Quand quelqu'un bat un record → celebration automatique
- Quand quelqu'un complete une zone → milestone
- Kudos (likes) avec compteur visible

```
┌─────────────────────────────────────────┐
│ 🏔 Marc a termine une randonnee         │
│ Piton des Neiges · 13.6 km · 2200m D+ │
│ [mini carte avec trace]                 │
│ Duree: 6h45 · Allure: 2.0 km/h        │
│                                          │
│ ♥ 12 kudos  💬 3 commentaires           │
│ [Donner un kudo]                        │
└─────────────────────────────────────────┘
```

**Implementation** :
- Post automatique a chaque validation de sentier (avec trace, stats, carte miniature)
- "Kudos" au lieu de "j'aime" (vocabulaire sportif)
- Commentaires sur les posts
- Notifications quand quelqu'un te donne un kudo

### PILIER 4 : "Je decouvre des challenges"
**Concept : Defis et collections**

Au lieu de juste "710 sentiers a faire", creer des DEFIS thematiques :

```
DEFIS ACTIFS :
┌─────────────────────┐  ┌─────────────────────┐
│ Les 3 Cirques       │  │ Chasseur de         │
│ ████████░░ 7/12     │  │ Cascades            │
│ Mafate ✓            │  │ ████░░░░ 4/15       │
│ Cilaos ✓            │  │                     │
│ Salazie: 5/6        │  │ Prochaine: Cascade  │
│                     │  │ du Bras Rouge       │
│ [Voir les sentiers] │  │ [Voir les sentiers] │
└─────────────────────┘  └─────────────────────┘

DEFIS DISPONIBLES :
- Volcan : 8 sentiers autour du Piton de la Fournaise
- Tour de l'ile : 1 sentier dans chaque region
- Altitude : Tous les sommets > 2000m
- Familial : 10 sentiers faciles < 1h
- Expert : 5 sentiers les plus techniques
- Photo : Poster une photo sur 20 sentiers differents
```

**Implementation** :
- Table `challenges` avec les sentiers requis pour chaque defi
- Progression calculee automatiquement depuis user_activities
- Badges visuels debloques
- Partage sur le feed quand un defi est complete

### PILIER 5 : "Je suis en securite"
**Concept : Partage de position en direct**

```
┌─────────────────────────────────────────┐
│  PARTAGE EN DIRECT                       │
│                                          │
│  Tes proches peuvent suivre ta rando    │
│  en temps reel sur un lien web.         │
│                                          │
│  [Partager ma position]                  │
│  → Genere un lien unique                │
│  → Valable pendant la rando             │
│  → Position + stats en temps reel       │
│  → Pas besoin d'installer l'app         │
│                                          │
│  Contacts d'urgence notifies            │
│  automatiquement si tu ne bouges plus   │
│  pendant 30 min.                         │
└─────────────────────────────────────────┘
```

**Implementation** :
- Supabase Realtime pour partager la position
- Page web publique avec la carte (pas besoin d'app)
- Lien unique genere a chaque rando
- Timer d'inactivite → alerte aux contacts d'urgence

### PILIER 6 : "L'experience est fluide"
**Concept : Carte et navigation sans friction**

Problemes actuels :
- Clusters non cliquables
- Carte trop petite en navigation
- Pas de mode plein ecran
- Navigation confuse (retour, sens)

Solutions :
1. **Carte plein ecran par defaut en navigation** — le header et les stats sont dans un bottom sheet draggable
2. **Clusters fonctionnels** — queryRenderedFeaturesAtPoint
3. **Swipe entre sentiers** — dans la liste, swipe gauche/droite pour passer au sentier suivant/precedent
4. **Mode immersif** — pendant la rando, seule la carte + stats essentielles sont visibles
5. **Haptic feedback** — vibration legere au tap sur un sentier, au like, a la validation

### PILIER 7 : "Je revois mes randos"
**Concept : Historique et replay**

```
MES RANDONNEES
┌─────────────────────────────────────────┐
│  Hier · Sentier du Maido               │
│  [mini carte avec trace en vert]        │
│  12.3 km · 850m D+ · 3h45 · 3.3 km/h  │
│                                          │
│  [Voir le detail]  [Rejouer]  [Partager]│
└─────────────────────────────────────────┘
│  12 mars · Piton des Neiges            │
│  [mini carte avec trace]                │
│  13.6 km · 2200m D+ · 6h45            │
└─────────────────────────────────────────┘
```

Replay 2D anime :
- La trace se dessine progressivement sur la carte
- Un marqueur parcourt le sentier
- Stats en temps reel (altitude, distance, vitesse)
- Slider pour controler la vitesse
- Bouton "Partager" qui fait un screenshot

---

## Ecran d'accueil repense

L'ecran d'accueil actuel = carte avec clusters. L'utilisateur ne sait pas quoi faire.

**Nouvel ecran d'accueil** = feed personnalise :

```
┌─────────────────────────────────────────┐
│  Randonnee Reunion                      │
│                                          │
│  [Suggestion du jour - basee meteo/GPS] │
│                                          │
│  STATS RAPIDES                           │
│  42 sentiers · 320 km · 12 000m D+     │
│                                          │
│  DEFIS EN COURS                          │
│  Les 3 Cirques: 7/12 · Cascades: 4/15  │
│                                          │
│  ACTIVITE AMIS                           │
│  Marc a fait le Piton des Neiges ♥ 12  │
│  Sofia a complete le defi Familial     │
│                                          │
│  [Carte]  [Sentiers]  [Sorties] [Profil]│
└─────────────────────────────────────────┘
```

---

## Ce qu'on fait AUJOURD'HUI

### Bloc 1 : Fix urgents (1h)
1. Clusters fonctionnels (queryRenderedFeaturesAtPoint)
2. Likes fonctionnels (erreur handling + optimistic)
3. Carte plein ecran en navigation (bottom sheet draggable)

### Bloc 2 : Sauvegarde complete des randos (2h)
4. Sauvegarder la trace GPS complete dans user_activities (GeoJSON)
5. Ecran "Mes randonnees" avec historique
6. Post automatique au feed apres validation
7. Export GPX

### Bloc 3 : Dashboard personnel (1h)
8. Stats hebdo/mensuel (distance, D+, temps, nombre de randos)
9. Records personnels
10. Objectif configurable

### Bloc 4 : Defis et collections (1h)
11. 6-8 defis thematiques pre-configures
12. Progression automatique
13. Badges visuels

### Bloc 5 : Recommandation du jour (30min)
14. Algorithme simple : meteo + position + historique
15. Card sur l'ecran d'accueil ou la carte

---

## APIs et outils

| Outil | Pour quoi | Gratuit |
|-------|-----------|---------|
| MapLibre queryRenderedFeaturesAtPoint | Clusters | Oui |
| @turf/along + @turf/length | Replay anime | Oui |
| Open-Meteo forecast | Recommandation du jour | Oui |
| react-native-share | Partage screenshots/GPX | Oui |
| expo-haptics | Retour haptique | Oui |
| Supabase Realtime | Partage position live | Oui |

---

## Ce qui nous differencie de Strava

Strava = course + velo partout dans le monde.
Nous = randonnee 100% La Reunion.

Notre avantage :
- On CONNAIT chaque sentier (710 traces GPS reelles)
- On CONNAIT l'ile (zones, regions, meteo tropicale)
- On peut offrir ce que Strava ne fait pas : defis locaux, statut ONF, SOS PGHM
- La gamification "colorier l'ile" est UNIQUE

On ne copie pas Strava. On prend ce qui marche (progression, social, replay) et on l'adapte a la rando reunionnaise.

---

*Vision ecrite le 19 mars 2026*
