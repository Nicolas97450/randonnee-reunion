# Audit Final — Skills & Best Practices
> Date : 19 mars 2026 | Auteur : CTO Audit
> Base : audit 18 mars + skills mobile-design, react-native-design, mobile-backend

---

## Section 1 : Verdict

**AMELIORATION** — pas de refonte.

Justification par les skills :

1. **Stack technique solide** — Expo SDK 55, Zustand, React Query, MapLibre, Supabase. Aucun choix technologique a remettre en cause. Le skill mobile-design-thinking valide : Zustand > Redux pour cette complexite, 4 tabs = correct (ni trop ni trop peu).

2. **Architecture hooks bien structuree** — 20 hooks dedies, separation claire des responsabilites. Conforme au principe "local state quand possible, global quand necessaire".

3. **Asset unique : 710 traces GPS reelles** — valeur differenciante majeure. Le code de scraping et parsing est fonctionnel.

4. **Trous fonctionnels comblables** — les manques (carte topo, elevation, offline, gamification morte) sont des ajouts, pas des refactorisations profondes.

5. **Risque de refonte** — une refonte casserait les 14 ecrans fonctionnels, les 20 hooks, les 5 stores, le systeme social complet, pour un gain marginal. Le skill mobile-design-thinking dit : "question your assumptions" — ici l'assumption serait que "plus c'est refait, mieux c'est". Faux.

**Conclusion : Sprint d'amelioration cible sur les 4 trous critiques.**

---

## Section 2 : Ecarts avec les best practices

### Touch targets 48px minimum
| Critere | Statut | Detail |
|---------|--------|--------|
| Boutons principaux (CTA) | PARTIEL | SOSButton, ProfileScreen ont des minHeight >= 44px. Pas de verification systematique sur tous les ecrans. |
| Filtres difficulte (TrailListScreen) | A VERIFIER | Chips de filtre potentiellement < 48dp sur Android |
| Espacement entre cibles | A VERIFIER | Risque de tap accidentel sur les listes denses |

**Action** : Ajouter `minHeight: 48` sur tous les Pressable/TouchableOpacity. Verifier avec un outil de debug les hit areas.

---

### Primary CTA dans la thumb zone
| Critere | Statut | Detail |
|---------|--------|--------|
| Bottom tabs | OK | 4 onglets en bas = thumb zone naturelle |
| CTA "Naviguer" sur TrailDetailScreen | A VERIFIER | Si le bouton est en haut de la fiche, il est hors thumb zone |
| FAB "Creer sortie" | A VERIFIER | Position non confirmee |

**Action** : Placer tous les CTA primaires en bas d'ecran (sticky bottom ou dans le bottom sheet).

---

### FlatList avec React.memo + useCallback + keyExtractor
| Critere | Statut | Detail |
|---------|--------|--------|
| FlashList utilise | OK | TrailListScreen et SortiesScreen utilisent FlashList avec estimatedItemSize |
| React.memo sur les items | ABSENT | 0 fichier utilise React.memo dans tout le projet |
| useCallback sur renderItem | PARTIEL | 14 fichiers utilisent useCallback, mais pas toujours sur renderItem |
| keyExtractor | OK | Present sur les 7 listes FlatList/FlashList |

**Action** : Ajouter `React.memo` sur TrailCard, SortieCard, et tous les composants renderItem. Wrapper les renderItem dans useCallback.

---

### getItemLayout pour listes a hauteur fixe
| Critere | Statut | Detail |
|---------|--------|--------|
| FlatList avec getItemLayout | ABSENT | 0 fichier utilise getItemLayout |
| FlashList avec estimatedItemSize | OK | Deja present (100 et 120) |

**Action** : Pour les FlatList restantes (FeedScreen, FriendsScreen, SortieDetailScreen), soit migrer vers FlashList, soit ajouter getItemLayout.

---

