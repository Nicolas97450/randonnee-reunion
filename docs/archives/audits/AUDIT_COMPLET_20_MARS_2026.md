# Audit Complet — Randonnée Réunion App
> Date : 20 mars 2026
> Réalisé par : Claude Code (audit automatisé sur l'ensemble du codebase)

---

## Résumé exécutif

| Catégorie | CRITIQUE | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Sécurité | 3 | 0 | 0 | 0 |
| Supabase / RLS | 1 | 1 | 4 | 4 |
| Hooks (data) | 0 | 3 | 8 | 6 |
| Screens (UI) | 1 | 14 | 19 | 2 |
| Components/Stores | 0 | 3 | 6 | 15 |
| Config/Build | 0 | 2 | 3 | 3 |
| **TOTAL** | **5** | **23** | **40** | **30** |

---

## CRITIQUE (5)

### SEC-1 : Token Mapbox SECRET dans gradle.properties
- **Fichier :** `android/gradle.properties:64`
- **Détail :** `MAPBOX_DOWNLOADS_TOKEN=sk.eyJ...` — token secret commité dans le repo
- **Action :** Révoquer immédiatement, déplacer dans EAS secrets

### SEC-2 : Clé Service Role Supabase dans .env
- **Fichier :** `app/.env:8`
- **Détail :** `SUPABASE_SERVICE_ROLE_KEY=eyJhbG...` — clé super-admin côté client
- **Action :** Régénérer, déplacer côté serveur (Edge Functions)

### SEC-3 : Token Mapbox public sans restrictions
- **Fichier :** `.env`, `gradle.properties`, code source
- **Détail :** Token `pk.eyJ...` utilisable par n'importe qui
- **Action :** Ajouter restrictions domaine/app dans le dashboard Mapbox

### DB-1 : RLS user_activities trop permissif
- **Fichier :** `migration 006`
- **Détail :** Policy changée de "own only" à "viewable by everyone" — fuite GPS/historique
- **Action :** Implémenter policy friends-only

### UI-1 : MapRef null crash potentiel
- **Fichier :** `MapScreen.tsx:287`
- **Détail :** `mapRef.current?.flyTo()` en callback sans garde null
- **Action :** Ajouter vérification null

---

## HIGH (23)

### Hooks
| ID | Fichier | Ligne | Problème |
|---|---|---|---|
| HK-1 | useAvatar.ts | 51, 61 | URL Supabase hardcodée + formData vide |
| HK-2 | useTrailPhotos.ts | 84, 94 | Même problème que HK-1 |
| HK-3 | useSortieChat.ts | 183 | useCallback manque dep `messages` |

### Screens — Mutations sans onError (14)
| ID | Fichier | Mutations concernées |
|---|---|---|
| SC-1 | SortieDetailScreen | joinSortie, updateParticipant (×2), cancelSortie, leaveSortie, sendFriendRequest |
| SC-2 | NavigationScreen | stopSharing, startSharing, reportForm |
| SC-3 | ProfileScreen | createPost (shareProgress) |
| SC-4 | FeedScreen | toggleLike, createComment |
| SC-5 | TrailDetailScreen | uploadPhoto |
| SC-6 | RegisterScreen | signUp |

### Config
| ID | Fichier | Problème |
|---|---|---|
| CF-1 | eas.json:32-33 | ascAppId/appleTeamId = "TODO" |
| CF-2 | package.json:17 | @maplibre/maplibre-react-native inutilisé |

### Supabase
| ID | Fichier | Problème |
|---|---|---|
| DB-2 | 005_*.sql (×3) | 3 migrations numérotées "005" |

---

## MEDIUM (40)

### Hooks (8)
- useAllSorties.ts:36, useSorties.ts:32 — UTC au lieu de fuseau local
- useTrailReports.ts:81 — N+1 queries resolveTrailId
- useOverpassPOI.ts:144 — Pas de timeout fetch
- useLiveShare.ts:31 — liveSession stale en cleanup
- useNotifications.ts:70 — Reminder date passée
- useFriends.ts:53 — Type casting unsafe
- useFeed.ts:224 — Invalidation query trop large

### Stores/Components (6)
- themeStore.ts — Pas de persistence
- offlineStore.ts:107 — Race condition get()
- progressStore.ts:395 — completionTimestamps null
- BaseMap.tsx:13 — Token fallback silencieux
- badges.ts, challenges.ts — Couleurs hardcodées
- useTrailTrace.ts — console.warn en production

### Screens (19)
- Voir détail dans rapport complet agents

### Supabase (4)
- Buckets trail_photos/reports non créés
- post_likes sans index user_id
- post_comments sans policy UPDATE
- trail_reports sans policy UPDATE

---

## LOW (30)
- Tables mortes : user_emergency_contacts, trail_conditions, map_zones
- Realtime non activé sur post_comments, post_likes
- `as any` dans 3 fichiers
- .env.example référence PostHog/RevenueCat non intégrés
- `.catch(() => {})` masquant erreurs AsyncStorage
- Et 25 autres issues mineures détaillées dans les rapports d'agents

---

## Bugs corrigés pendant l'audit

1. **Scroll TrailDetailScreen** — Restructuré : tout le contenu dans ScrollView + stickyHeaderIndices pour tabBar collant + zIndex:10 sur stickyBottomBar ✅
2. **Boutons accepter/refuser** — Remplacé Pressable par TouchableOpacity + fix layout flex (en cours de test)

---

## Plan d'action

| Priorité | Action | Effort |
|---|---|---|
| P0 | Révoquer token Mapbox sk., régénérer, EAS secrets | 15 min |
| P0 | Régénérer clé Service Role Supabase | 10 min |
| P0 | Restrictions token public Mapbox | 5 min |
| P0 | Corriger RLS user_activities | 20 min |
| P1 | Remplacer fetch hardcodé par supabase.storage.upload() | 30 min |
| P1 | Ajouter onError sur toutes les mutations | 1h |
| P1 | Renuméroter migrations 005 | 10 min |
| P1 | Fix useSortieChat stale closure | 5 min |
| P2 | Fix timezone UTC→local | 15 min |
| P2 | Persister themeStore | 15 min |
| P2 | Créer buckets storage + indexes | 20 min |
| P2 | Wrap console.warn dans __DEV__ | 5 min |
| P3 | Cleanup tables mortes, dep maplibre, as any | 30 min |
