# TRANSFORMATION APP — Vision "Cador"
> Date : 19 mars 2026
> Objectif : Passer de "app qui marche" a "app de reference pour la rando a La Reunion"
> Benchmark : Strava, AllTrails, Komoot, Relive

---

## Diagnostic honnete

### Ce qui marche
- 710 sentiers avec traces GPS reelles — asset unique
- Stack technique solide
- Features sociales implementees
- Build local autonome

### Ce qui NE marche PAS (teste)
1. **Clusters** : tap ne fonctionne PAS sur Android (bug MapLibre)
2. **Likes** : le bouton j'aime ne reagit pas (probable RLS ou erreur silencieuse)
3. **Carte en navigation** : trop petite, pas de mode plein ecran
4. **Retour fiche sentier** : toujours des problemes selon le contexte de navigation

### Ce qui MANQUE pour etre au niveau des cadors
1. **Parcours 3D** type Relive/Strava — replay de la rando en 3D
2. **Carte plein ecran** en navigation avec gestes fluides
3. **Clusters fonctionnels** — indispensable pour naviguer 710 sentiers
4. **Experience utilisateur** — trop de frictions, pas assez intuitif

---

## Plan de transformation

### PHASE 1 : Fixer ce qui est CASSE (aujourd'hui)

#### 1.1 Clusters — Solution definitive
Le `onPress` sur `ShapeSource` ne marche PAS sur Android pour les clusters.

**Solution** : NE PAS compter sur onPress. Implementer un `onPress` sur la `MapView` directement, puis utiliser `queryRenderedFeaturesAtPoint()` pour identifier ce qui est sous le doigt.

```typescript
// Dans MapView.onPress
const handleMapPress = async (event) => {
  const { screenPointX, screenPointY } = event.properties;
  const features = await mapViewRef.current.queryRenderedFeaturesAtPoint(
    [screenPointX, screenPointY],
    null, // pas de filtre de layer
    ['trail-cluster-circles', 'trail-start-circles'] // IDs des layers
  );

  if (features.features.length > 0) {
    const feature = features.features[0];
    if (feature.properties.cluster) {
      // Zoom sur le cluster
      const expansionZoom = await shapeSourceRef.current.getClusterExpansionZoom(feature);
      flyTo(feature.geometry.coordinates, expansionZoom);
    } else {
      // Ouvrir le sentier
      handleTrailPress(feature.properties.slug);
    }
  }
};
```

**Prerequis** : MapLibre RN doit exposer `queryRenderedFeaturesAtPoint` sur le `MapView`. Verifier la doc de `@maplibre/maplibre-react-native` v10.

**Alternative si ca ne marche pas** : Intercepter le geste natif via `Gesture Handler` et calculer manuellement quel cluster est sous le doigt en comparant les coordonnees du tap avec les features du GeoJSON.

#### 1.2 Likes — Fix
Le toggle like echoue silencieusement. Causes possibles :
- RLS sur post_likes qui bloque l'INSERT/DELETE avec la cle anon sans auth
- Pas de gestion d'erreur dans useToggleLike (pas de onError)

**Fix** :
1. Ajouter `onError` dans la mutation pour afficher une alerte
2. Verifier les RLS de post_likes dans Supabase dashboard
3. Ajouter un optimistic update (le coeur change immediatement, revert si erreur)

#### 1.3 Carte navigation — Mode plein ecran
La carte en NavigationScreen est coincee entre le header et le bottom panel.

**Fix** :
- Ajouter un bouton "plein ecran" (icone expand) sur la carte
- Au tap : le header et le bottom panel disparaissent (animated), la carte prend 100% de l'ecran
- Un bouton "reduire" en overlay pour revenir au mode normal
- Geste swipe-down pour reduire aussi
- Utiliser `Animated.View` avec `height` interpolee pour les transitions fluides

#### 1.4 Bouton retour sentier — Fix definitif
Verifier dans le dernier build si le custom headerLeft fonctionne.
Si non : ajouter un bouton retour DANS le contenu de la page (pas dans le header), style Floating Action Button en haut a gauche.

