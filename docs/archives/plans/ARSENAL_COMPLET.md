# Arsenal Complet — Tout ce qu'on a pour devenir un cador
> 19 mars 2026 — Compilation de toutes les recherches

---

## 1. CARTES (testees et confirmees)

| Carte | URL | Gratuit | Pour quoi |
|-------|-----|---------|-----------|
| **IGN Plan v2** | `data.geopf.fr/wmts?...PLANIGNV2...` | Oui, sans cle | Carte topo officielle France + Reunion, sentiers GR, courbes de niveau |
| **IGN Orthophotos** | `data.geopf.fr/wmts?...ORTHOIMAGERY...` | Oui | Vue satellite HD |
| **OpenTopoMap** | `tile.opentopomap.org/{z}/{x}/{y}.png` | Oui | Topo basee OSM, alternative |
| **Positron** | `basemaps.cartocdn.com/.../positron...` | Oui | Vue urbaine clean |
| **Dark Matter** | `basemaps.cartocdn.com/.../dark-matter...` | Oui | Mode nuit |

**Strategie** : IGN par defaut (c'est ce qu'utilise Visorando), satellite en option, Positron pour la ville. Mode nuit auto base sunrise/sunset.

---

## 2. APIs GRATUITES

### POI (Points d'interet)
| API | Donnees | Teste |
|-----|---------|-------|
| **Overpass (OSM)** | 1458+ restaurants/bars + abris/sources/points de vue a La Reunion | OUI |

### Elevation
| API | Precision | Usage |
|-----|-----------|-------|
| **IGN Altimetrie** | 1m (RGE ALTI) | Profil elevation ultra-precis |
| **Open-Meteo elevation** | ~30m | Alternative rapide |

### Routing
| API | Usage |
|-----|-------|
| **OSRM foot** | Deja integre, routing pieton |
| **Photon (Komoot)** | Geocodage avec auto-completion |

### Meteo
| API | Donnees |
|-----|---------|
| **Open-Meteo** | UV, vent, visibilite, sunrise/sunset, CAPE, precipitation — deja enrichi |
| **Meteo-France Vigilance** | Alertes cycloniques dept 974 (`vigilance.meteofrance.fr/data/vigilance.json`) |

### Social
| API | Usage |
|-----|-------|
| **Strava API** | Import/export activites (OAuth, 1000 req/jour gratuit) |

---

## 3. PACKAGES NPM A UTILISER

| Package | Usage | Priorite |
|---------|-------|----------|
| **@turf/nearest-point-on-line** | Snap GPS sur sentier, detection croisements | Haute |
| **@turf/along** | Point a X km sur la trace (turn-by-turn) | Haute |
| **@turf/length** | Distance totale trace | Haute |
| **@turf/bearing** | Direction entre 2 points (virage gauche/droite) | Haute |
| **@turf/line-slice** | Portion restante du sentier | Haute |
| **react-native-view-shot** | Screenshot carte+stats pour partage | Haute |
| **expo-sharing** | Partage natif (deja installe) | Haute |
| **expo-haptics** | Retour haptique boutons | Moyenne |
| **expo-battery** | Niveau batterie → mode eco | Moyenne |
| **lottie-react-native** | Animations celebrations | Moyenne |
| **togpx** | Export GPX | Moyenne |

---

## 4. GAMIFICATION — Plan complet

### Niveaux randonneur
| Niveau | Nom | Sentiers |
|--------|-----|----------|
| 1 | Ti Marcheur | 0-5 |
| 2 | Randonneur | 6-20 |
| 3 | Explorateur | 21-50 |
| 4 | Baroudeur | 51-100 |
| 5 | Maitre des Sentiers | 101-200 |
| 6 | Legende de l'Ile | 201-400 |
| 7 | Roi Creole | 401-600 |
| 8 | Gardien de La Reunion | 601-710 |

