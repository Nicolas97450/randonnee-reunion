# Architecture Technique — Randonnée Réunion
**Document de System Design | V2.0 | Mars 2026 — Mis a jour le 17/03/2026**

---

## 1. Exigences de référence

### Fonctionnelles
- Afficher et filtrer les sentiers de La Réunion
- Cartes vectorielles téléchargeables et consultables hors-ligne
- Navigation GPS temps réel sur sentier
- Météo en temps réel sur le point de départ des sentiers
- État des sentiers via l'API OMF
- Validation de sentiers réalisés + gamification (carte colorisable)

### Non-fonctionnelles
| Critère | Cible |
|---|---|
| Disponibilité app | 99,5% (hors mode offline) |
| Latence API backend | < 300ms au P95 |
| Taille tuiles offline par sentier | < 50 Mo (sentier moyen) |
| Support offline | 100% des fonctions core après téléchargement |
| Utilisateurs simultanés (V1) | < 5 000 (MVP) |
| Plateformes | iOS 16+, Android 10+ |

### Contraintes
- Equipe : Nicolas (solo) + Claude Code (IA) — vibe coding
- Timeline reelle : 2 jours (17-18 mars 2026) — 6 sprints codes
- Budget maitrise → stack 100% open-source et gratuite (MapLibre, Supabase free, Expo)
- Données sentiers : 710 sentiers scrapes de Randopitons.re avec GPS reels

---

## 2. Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │  Écrans  │  │  GPS /   │  │  Cartes  │  │Gamification  │  │
│   │   UI     │  │ Tracking │  │ Offline  │  │   Engine     │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        └─────────────┴──────────────┴───────────────┘          │
│                          State Layer (Zustand / Redux)          │
│                          Local DB (SQLite / MMKV)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
   │  API        │  │  CDN Tiles  │  │  External  │
   │  Backend    │  │  (Cloudflare│  │  APIs      │
   │  (Supabase) │  │  / Bunny)   │  │  OMF       │
   └──────┬──────┘  └─────────────┘  │  Météo-FR  │
          │                          └────────────┘
   ┌──────▼──────┐
   │  PostgreSQL │
   │  + PostGIS  │
   └─────────────┘
```

---

## 3. Stack technique recommandée

### Mobile — React Native (avec Expo)

**Pourquoi React Native plutôt que Flutter ?**

| Critère | React Native | Flutter |
|---|---|---|
| Courbe d'apprentissage | Faible si JS/TS connu | Dart = nouveau langage |
| Écosystème cartographie | react-native-maps, MapLibre | flutter_map (moins mature) |
| Librairies offline maps | MapLibre GL Native ✅ | Moins d'options robustes |
| Time to market | Plus rapide avec Expo | Compilation native plus rapide |
| Communauté | Plus large | En forte croissance |

> **Décision : React Native + Expo (managed workflow) pour la V1**

### Cartographie offline — MapLibre GL Native

```
react-native-maplibre-gl
├── Rendu vectoriel (tiles .pmtiles ou .mbtiles)
├── Style personnalisable (couleurs sentiers, POI)
├── Support offline natif (cache des tuiles téléchargées)
├── Open-source (fork de Mapbox GL, sans license restrictive)
└── Compatible iOS + Android
```

**Format des tuiles : `.pmtiles`**
- Fichier unique par sentier (pas de milliers de fichiers)
- Téléchargement atomique, vérification d'intégrité simple
- Lecture directe depuis le stockage local

### Backend — Supabase

```
Supabase
├── PostgreSQL 15 + extension PostGIS (données géo)
├── Auth (JWT, OAuth Google/Apple)
├── Storage (buckets pour les fichiers .pmtiles)
├── Edge Functions (logique métier, proxy APIs externes)
├── Realtime (optionnel V2 pour alertes live)
└── Auto-generated REST API + type-safe client
```

**Pourquoi Supabase pour le MVP ?**
- PostGIS inclus → requêtes spatiales natives (sentiers dans un rayon, bbox)
- Gratuit jusqu'à ~500Mo de DB + 1Go de storage
- Réduit drastiquement le temps de setup backend
- Migration vers infra custom possible si besoin de scale

---

## 4. Modèle de données

### Schéma PostgreSQL + PostGIS

```sql
-- Sentiers
CREATE TABLE trails (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,         -- ex: "mafate-ilet-des-orangers"
  description   TEXT,
  difficulty    TEXT CHECK (difficulty IN ('facile', 'moyen', 'difficile', 'expert')),
  distance_km   DECIMAL(6,2),
  elevation_gain_m INT,
  duration_min  INT,
  trail_type    TEXT CHECK (trail_type IN ('boucle', 'aller-retour', 'point-a-point')),
  region        TEXT,                         -- ex: "Cirque de Mafate"
  start_point   GEOGRAPHY(POINT, 4326),       -- coordonnées GPS départ
  end_point     GEOGRAPHY(POINT, 4326),
  bbox          GEOGRAPHY(POLYGON, 4326),     -- bounding box pour cache tuiles
  gpx_url       TEXT,                         -- GPX source sur Storage
  tiles_url     TEXT,                         -- fichier .pmtiles sur CDN
  tiles_size_mb DECIMAL(6,2),
  omf_trail_id  TEXT,                         -- référence ID côté OMF
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Index spatial
CREATE INDEX trails_start_point_idx ON trails USING GIST (start_point);
CREATE INDEX trails_bbox_idx ON trails USING GIST (bbox);

-- État des sentiers (cache des données OMF)
CREATE TABLE trail_conditions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id    UUID REFERENCES trails(id),
  status      TEXT CHECK (status IN ('ouvert', 'ferme', 'degrade', 'inconnu')),
  message     TEXT,
  source      TEXT DEFAULT 'omf',
  fetched_at  TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ                     -- TTL du cache
);