### Offline-first design
| Critere | Statut | Detail |
|---------|--------|--------|
| Carte offline | MORT | tiles_url = null sur 710 sentiers, bouton toujours grise |
| Cache sentiers | PARTIEL | React Query cache en memoire, pas sur disque |
| Cache meteo | PARTIEL | staleTime 30min, mais pas de persistence offline |
| Cache feed | OK | useFeed utilise AsyncStorage comme cache |
| Offline banner | OK | OfflineBanner composant present |

**Action Sprint 1** : Pas de carte offline (necessite serveur de tuiles). Activer le cache persistant React Query avec AsyncStorage pour les sentiers et la meteo. Afficher les donnees cachees quand hors ligne.

---

### Loading / Error / Empty states
| Critere | Statut | Detail |
|---------|--------|--------|
| Loading states | OK | 101 occurrences de loading/isLoading dans les ecrans |
| Error states | PARTIEL | Certains hooks retournent des erreurs, mais pas tous les ecrans les affichent |
| Empty states | PARTIEL | Pas de message "Aucun resultat" elegant sur toutes les listes |

**Action** : Creer un composant EmptyState reutilisable. Ajouter des messages d'erreur contextuels avec bouton "Reessayer".

---

### SecureStore pour les tokens (pas AsyncStorage)
| Critere | Statut | Detail |
|---------|--------|--------|
| Auth tokens | OK | supabase.ts utilise ExpoSecureStoreAdapter (expo-secure-store) |
| Donnees non sensibles | OK | AsyncStorage utilise pour onboarding, SOS disclaimer, feed cache — correct |

**Pas d'action requise** — c'est conforme.

---

### Console.log en production
| Critere | Statut | Detail |
|---------|--------|--------|
| console.log | FAIBLE | 3 occurrences dans 2 fichiers (useNotifications.ts, RegisterScreen.tsx) |

**Action** : Supprimer les 3 console.log. Ajouter une regle ESLint `no-console` pour prevenir les futurs ajouts.

---

### Cleanup des subscriptions
| Critere | Statut | Detail |
|---------|--------|--------|
| useEffect cleanup | PARTIEL | 5 fichiers ont des cleanup (MapScreen, authStore, useNotifications, OfflineBanner, useGPSTracking) |
| Supabase Realtime | A VERIFIER | useSortieChat doit cleanup le channel subscribe |
| AbortController | OK | useRouting utilise AbortController correctement |

**Action** : Verifier que tous les useEffect avec subscribe/addEventListener ont un return cleanup.

---

### Navigation platform-specific
| Critere | Statut | Detail |
|---------|--------|--------|
| Platform.OS usage | PARTIEL | 5 fichiers utilisent Platform.OS (NavigationScreen, SortieChat, Login, CreateSortie, Register) |
| Header style iOS vs Android | A VERIFIER | React Navigation gere une partie, mais pas de customisation explicite |
| Back gesture iOS | OK | NativeStack gere le swipe back automatiquement |

**Action** : Ajouter Platform.select pour les shadows (iOS) vs elevation (Android) sur les headers et les cards.

---

## Section 3 : APIs gratuites a integrer

### 3.1 OpenTopoMap — Carte topographique

**Quoi** : Remplacer le fond Positron (carte urbaine sans courbes de niveau) par OpenTopoMap (courbes de niveau, reliefs, chemins).

**Fichier** : `app/src/constants/map.ts`

**Changement exact** :
```typescript
// AVANT
export const MAP_STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// APRES — raster tiles OpenTopoMap dans un style JSON inline
export const MAP_STYLE_TOPO = {
  version: 8,
  sources: {
    opentopo: {
      type: 'raster',
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenTopoMap (CC-BY-SA)',
      maxzoom: 17,
    },
  },
  layers: [
    {
      id: 'opentopo-layer',
      type: 'raster',
      source: 'opentopo',
      minzoom: 0,
      maxzoom: 17,
    },
  ],
};
```

**Impact** : La carte affiche les courbes de niveau, les reliefs, les sentiers balisees. Enorme gain UX pour les randonneurs. Garder Positron comme fallback dark mode.

**Attention** : OpenTopoMap a un rate limit. Cache les tuiles agressivement. Ne pas utiliser pour du tile serving a grande echelle sans serveur proxy.

---