### Badges geographiques La Reunion
- Gardien de Mafate — tous sentiers Mafate (52)
- Volcanologue — tous sentiers Volcan (42)
- Maitre des 3 Cirques — 1 sentier par cirque
- Toit de l'Ocean Indien — Piton des Neiges
- GR R2 Complet — traversee Cilaos-Volcan
- Leve-tot — rando avant 7h
- Pluie ou Soleil — rando jour de pluie > 20mm
- 5 en 1 Semaine — 5 sentiers en 7 jours

### Streaks
- Semaines consecutives avec au moins 1 rando
- Flamme visible sur le profil
- Notification "Streak en danger !"

### XP et classement
- 1 km = 10 XP, 100m D+ = 50 XP, validation = 100 XP, badge = 500 XP
- Leaderboard mensuel

### Defis communautaires
- "Mars : 1000 km collectifs"
- "Defi Mafate : 50 randonneurs ce mois"
- "Hiver austral : 3 randos > 2000m"

### Ti Tresor (geocaching reunionnais)
- POI caches le long des sentiers (cascades secretes, arbres remarquables)
- Check-in GPS automatique a < 50m
- Anecdotes locales + photos

---

## 5. NAVIGATION AVANCEE

### Turn-by-turn sur sentier
- Detecter les virages > 30 degres avec @turf/bearing
- Notification "Dans 200m, tourner a gauche"
- Vibration (expo-haptics) a l'approche d'un croisement

### Carte orientee
- MapLibre Camera heading = GPS heading
- Toggle Nord-up / Heading-up
- Bouton boussole pour reset

### Mode nuit automatique
- Si heure < sunrise ou > sunset → MAP_STYLE_DARK
- Basee sur les donnees Open-Meteo deja disponibles

### Mode economie batterie
- expo-battery pour lire le niveau
- < 30% → tracking toutes les 30s (au lieu de 5s)
- < 15% → alerte + suggestion couper GPS

---

## 6. SOCIAL AVANCE

### Image de partage (type Strava)
- react-native-view-shot → capture carte + stats en PNG 1080x1080
- expo-sharing → partage WhatsApp/Instagram
- Branding "Randonnee Reunion" en watermark

### Segments (type Strava)
- Portions chronometrees de sentiers
- Classement par temps
- Detection auto via GPS + @turf/distance

### Leaderboard
- Top 10 mensuel par sentiers / km / D+
- Vue SQL sur user_activities

---

## 7. SECURITE

### Alertes cycloniques
- `vigilance.meteofrance.fr/data/vigilance.json` → dept 974
- Poll toutes les heures
- Bandeau rouge si niveau >= orange

### Estimation batterie
- expo-battery → estimation heures restantes
- Avertissement < 30%, mode eco < 15%

### SOS ameliore
- Sauvegarder derniere position dans AsyncStorage toutes les 60s
- Envoyer aussi aux contacts d'urgence perso
- Ajouter Centre Anti-Poison (piqures tropicales)

---

## 8. MONETISATION (futur)

### Gratuit pour toujours
- 710 sentiers, carte, meteo, GPS basique
- Gamification complete (badges, niveaux, streaks)
- Social complet (amis, feed, sorties)
- SOS urgence, signalements

### Premium 19.99 EUR/an
- Cartes offline
- Turn-by-turn sur sentier
- Mode nuit auto
- Stats avancees + resume hebdo
- Segments et classements
- Image de partage personnalisee

---

## 9. DESIGN — Principes Strava

1. Carte = 75% de l'ecran
2. Header 1 ligne minimal
3. Stats en typo ENORME
4. Bouton DEMARRER geant
5. Zero bruit visuel
6. POI sur la carte (snacks, eau, abris)
7. Bouton photo integre

---

## Skills installes

| Skill | Usage |
|-------|-------|
| mobile-design | UX mobile, touch, performance |
| react-native-design | Styling, navigation, Reanimated |
| supabase-backend-platform | Backend Supabase |
| expo-deployment | Deploiement Expo |
| expo-react-native-performance | Optimisation perf RN |
| reanimated-skia-performance | Animations Skia |
| large-scale-map-visualization | Carte grande echelle |
| mobile-app-ui-design | Design UI mobile |
| gamification-loops | Boucles gamification |
| lottie | Animations Lottie |

---

*Compile le 19 mars 2026 — pret a coder*