-- Utilisateurs (étend auth.users de Supabase)
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  username      TEXT UNIQUE,
  avatar_url    TEXT,
  is_premium    BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Activités (sentiers réalisés)
CREATE TABLE user_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id),
  trail_id        UUID REFERENCES trails(id),
  completed_at    TIMESTAMPTZ DEFAULT now(),
  validation_type TEXT CHECK (validation_type IN ('gps', 'manual')),
  gpx_track       JSONB,                      -- trace GPS enregistrée (optionnel)
  duration_min    INT,
  notes           TEXT,
  UNIQUE(user_id, trail_id)                   -- un sentier = une complétion
);

-- Zones géographiques (pour la gamification)
CREATE TABLE map_zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                  -- ex: "Cirque de Cilaos"
  slug        TEXT UNIQUE NOT NULL,
  color_hex   TEXT DEFAULT '#2ECC71',         -- couleur révélée sur la carte
  geojson     JSONB NOT NULL,                 -- polygone de la zone
  order_idx   INT                             -- ordre d'affichage
);

-- Liaison sentiers ↔ zones
CREATE TABLE trail_zones (
  trail_id UUID REFERENCES trails(id),
  zone_id  UUID REFERENCES map_zones(id),
  PRIMARY KEY (trail_id, zone_id)
);
```

---

## 5. API Endpoints (REST via Supabase + Edge Functions)

### Sentiers

```
GET  /api/trails
     ?difficulty=moyen&region=mafate&duration_max=240
     → Liste paginée avec filtres

GET  /api/trails/:slug
     → Fiche complète + conditions OMF (cachées) + météo

GET  /api/trails/:slug/tiles-download-url
     → URL signée S3/CDN pour télécharger le .pmtiles
     → Vérifie droits premium si > 3 sentiers offline
```

### Conditions & Météo

```
GET  /api/trails/:slug/conditions
     → Statut OMF + timestamp de fraîcheur
     → Cache 1h côté serveur (Edge Function avec KV store)

GET  /api/trails/:slug/weather
     → Météo J et J+2 sur start_point
     → Proxy vers Météo-France API (cache 30min)
```

### Utilisateur & Gamification

```
POST /api/activities
     body: { trail_id, validation_type, gpx_track?, duration_min }
     → Enregistre la completion + calcule zones débloquées

GET  /api/me/map
     → Retourne les zones complétées (pour colorisation carte)
     → Format : { zones_completed: ["mafate", "cilaos"], progress: 0.34 }

GET  /api/me/stats
     → Total km, dénivelé cumulé, nb sentiers, streak hebdo
```

---

## 6. Intégrations externes

### API OMF (Office de la Montagne et des Sentiers)

```
Situation actuelle : Pas d'API publique documentée connue.