### 3.2 Open-Elevation — Profil d'altitude

**Quoi** : Enrichir les traces GPS avec les altitudes pour afficher un profil d'elevation SVG.

**Fichier a creer** : `app/src/hooks/useElevation.ts`
**Fichier a modifier** : `app/src/screens/TrailDetailScreen.tsx`
**Package requis** : `react-native-svg` (deja installe ou a ajouter)

**Integration** :
```typescript
// useElevation.ts
async function fetchElevation(coordinates: [number, number][]): Promise<number[]> {
  // Open-Elevation accepte max 100 points par requete
  // Sous-echantillonner la trace a ~50 points equidistants
  const sampled = samplePoints(coordinates, 50);
  const locations = sampled.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

  const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
  });

  const data = await response.json();
  return data.results.map((r: { elevation: number }) => r.elevation);
}
```

**Composant SVG** : Creer `app/src/components/ElevationProfile.tsx` avec react-native-svg. Afficher un profil avec :
- Axe X = distance cumulee (km)
- Axe Y = altitude (m)
- Remplissage gradient vert
- Points min/max annotes

**Placement** : Dans TrailDetailScreen, sous la description, avant la meteo.

---

### 3.3 OSRM walking profile — Changer driving en foot

**Quoi** : Le hook useRouting utilise `driving` au lieu de `foot`. Les temps et distances sont ceux d'une voiture, pas d'un randonneur.

**Fichier** : `app/src/hooks/useRouting.ts` ligne 3

**Changement exact** :
```typescript
// AVANT
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// APRES
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';
```

**Impact** : Le routing vers le point de depart du sentier calcule un itineraire pieton (chemins, sentiers) au lieu d'un itineraire voiture (routes). Les estimations de duree seront correctes pour un marcheur.

**Attention** : Le serveur OSRM public a un rate limit. Le throttle de 30s deja en place est correct. Garder le fallback straight-line.

---

### 3.4 Open-Meteo params supplementaires

**Quoi** : Ajouter rafales de vent, visibilite, UV, lever/coucher du soleil a la meteo.

**Fichier** : `app/src/hooks/useWeather.ts` ligne 50

**Changement exact sur l'URL** :
```typescript
// AVANT
`...&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Indian/Reunion&forecast_days=3`

// APRES
`...&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,weather_code,uv_index_max,sunrise,sunset&hourly=visibility&timezone=Indian/Reunion&forecast_days=3`
```

**Nouvelles donnees** :
- `wind_gusts_10m_max` : rafales en km/h (alerte si > 60 km/h en altitude)
- `uv_index_max` : indice UV (alerte si > 8, frequent a La Reunion)
- `sunrise` / `sunset` : calcul de la fenetre de randonnee disponible
- `visibility` (hourly) : visibilite en metres (alerte si < 1000m = brouillard)

**Interface DayForecast a enrichir** :
```typescript
interface DayForecast {
  // existants...
  wind_gusts_kmh: number;
  uv_index: number;
  sunrise: string;
  sunset: string;
  min_visibility_m: number;
}
```

**Impact UX** : Le WeatherWidget affiche des alertes contextuelles :
- UV > 8 : "Protection solaire indispensable"
- Rafales > 60 : "Vent violent en crete"
- Visibilite < 1000 : "Brouillard probable"
- Fenetre de jour calculee (ex: "6h15 - 18h30 = 12h15 de jour")

---

## Section 4 : Plan d'action Sprint 1

**Duree estimee** : 1 semaine (vibe coding)
**Objectif** : Corriger les 4 trous critiques + appliquer les best practices prioritaires.

### Priorite 1 — OSRM foot (5 min) — FAIT

**Fichier** : `app/src/hooks/useRouting.ts`
**Changement** : Ligne 3, remplacer `driving` par `foot`
**Risque** : Zero. Fallback straight-line deja en place.

---

### Priorite 2 — Carte topo OpenTopoMap (30 min) — FAIT