---

### PHASE 2 : Monter de niveau (aujourd'hui)

#### 2.1 Replay parcours 3D (type Relive/Strava)
Apres avoir termine une rando, l'utilisateur peut voir un replay de son parcours.

**Options techniques :**
1. **Mapbox GL JS 3D** (web) — terrain 3D avec la trace animee. Mais c'est web, pas natif.
2. **react-native-maps-mapbox** — Mapbox SDK natif avec support 3D terrain. Payant.
3. **Three.js / React Three Fiber** dans une WebView — generer un terrain 3D avec la trace.
4. **Relive API** — integraton directe avec Relive.cc pour generer la video 3D. Necessite un compte.

**Recommandation pour V1** : Pas de vrai 3D terrain (trop lourd). A la place :
- **Replay 2D anime** : la trace s'anime progressivement sur la carte, un marqueur parcourt le sentier
- **Stats animees** : altitude, distance, vitesse se mettent a jour pendant le replay
- C'est ce que fait Strava dans sa version gratuite (le vrai 3D est premium)

**Implementation** :
- Nouveau composant `TrailReplayScreen.tsx`
- Utiliser `Animated` pour deplacer un marqueur le long de la trace
- Slider pour controler la progression
- Stats en temps reel (altitude, distance cumulee, vitesse)
- Bouton "Partager" qui genere un screenshot avec les stats

#### 2.2 Sauvegarde et historique des randos
Actuellement quand on arrete le GPS, on peut valider le sentier mais la TRACE est perdue.

**Ce qu'il faut** :
- Sauvegarder la trace GPS complete dans `user_activities` (en GeoJSON)
- Ecran "Mes randonnees" avec l'historique
- Chaque rando : carte avec la trace, stats, date, duree
- Export GPX de chaque rando
- C'est LE feature qui fait revenir les utilisateurs (comme Strava)

#### 2.3 Ameliorer l'experience de la carte
- **Pinch to zoom** : deja gere par MapLibre nativement
- **Double tap zoom** : gere nativement aussi
- **Bouton "ma position"** : recentre sur le GPS
- **Mode suivi** : la carte suit le GPS automatiquement pendant la rando
- **Rotation** : la carte tourne dans le sens de la marche

---

### PHASE 3 : Vision "Cador" (futur)

#### 3.1 Vrai replay 3D terrain
Utiliser les tuiles terrain 3D (MapTiler terrain-RGB ou Mapbox terrain v2) pour un vrai rendu 3D avec la trace qui survole le paysage. Comme Relive mais integre dans l'app.

#### 3.2 Stats avancees type Strava
- Tableau de bord hebdomadaire/mensuel
- Distance cumulee, D+ cumule, temps total
- Records personnels (plus longue rando, plus gros D+)
- Graphiques d'evolution

#### 3.3 Classement communautaire
- Leaderboard par nombre de sentiers completes
- Leaderboard par D+ cumule
- Challenges mensuels ("Completez 5 sentiers ce mois-ci")

---

## APIs et outils a integrer

| Outil | Usage | Cout | Priorite |
|-------|-------|------|----------|
| MapLibre `queryRenderedFeaturesAtPoint` | Fix clusters | Gratuit | HAUTE |
| `Animated` React Native | Replay 2D, transitions carte | Gratuit | HAUTE |
| `react-native-share` | Partage screenshots, GPX | Gratuit | HAUTE |
| `@turf/along` + `@turf/length` | Animation replay le long de la trace | Gratuit | HAUTE |
| MapTiler terrain-RGB | Replay 3D (Phase 3) | Gratuit < 100k req | BASSE |
| Strava API (export) | Import/export de randonnees | Gratuit | MOYENNE |

---

## Ordre d'execution aujourd'hui

1. Fix clusters (queryRenderedFeaturesAtPoint)
2. Fix likes (erreur silencieuse + optimistic update)
3. Carte plein ecran en navigation
4. Sauvegarde trace GPS complete (historique)
5. Replay 2D anime de la rando
6. Bouton retour definitif

---

*Document cree le 19 mars 2026*