Options :
  Option A — Partenariat direct avec l'OMF
    → Accès à leur base de données via convention
    → Meilleure qualité de données, légitimité
    → Délai : 2-3 mois de négociation

  Option B — Scraping du site officiel OMF
    → sentiers.reunion.fr (page état des sentiers)
    → Edge Function planifiée toutes les heures
    → Risque légal faible si usage non-commercial et avec mention source
    → À valider avec un juriste

  Option C — Saisie manuelle + alertes communautaires
    → Fallback en cas d'échec des options A/B
    → Base de données des états mise à jour par modération

Recommandation MVP : Lancer avec Option B + Cache 1h, négocier Option A en parallèle.
```

**Flux de cache OMF :**
```
Mobile App → Edge Function (Supabase)
                │
                ├─ Cache valide (<1h) ? → Retourne cache
                │
                └─ Cache expiré → Scrape / Appel OMF API
                                → Met à jour trail_conditions
                                → Retourne données fraîches
```

### API Météo — Météo-France (API Publique)

```
Endpoint utilisé :
  https://api.meteo-concept.com/api/forecast/daily
  (ou Météo-France API officielle : api.meteofrance.fr)

Données récupérées par sentier :
  - Température min/max J et J+2
  - Précipitations (mm)
  - Vent (km/h)
  - Icône météo (ensoleillé, nuageux, pluvieux, orageux)

Cache : 30 minutes par sentier (coordonnées GPS)
Coût : Gratuit jusqu'à 500 appels/jour (largement suffisant en MVP)
```

---

## 7. Gestion des cartes hors-ligne

### Flux de téléchargement

```
1. Utilisateur clique "Télécharger" sur fiche sentier
         │
2. App vérifie quota offline (gratuit = 3 max)
         │
3. Requête GET /api/trails/:slug/tiles-download-url
         │
4. Backend génère une URL signée (durée 15min) vers CDN
         │
5. App télécharge le .pmtiles via CDN (bypass backend)
         │
6. Fichier stocké dans : DocumentDirectory/tiles/{trail-slug}.pmtiles
         │
7. SQLite local mis à jour : { trail_id, path, downloaded_at, size_mb }
         │
8. MapLibre configuré pour lire depuis le fichier local
```

### Génération des fichiers .pmtiles (pipeline)

```
Source données :
  OpenStreetMap (sentiers, chemins, POI) via Overpass API
  + Traces GPX officielles OMF / IGN (si partenariat)
         │
  Tippecanoe (CLI) → Génère tuiles vectorielles
         │
  pmtiles convert → Emballe en fichier .pmtiles unique
         │
  Upload sur Cloudflare R2 / Bunny CDN
         │
  URL enregistrée dans table trails.tiles_url

Déclencheur : Script batch hebdomadaire (ou à la demande admin)
Coût stockage estimé : ~2 Go pour 100 sentiers × 20Mo moyenne → ~0,05$/mois sur R2
```

### Gestion de l'espace disque

```
Écran "Mes cartes offline" :
  - Liste des sentiers téléchargés
  - Taille de chaque fichier
  - Bouton suppression individuelle
  - Taille totale utilisée / espace disponible device

Règle auto-nettoyage : Proposer suppression si > 500Mo utilisés
```

---

## 8. GPS & Tracking

### Stratégie de suivi

```
Mode Navigation Active (foreground) :
  - Fréquence : 1 point GPS / 5 secondes
  - Précision : HIGH_ACCURACY (GPS + réseau)
  - Consommation batterie : élevée → informer l'utilisateur

Mode Veille (background - premium uniquement) :
  - Fréquence : 1 point / 30 secondes
  - Utilise expo-location avec background tracking
  - Nécessite permission "always" sur iOS

Stockage trace :
  - Buffer en mémoire (max 10 000 points = ~14h à 5s)
  - Flush vers SQLite local toutes les 100 points
  - Envoi vers backend uniquement à la fin du sentier (optionnel)
```

### Validation automatique GPS

```
Algorithme de validation :
  1. Récupérer la trace GPX de référence du sentier
  2. Calculer la distance de Hausdorff entre trace user et trace ref
  3. Si distance < 200m ET couverture > 70% du sentier → Validé auto
  4. Sinon → Proposer validation manuelle