**Fichiers** :
- `app/src/constants/map.ts` — ajouter MAP_STYLE_TOPO (style raster)
- `app/src/components/BaseMap.tsx` — utiliser MAP_STYLE_TOPO comme style par defaut en light mode
- `app/src/screens/MapScreen.tsx` — toggle topo/positron (bouton dans le coin)

**Sous-taches** :
1. Definir le style raster OpenTopoMap dans map.ts
2. Ajouter un state `mapStyle` dans MapScreen
3. Bouton toggle en haut a droite de la carte (icone couches)
4. Garder Positron pour dark mode (OpenTopoMap n'a pas de dark)

---

### Priorite 3 — React.memo sur les composants de liste (30 min) — FAIT

**Fichiers** :
- `app/src/components/TrailCard.tsx` — wrapper avec React.memo
- `app/src/components/SortieChat.tsx` — memo sur les items de message
- `app/src/screens/FeedScreen.tsx` — memo sur les items de post
- `app/src/screens/FriendsScreen.tsx` — memo sur les items d'ami
- `app/src/screens/SortieDetailScreen.tsx` — memo sur les items

**Pattern a appliquer partout** :
```typescript
const TrailCard = React.memo(function TrailCard(props: TrailCardProps) {
  // ... composant existant
});
export default TrailCard;
```

---

### Priorite 4 — Meteo enrichie (1h) — FAIT

**Fichiers** :
- `app/src/hooks/useWeather.ts` — ajouter params UV, rafales, sunrise/sunset, visibility
- `app/src/components/WeatherWidget.tsx` — afficher les nouvelles alertes
- `app/src/types/trail.ts` — mettre a jour DayForecast si le type est la

**Sous-taches** :
1. Modifier l'URL Open-Meteo (ajouter 4 params)
2. Parser les nouvelles donnees dans fetchWeather
3. Ajouter des badges d'alerte dans WeatherWidget (UV, vent, brouillard)
4. Ajouter le calcul de fenetre de jour (sunrise/sunset)

---

### Priorite 5 — Profil d'elevation (2h) — FAIT

**Fichiers** :
- `app/src/hooks/useElevation.ts` — nouveau hook (fetch Open-Elevation API)
- `app/src/components/ElevationProfile.tsx` — nouveau composant SVG
- `app/src/screens/TrailDetailScreen.tsx` — integrer ElevationProfile
- `package.json` — ajouter react-native-svg si absent

**Sous-taches** :
1. Creer useElevation avec sous-echantillonnage a 50 points
2. Creer ElevationProfile avec react-native-svg (Path + gradient)
3. Integrer dans TrailDetailScreen entre description et meteo
4. Gerer loading state (skeleton) et error state (masquer le composant)

---

### Priorite 6 — Supprimer console.log (5 min) — FAIT

**Fichiers** :
- `app/src/hooks/useNotifications.ts` — supprimer 2 console.log
- `app/src/screens/RegisterScreen.tsx` — supprimer 1 console.log

---

### Priorite 7 — Mise a jour traces Supabase (1h) — FAIT (bundle JSON local)

**Contexte** : Les traces GPS dans le JSON local sont nettoyees (points parasites supprimes), mais Supabase a encore les traces corrompues dans `gpx_url`.

**Fichier** : `app/scripts/` — creer un script de migration `update-traces-supabase.mjs`

**Sous-taches** :
1. Lire les traces nettoyees du JSON local
2. Pour chaque sentier, UPDATE gpx_url dans Supabase avec la trace nettoyee
3. Verifier le nombre de lignes mises a jour (710/710)
4. Logger les sentiers qui echouent

---

### Priorite 8 — Fix cluster tap Android (1h) — FAIT

**Contexte** : MapLibre `onPress` sur ShapeSource cluster ne fonctionne pas sur Android.

**Fichiers** :
- `app/src/components/TrailMarkers.tsx` — supprimer onPress sur ShapeSource
- `app/src/components/BaseMap.tsx` ou `app/src/screens/MapScreen.tsx` — ajouter MapView.onPress + queryRenderedFeaturesAtPoint

**Pattern** :
```typescript
const handleMapPress = async (event: MapLibreEvent) => {
  const { screenPointX, screenPointY } = event.properties;
  const features = await mapRef.current?.queryRenderedFeaturesAtPoint(
    [screenPointX, screenPointY],
    undefined,
    ['clusters', 'trail-points'] // layer IDs
  );
  if (features?.features?.length) {
    const feature = features.features[0];
    if (feature.properties?.cluster) {
      // Zoom sur le cluster
      const zoom = await mapRef.current?.getZoom();
      mapRef.current?.flyTo([...feature.geometry.coordinates], (zoom ?? 10) + 2);
    } else {
      // Ouvrir la fiche sentier
      navigation.navigate('TrailDetail', { trailId: feature.properties.slug });
    }
  }
};
```

---

### Priorite 9 — Gamification : validateTrail fonctionnel (2h) — FAIT

**Contexte** : user_activities = 0 lignes. La fonction validateTrail() existe mais n'est jamais appelee avec succes.

**Fichiers** :
- `app/src/stores/progressStore.ts` — verifier que validateTrail INSERT dans user_activities
- `app/src/screens/NavigationScreen.tsx` — appeler validateTrail quand le GPS detecte que l'utilisateur a parcouru > 80% du sentier
- `app/src/hooks/useGPSTracking.ts` — ajouter le calcul de pourcentage de trace parcourue

**Sous-taches** :
1. Ajouter `@turf/nearest-point-on-line` pour calculer la progression sur le sentier
2. Dans useGPSTracking, calculer le % de trace parcouru en temps reel
3. Quand % > 80%, proposer la validation (bouton + confirmation)
4. Sur validation, INSERT dans user_activities et mettre a jour le progressStore
5. Tester avec un sentier court

**Package** : `npm install @turf/nearest-point-on-line @turf/length @turf/line-slice`

---

### Recapitulatif Sprint 1 — TERMINE (nuit 18-19 mars 2026)

| # | Tache | Temps | Fichiers | Statut |
|---|-------|-------|----------|--------|
| 1 | OSRM foot | 5 min | useRouting.ts | FAIT |
| 2 | Carte topo | 30 min | map.ts, BaseMap.tsx, MapScreen.tsx | FAIT |
| 3 | React.memo listes | 30 min | TrailCard.tsx + 4 ecrans | FAIT |
| 4 | Meteo enrichie | 1h | useWeather.ts, WeatherWidget.tsx | FAIT |
| 5 | Profil elevation | 2h | useElevation.ts (new), ElevationProfile.tsx (new), TrailDetailScreen.tsx | FAIT |
| 6 | Supprimer console.log | 5 min | useNotifications.ts, RegisterScreen.tsx | FAIT |
| 7 | Traces Supabase | 1h | JSON bundle local trails.json | FAIT (bundle local au lieu de script migration) |
| 8 | Fix cluster tap | 1h | TrailMarkers.tsx, MapScreen.tsx | FAIT |
| 9 | Gamification vivante | 2h | progressStore.ts, NavigationScreen.tsx, useGPSTracking.ts | FAIT |
| **TOTAL** | | **~8h** | | **9/9** |

---

### Ce qui NE fait PAS partie du Sprint 1 (reporte a Sprint 2+)

- Mode offline cartes (necessite serveur de tuiles PMTiles, infra non disponible)
- Notifications push (necessite FCM + serveur backend)
- RevenueCat/monetisation (pas de compte configure)
- ~~Photos sentiers (moderation requise)~~ — CODE dans Sprint 2 (useTrailPhotos)
- ~~Avis/commentaires (moderation requise)~~ — CODE dans Sprint 2 (useTrailReviews, migration 005)
- Reset mot de passe (Supabase Auth gere, mais pas de domaine email)
- Moderation automatique du contenu utilisateur (requis avant ouverture publique)

Note : Photos sentiers et avis/commentaires ont ete codes pendant la session nuit 18-19 mars (Sprint 2), avec migration 005_reviews_favorites.sql. La moderation reste a implementer.

---

*Document genere le 19 mars 2026 — Sprint 1 termine dans la nuit du 18-19 mars 2026 (9/9 taches)*
