# UX Vision Profonde — L'experience sentier parfaite
> "Chaque ecran, chaque interaction, chaque seconde doit apporter de la valeur"
> 19 mars 2026

---

## Le probleme fondamental

Notre app montre une carte avec 710 points et dit "debrouille-toi".
AllTrails/Strava prennent l'utilisateur par la main et le guident a CHAQUE etape.

L'experience doit etre pensee en 5 phases :
1. Je m'inspire (qu'est-ce que je fais aujourd'hui ?)
2. Je prepare (est-ce que c'est pour moi ? est-ce prudent ?)
3. J'y vais (comment j'arrive au depart ?)
4. Je randonne (suis-je sur le bon chemin ? combien il reste ?)
5. Je savoure (c'etait bien ? je partage, je progresse)

---

## PHASE 1 : "Je m'inspire"

### Ecran d'accueil actuel
Carte avec 710 clusters. L'utilisateur ne sait pas quoi faire. Pas de contexte, pas de guidance.

### Ecran d'accueil repense

**Scenario 1 : Premier lancement (Sofia la touriste)**
```
Bienvenue a La Reunion !

Tu es a [Saint-Denis/Le Tampon/...] ?
Combien de temps tu as aujourd'hui ?
  [ < 1h ]  [ 2-3h ]  [ Journee ]

Ton niveau ?
  [ Debutant ]  [ Intermediaire ]  [ Confirme ]

→ Voila 3 sentiers parfaits pour toi :
  [Card sentier 1 avec photo, meteo, distance]
  [Card sentier 2]
  [Card sentier 3]
```

**Scenario 2 : Utilisateur regulier (Marc le Reunionnais)**
```
Salut Marc ! 👊

AUJOURD'HUI (basé meteo + position)
┌─────────────────────────────────┐
│ Sentier de la Roche Merveilleuse│
│ Cilaos · Facile · 1h30          │
│ Soleil, 22°C, vent faible       │
│ Tu ne l'as pas encore fait      │
│ A 12 km de toi                  │
└─────────────────────────────────┘

TA SEMAINE
  1 rando · 8 km · 450m D+
  Objectif : 3 randos (1/3)

DEFI EN COURS
  Les 3 Cirques : 7/12 sentiers
  Prochain : Sentier de l'Ilet a Cordes

ACTIVITE AMIS
  Sofia a fait le Piton de la Fournaise
  → 8 kudos
```

### Ce que ca implique techniquement
- Un ecran `HomeScreen` qui remplace ou precede `MapScreen`
- Quiz rapide au premier lancement (stocke dans AsyncStorage)
- Algorithme de recommandation : meteo jour J + position + sentiers non faits + derniere activite
- Le tab "Carte" reste, mais l'accueil n'est plus la carte

---

## PHASE 2 : "Je prepare"

### Fiche sentier actuelle
Carte miniature + description + meteo + stats. C'est correct mais passif.

### Fiche sentier repensee

**Ce qui manque cruellement :**

1. **Photos reelles du sentier** (pas juste des photos utilisateurs — des photos geolocalisees le long du parcours)
2. **Points d'interet** sur le trace : points de vue, cascades, abris, sources d'eau, croisements
3. **Profil d'elevation INTERACTIF** : quand tu touches un point du profil, la carte zoom sur cet endroit
4. **Estimation personnalisee** : "Pour toi, ce sentier prendra environ 5h15" (basee sur ta vitesse moyenne)
5. **Conditions recentes** : "Derniere rando il y a 2 jours par Marc : boueux apres le km 3"
6. **Checklist depart** : "N'oublie pas : 2L d'eau, creme solaire (UV 9), lampe frontale (coucher 18h15)"
7. **Difficulte contextuelle** : "Ce sentier est plus difficile apres la pluie" (si pluie prevue)

### Le profil d'elevation interactif

C'est LE game-changer de la fiche sentier :

```
Altitude (m)
  2800 |          /\
  2400 |         /  \
  2000 |        /    \      /\
  1600 |   /\  /      \    /  \
  1200 |  /  \/        \  /    \
   800 | /              \/      \
   400 |/                        \
       +--+--+--+--+--+--+--+--+-→ Distance (km)
       0  2  4  6  8  10 12 14

[Point touche : km 8 — 2800m — "Sommet Piton des Neiges"]
[La carte zoom sur ce point]
```

**Implementation** :
- `react-native-svg` pour le graphique interactif
- `PanGestureHandler` pour detecter le toucher
- Quand l'utilisateur glisse le doigt sur le profil, la carte centre sur le point correspondant
- Points d'interet marques sur le profil (icones)

---

## PHASE 3 : "J'y vais"

### Actuel
Route OSRM en orange vers le point de depart. C'est bien mais basique.

### Ameliore

1. **Temps de trajet en voiture** : "35 min en voiture depuis ta position"
2. **Info parking** : "Parking au bout de la route forestiere — 15 places" (a renseigner manuellement pour les sentiers populaires)
3. **Covoiturage interne** : "2 personnes vont au meme sentier aujourd'hui" (via les sorties)
4. **Alerte meteo changement** : "Attention, la meteo a change depuis hier — pluie prevue a 14h"
5. **Heure de depart recommandee** : "Depart recommande avant 7h pour finir avant la chaleur" (calculee avec la duree + coucher du soleil)

---

## PHASE 4 : "Je randonne" — LE GROS CHANTIER

### Actuel
Carte avec trace bleu + position GPS + stats en bas. Le header prend de la place. La carte est petite.

### Le mode rando PARFAIT

#### Layout
```
┌─────────────────────────────────────────┐
│                                          │
│                                          │
│              CARTE PLEIN ECRAN           │
│         (orientee sens de marche)        │
│                                          │
│    [Ma position = point bleu]            │
│    [Trace devant moi = bleu]             │
│    [Trace derriere moi = vert]           │
│    [Points d'interet = icones]           │
│                                          │
│                                          │
│  [Recentrer]                  [Compass]  │
│                                          │
├─────────────────────────────────────────┤
│ ▔▔▔▔▔▔▔▔▔▔▔ (drag handle) ▔▔▔▔▔▔▔▔▔▔▔ │
│                                          │
│  ══════════════════════ 65%              │
│  3.2 km parcourus · 5.1 km restants     │
│  ~1h45 restantes · Altitude: 1820m      │
│                                          │
│  [PROFIL ELEVATION MINI]                 │
│   ▲ ici                                  │
│                                          │
│  Prochain point : Vue sur Mafate (800m) │
│                                          │
│  [Arreter]  [SOS]  [Signaler]  [Photo]  │
└─────────────────────────────────────────┘
```

#### Principes cles

1. **Carte PLEIN ECRAN par defaut**
   - Le header est transparent ou masque
   - Les stats sont dans un bottom sheet qu'on peut tirer vers le haut
   - La carte prend 70-80% de l'ecran minimum

2. **Carte orientee dans le sens de la marche**
   - La carte TOURNE avec le GPS heading
   - Le sentier devant toi est TOUJOURS vers le haut
   - Bouton boussole pour revenir en mode nord-up

3. **Trace bicolore**
   - Ce que tu as deja fait = VERT (derriere toi)
   - Ce qu'il te reste = BLEU (devant toi)
   - Ta position = point bleu pulse avec direction

4. **Bottom sheet draggable**
   - Position basse : juste la barre de progression + distance restante
   - Position moyenne : stats completes + profil elevation mini
   - Position haute : detail complet avec points d'interet, signalements, etc.
   - On peut le masquer completement (slide down)

5. **Profil d'elevation EN TEMPS REEL**
   - Le profil montre ta position actuelle (marqueur vertical)
   - Tu vois ce qui t'attend devant : montee, descente, plat
   - "Prochaine montee : 200m de D+ sur 1.5 km"
   - Colore en gradient : vert (plat) → orange (raide) → rouge (tres raide)

6. **Points d'interet le long du sentier**
   - Points de vue panoramique
   - Sources d'eau
   - Abris / kiosques
   - Croisements avec indication de direction
   - "Dans 200m, prendre a gauche direction Piton des Neiges"

7. **Notifications contextuelles**
   - "Tu as depasse la moitie ! Bravo !"
   - "Point de vue dans 300m sur ta droite"
   - "Attention, section raide dans 500m (35% de pente)"
   - "Coucher du soleil dans 2h30 — il te reste 5 km"
   - "Tu marches plus vite que la moyenne ! (3.5 km/h vs 2.5)"

8. **Mode economie batterie**
   - Reduire la frequence GPS a 30s (au lieu de 5s)
   - Eteindre l'ecran entre les points d'interet
   - Vibration quand tu approches d'un croisement important
   - "Mode eco : ta batterie durera encore 3h estimees"

---

## PHASE 5 : "Je savoure"

### Actuel
"Tu veux valider ce sentier ?" → Oui/Non → C'est tout.

### Ecran de fin de rando repense

```
┌─────────────────────────────────────────┐
│                                          │
│     BRAVO !                              │
│     Tu as complete le Piton des Neiges   │
│                                          │
│  [Carte avec ta trace en vert]           │
│                                          │
│  STATS                                   │
│  13.6 km · 2200m D+ · 6h45             │
│  Vitesse moy: 2.0 km/h                  │
│  Alt max: 3071m · Alt min: 1600m        │
│                                          │
│  COMPARAISON                             │
│  Plus rapide que 72% des randonneurs     │
│  Record perso D+ en une rando !          │
│                                          │
│  PROGRESSION                             │
│  43/710 sentiers (6.1%)                  │
│  Zone Piton des Neiges : +1 sentier      │
│                                          │
│  DEFI                                    │
│  Les 3 Cirques : 8/12 → bravo !         │
│                                          │
│  [Partager]  [Exporter GPX]  [Rejouer]  │
│                                          │
│  [Retour a l'accueil]                    │
└─────────────────────────────────────────┘
```

Ce qu'il faut :
- Ecran de celebration (pas juste une Alert)
- Comparaison avec les autres (percentile)
- Record perso detecte automatiquement
- Progression defis mise a jour
- Un bouton "Partager" qui genere une belle image avec la carte + stats
- Un bouton "Rejouer" pour le replay anime
- Export GPX

---

## LA CARTE — Reflexion profonde

### Pourquoi Positron est MAUVAIS pour la rando

Positron est une carte URBAINE. Elle montre les rues, les batiments, les noms de ville. Pour la rando a La Reunion, c'est inutile :
- Pas de courbes de niveau (sur une ile ou l'altitude va de 0 a 3070m)
- Pas de relief visible
- Pas de sentiers balisés
- Pas de vegetation (foret / savane / lave)

### La carte ideale pour la rando reunionnaise

Options :
1. **OpenTopoMap** — courbes de niveau, relief, sentiers. GRATUIT. Deja integre en toggle. Devrait etre le DEFAULT.
2. **IGN Scan25** — la reference absolue pour la rando en France/DOM. PAYANT (API IGN).
3. **Thunderforest Outdoors** — tres bonne carte outdoor, 150k tuiles/mois gratuites.
4. **Satellite** — ESRI World Imagery ou Mapbox Satellite. Utile pour reperer le terrain.

### Recommandation
- **Par defaut : OpenTopoMap** (courbes de niveau = essentiel)
- **Option satellite** pour reperer le terrain avant de partir
- **Plus tard : IGN si partenariat** (la meilleure carte pour la rando en France)

### Le style de carte en navigation

Pendant la rando, la carte doit :
- Etre SIMPLIFIEE (pas besoin de voir les noms de ville)
- Montrer clairement le SENTIER (trait epais, bien visible)
- Montrer le RELIEF (ombre portee, courbes de niveau)
- Etre lisible en PLEIN SOLEIL (contraste fort)
- Etre lisible dans le NOIR (mode sombre avec trace lumineuse)

---

## Sentiers — Ameliorations profondes

### Points d'interet (POI)

Chaque sentier devrait avoir des points d'interet marques :
- Points de vue (avec description de ce qu'on voit)
- Sources d'eau
- Abris / kiosques
- Passages techniques (echelles, chaines, gue)
- Croisements (avec direction a prendre)

### Comment les creer sans les avoir ?

Option 1 : **Extraction automatique des descriptions**
Les descriptions de 1900 chars mentionnent souvent des points cles. Un algorithme NLP simple peut extraire :
- "cascade" → POI cascade
- "point de vue" / "panorama" → POI vue
- "source" / "eau" → POI eau
- "kiosque" / "aire de pique-nique" → POI repos

Option 2 : **Contribution communautaire**
Les utilisateurs peuvent ajouter des POI en marchant :
- Bouton "Marquer un point" pendant la rando
- Type : vue, eau, abri, technique, autre
- Photo optionnelle
- Position GPS automatique

### Directions aux croisements

C'est le feature le plus UTILE sur le terrain :
"Dans 200m, prendre a GAUCHE direction Piton des Neiges"

Pour l'implementer :
1. Analyser les traces GPS pour trouver les angles > 30 degres (croisements)
2. A ces points, indiquer la direction a suivre
3. Utiliser @turf/bearing pour calculer la direction
4. Vibration + notification quand l'utilisateur approche d'un croisement

---

## Benchmark Strava — Analyse du screenshot

### Ce que Strava fait et qu'on doit copier
1. **Carte = 75% de l'ecran** — c'est la STAR, pas les stats
2. **Header 1 ligne** — "Cyclisme" + retour + settings. Rien d'autre
3. **Stats en typo ENORME** — lisible en marchant, en plein soleil
4. **Bouton DEMARRER geant** — jaune, rond, impossible a rater
5. **Zero bruit visuel** — pas de badges, suggestions, bannieres
6. **POI sur la carte** — snack bars, ecoles, noms de chemins = CONTEXTE
7. **Bouton photo** integre en bas a gauche — toujours accessible
8. **Boussole + recentrer** discrets, pas intrusifs

### Notre layout cible
```
┌─────────────────────────────────────────┐
│  <   Randonnee   ⚙                      │  1 ligne
├─────────────────────────────────────────┤
│  [Boussole]                 [Recentrer] │
│                                          │
│              CARTE 75%                   │
│         (POI locaux visibles)            │
│                                          │
│     [Point bleu GPS]                     │
│                                    [i]   │
├─────────────────────────────────────────┤
│   0           0:00:00            0       │  GROS
│   KM           TEMPS           KM/H     │  petit
│                                          │
│  [Camera]    [=== DEMARRER ===]          │  CTA geant
└─────────────────────────────────────────┘
```

### Principe : MOINS c'est PLUS
- Supprimer le briefing card (info deja dans la fiche sentier)
- Supprimer les suggestions (c'est l'accueil, pas la navigation)
- Supprimer les badges overlays
- Stats dans le bottom panel, pas sur la carte
- Pendant la rando : stats changent (distance, temps, km/h) mais restent GROS
- Le profil d'elevation = dans le bottom sheet draggable, pas en overlay

---

## Resume : Ce qu'on fait AUJOURD'HUI

### Bloc 0 : Fix urgents (30 min)
- Clusters fonctionnels
- Likes fonctionnels
- Bouton retour fiche sentier

### Bloc 1 : Carte plein ecran + navigation repensee (2h)
- Bottom sheet draggable pour les stats
- Carte 70-80% de l'ecran
- Bouton boussole / recentrer
- Trace bicolore (vert derriere, bleu devant)

### Bloc 2 : Ecran de fin de rando (1h)
- Celebration avec carte + stats
- Comparaison percentile
- Records perso
- Partage + Export GPX

### Bloc 3 : Dashboard personnel + historique (1h30)
- Ecran "Mes randonnees" avec historique
- Stats hebdo/mensuel
- Records automatiques

### Bloc 4 : Defis thematiques (1h)
- 6-8 defis pre-configures
- Progression auto
- Badges visuels

### Bloc 5 : Recommandation du jour (30 min)
- Suggestion basee meteo + position + historique
- Card sur la carte

### Bloc 6 : Profil elevation interactif (1h)
- Sync avec la carte
- Marqueur de position pendant la rando
- Gradient de pente

TOTAL : ~8h de travail intensif

---

*Document ecrit le 19 mars 2026 — la vision qui fait de nous un cador*