Seuils configurables en base (par sentier si besoin)
```

---

## 9. Gamification — Mécanique de la carte

### Découpage géographique de l'île

```
Zones proposées (18 zones total) :
  ┌─────────────────────────────────────────────┐
  │  Hauts (cirques & massifs)                  │
  │   - Cirque de Mafate        (6 sentiers)    │
  │   - Cirque de Cilaos        (5 sentiers)    │
  │   - Cirque de Salazie       (5 sentiers)    │
  │   - Massif du Volcan        (4 sentiers)    │
  │   - Piton des Neiges        (2 sentiers)    │
  │                                             │
  │  Littoral & Planèzes                        │
  │   - Côte Ouest (Saint-Gilles, Hermitage...) │
  │   - Côte Est (Saint-Denis, Sainte-Rose...)  │
  │   - Sud Sauvage                             │
  │   - ... (10 zones côtières)                 │
  └─────────────────────────────────────────────┘

Règle de colorisation :
  Zone = colorisée quand ≥ 1 sentier de la zone est validé
  Zone = couleur pleine quand TOUS les sentiers de la zone sont validés
  Zone = couleur intermédiaire (gradient) selon % de complétion
```

### Rendu côté mobile

```javascript
// Exemple MapLibre Layer pour la gamification
map.addLayer({
  id: 'zones-progress',
  type: 'fill',
  source: 'zones-geojson',
  paint: {
    'fill-color': [
      'case',
      ['==', ['get', 'progress'], 0],
        '#D1D5DB',                   // Gris : pas commencé
      ['==', ['get', 'progress'], 1],
        '#16A34A',                   // Vert plein : 100% complété
      // Gradient intermédiaire (10% → 90%)
        ['interpolate', ['linear'], ['get', 'progress'],
          0.1, '#BBF7D0',
          0.5, '#4ADE80',
          0.9, '#22C55E'
        ]
    ],
    'fill-opacity': 0.7,
    'fill-outline-color': '#FFFFFF'
  }
});
```

---

## 10. Sécurité & Authentification

```
Auth flow :
  1. Sign up/in via Supabase Auth (email+password ou OAuth Google/Apple)
  2. JWT Token (access: 1h, refresh: 7 jours) stocké dans SecureStore (Expo)
  3. Toutes les routes /api/me/* requièrent Authorization: Bearer <token>

Row Level Security (RLS) Supabase :
  - user_activities : SELECT/INSERT uniquement sur ses propres lignes
  - user_profiles   : UPDATE uniquement sur son propre profil
  - trails          : SELECT public, INSERT/UPDATE réservé au rôle admin

Premium check :
  - Vérifié côté backend via user_profiles.is_premium + premium_until
  - Ne jamais faire confiance au client pour les checks premium
```

---

## 11. Analyse des compromis clés

| Décision | Option choisie | Alternative écartée | Raison |
|---|---|---|---|
| Framework mobile | React Native | Flutter | Écosystème MapLibre plus mature, team JS |
| Backend | Supabase | NestJS custom | Time to market, PostGIS inclus, moins de DevOps |
| Cartes | MapLibre + PMTiles | Mapbox SDK | Pas de license restrictive, 100% offline |
| Source géo | OSM + IGN | Google Maps | Coût, droits d'utilisation, offline possible |
| Cache météo | Edge Function | Client-side | Clé API non exposée, cache mutualisé |
| Validation sentier | GPS + fallback manuel | GPS strict | UX : ne pas bloquer les randonneurs sans GPS précis |
| Auth | Supabase Auth | Firebase Auth | Stack unifiée, évite dépendance Google |

---

## 12. Ce qu'on revisiterait en V2/Scale

- **Remplacer Supabase Edge Functions par un service dédié** si les appels OMF/météo deviennent trop fréquents (>100k/jour)
- **Passer à un CDN de tuiles dédié** (ex: Protomaps Cloud) si la bibliothèque dépasse 500 sentiers
- **Ajouter un service de sync différentielle** pour les mises à jour de tuiles (aujourd'hui full re-download)
- **Implémenter une queue de jobs** (BullMQ ou Inngest) pour la génération des .pmtiles à la demande
- **Monitoring avancé** : Sentry pour les crashes mobile, Datadog/Grafana pour les APIs

---

*Document redige le 16 mars 2026 — Mis a jour le 17 mars 2026 (contraintes reelles, stack validee)*
