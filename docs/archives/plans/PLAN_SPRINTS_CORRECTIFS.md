# PLAN DE SPRINTS CORRECTIFS — POST-AUDIT V2
> Date : 20 mars 2026
> Ref audit : `docs/AUDIT_COMPLET_V2_20_MARS_2026.md`
> **71 issues** (9 CRITIQUE, 21 HAUTE, 30 MOYENNE, 7 FAIBLE)
> A la fin : relancer l'audit via `docs/PROMPT_AUDIT_TEMPLATE.md`

---

## Vue d'ensemble

| Sprint | Focus | Issues | Duree estimee |
|---|---|---|---|
| Sprint A | Blockers critiques — Stabilite & GPS | 8 issues | ~2-3h |
| Sprint B | RLS & Policies — Securite base | 12 issues | ~3-4h |
| Sprint C | GPS & Navigation — Fiabilite terrain | 8 issues | ~2-3h |
| Sprint D | Social & Anti-abus | 8 issues | ~3-4h |
| Sprint E | Gamification serveur | 4 issues | ~3-4h |
| Sprint F | Qualite du code — Hooks & Mutations | 9 issues | ~2-3h |
| Sprint G | UX & Polish | 11 issues | ~2-3h |
| Sprint H | RGPD & Legal | 5 issues | ~2h |
| Sprint I | Deploiement & Monitoring | 6 issues | ~2-3h |
| AUDIT FINAL | Re-audit complet avec template | - | ~1h |

**Total estime : ~25-30h de vibe coding**

---

## SPRINT A — BLOCKERS CRITIQUES (Stabilite & GPS)
> Rien ne peut avancer tant que ces issues ne sont pas resolues.

### A1. Fix memory leaks Realtime [CODE-01] [CODE-02] [CODE-08]
**Fichiers :** `useInAppNotifications.ts`, `useDirectMessages.ts`, `useSortieChat.ts`
**Actions :**
- Memoiser `enqueue` avec `useCallback` dans useInAppNotifications
- Retirer `queryClient` des deps useEffect dans useDirectMessages
- Ajouter `supabase.removeChannel()` dans le cleanup de chaque useEffect
- Fix useSortieChat : ref stable pour channel, validate userInfoRef, cleanup lastChannelRef

### A2. Ajouter Error Boundary global [UX-01]
**Fichiers :** `App.tsx`, nouveau `src/components/ErrorBoundary.tsx`
**Actions :**
- Creer composant ErrorBoundary (class component React)
- UI fallback : message d'erreur + bouton "Reessayer"
- Wrapper NavigationContainer dans App.tsx

### A3. Fix formule distance NavigationScreen [CARTE-01]
**Fichiers :** `NavigationScreen.tsx:254-262`
**Actions :**
- Remplacer coefficients fixes par `haversineDistance()` de `lib/geo.ts`

### A4. Filtrage precision GPS [GPS-01]
**Fichiers :** `useGPSTracking.ts:72-91`
**Actions :**
- Rejeter points avec `accuracy > 20`
- Filtre vitesse max 15 km/h entre 2 points
- Appliquer dans background task ET foreground

### A5. Fix race condition buffer GPS [CODE-03]
**Fichiers :** `useGPSTracking.ts:65-67`
**Actions :**
- Copie + clear atomique dans le sync timer
- Ou AsyncStorage comme intermediaire

### A6. npm audit fix [CODE-06]
**Actions :** `npm audit fix` pour flatted

### A7. Fix Mapbox token failure silencieuse [CARTE-03]
**Fichiers :** `BaseMap.tsx:13-17`
**Actions :**
- Si token absent : throw Error (attrapee par ErrorBoundary) au lieu de console.error
- Wrapper console.error dans `if (__DEV__)` [UX-11]

### A8. Fix auth store race condition [CODE-10]
**Fichiers :** `authStore.ts:59-94`
**Actions :**
- Configurer onAuthStateChange AVANT le set state dans initialize()

**DoD Sprint A :**
- [ ] 0 memory leak Realtime
- [ ] ErrorBoundary attrape crashes
- [ ] Distance correcte (Haversine)
- [ ] GPS filtre par precision
- [ ] 0 npm vulns haute

---

## SPRINT B — RLS & POLICIES (Securite base)
> Securiser la BDD avant d'exposer l'app.

### B1. Fix RLS posts friends visibility [SEC-02]
**Migration :** `014_rls_security_fixes.sql`
- DROP + CREATE policy avec check friendships pour visibility='friends'

### B2. Fix RLS live_tracking [SEC-03]
**Migration :** `014_rls_security_fixes.sql`
- Restreindre aux amis acceptes OU own user_id

### B3. Ajouter DELETE policies [SEC-04]
**Migration :** `014_rls_security_fixes.sql`
- DELETE sur user_profiles : `USING (auth.uid() = id)`
- DELETE sur sortie_messages : `USING (auth.uid() = user_id)`
- UPDATE sur sortie_messages : `USING (auth.uid() = user_id)`

### B4. Fix RLS commentaires [SEC-07]
**Migration :** `014_rls_security_fixes.sql`
- Remplacer USING(true) par check visibility post parent

### B5. Fix sortie_participants UPDATE policy [SEC-09]
**Migration :** `014_rls_security_fixes.sql`
- Ajouter policy participants UPDATE own status

### B6. Fix conversations RLS apres unfriend [SEC-11]
**Migration :** `014_rls_security_fixes.sql`
- Check friendship actif dans policy SELECT direct_messages

### B7. Fix FK inconsistantes [DB-01]
**Migration :** `014_rls_security_fixes.sql`
- Changer FK conversations, direct_messages, post_comments de auth.users vers user_profiles(id) ON DELETE CASCADE

### B8. Ajouter index manquants [DB-02]
**Migration :** `014_rls_security_fixes.sql`
- user_activities(trail_id)
- friendships(status, requester_id, addressee_id)
- posts(user_id, visibility, created_at DESC)

### B9. Supprimer migration dupliquee [DB-03]
- Comparer 005a et 013, garder plus recente

### B10. Storage validation type fichier [SEC-10]
- Valider MIME type (jpeg/png/webp) cote client dans useAvatar et useTrailPhotos avant upload

### B11. Trigger validation sortie message auteur [DB-06]
**Migration :** `014_rls_security_fixes.sql`
- Trigger check user est participant ou organisateur avant INSERT

### B12. Confirmer regeneration service_role key [SEC-05]
- Verifier dashboard Supabase
- Configurer restrictions Mapbox

**DoD Sprint B :**
- [ ] RLS teste : posts friends, live_tracking, delete, commentaires, participants, conversations
- [ ] FK coherentes (user_profiles)
- [ ] Index crees
- [ ] Upload valide type fichier

---

## SPRINT C — GPS & NAVIGATION (Fiabilite terrain)
> Le GPS est critique pour la securite physique.

### C1. Fix detection hors-sentier [GPS-02]
**Fichiers :** `useOffTrailAlert.ts:13-20`
- Implementer pointToLineSegmentDistance() avec projection perpendiculaire

### C2. Chiffrer backup GPS [SEC-06]
**Fichiers :** `useGPSTracking.ts:190-206`
- Remplacer AsyncStorage par SecureStore (ou chiffrer avant write)
- try/catch robuste autour de JSON.stringify
- Gerer limite SecureStore (compresser si trace longue)

### C3. Fix auto-validation 80% [GPS-03]
**Fichiers :** `NavigationScreen.tsx:538-546`
- A 80%+ : auto-valider apres countdown 3s ou loguer que 80% atteint

### C4. Unifier cooldowns hors-sentier [GPS-04]
**Fichiers :** `useOffTrailAlert.ts`, `useVoiceGuidance.ts`
- Constante partagee `OFF_TRAIL_ALERT_COOLDOWN_MS = 60000`

### C5. Fix backup GPS async non await
**Fichiers :** `useGPSTracking.ts:190-206`
- Ajouter .catch() sur AsyncStorage/SecureStore avec log

### C6. Fix altitude smoothing bias [GPS-05]
**Fichiers :** `useGPSTracking.ts:97-108`
- Padding des extremites ou Savitzky-Golay

### C7. Fix elevation profile fallback null [GPS-09]
**Fichiers :** `HikeSummaryScreen.tsx:142-149`
- Si altitude null partout : message "Donnees altitude non disponibles"

### C8. Ajuster GPS interval/distance [GPS-06]
**Fichiers :** `useGPSTracking.ts:54-56`
- Tester et ajuster (suggestion: 2s/10m)

**DoD Sprint C :**
- [ ] Detection hors-sentier precise (point-a-ligne)
- [ ] Backup GPS chiffre
- [ ] Cooldowns unifies
- [ ] Fallback elevation

---

## SPRINT D — SOCIAL & ANTI-ABUS
> Prerequis stores : politique anti-harcelement.

### D1. Table blocked_users + UI blocage [SOC-01]
**Migration :** `015_social_security.sql`
**Fichiers :** Nouveau `useBlockedUsers.ts`, modifications `UserProfileScreen.tsx`
- Table blocked_users(user_id, blocked_user_id) UNIQUE + RLS
- Hook block/unblock/isBlocked
- Bouton "Bloquer" sur UserProfileScreen
- Filtrer bloques dans : feed, recherche, DMs, notifications, friend requests

### D2. Rate limiting DMs et friend requests [SOC-02]
**Fichiers :** `useDirectMessages.ts`, `useFriends.ts`
- Ref timestamps, max 5 msgs/min, max 10 friend requests/jour
- Alert "Attends un peu" si rate limit

### D3. Enforce profil prive [SOC-04]
**Fichiers :** `UserProfileScreen.tsx`, `FeedScreen.tsx`
- Check is_private. Si prive et non-ami : ecran "Profil prive"

### D4. Moderation basique contenu [SOC-03]
**Fichiers :** Nouveau `lib/moderation.ts`
- Liste mots interdits francais
- Filtrer avant INSERT posts et messages

### D5. Conversation permission check [SOC-05]
**Fichiers :** `ConversationScreen.tsx`
- Verifier user est user1_id ou user2_id
- Si non : redirect vers InboxScreen

### D6. Persister notifications en base [SOC-06]
**Migration :** `015_social_security.sql`
- Table notifications(user_id, type, title, body, read_at, data, created_at) + RLS
- Persister au lieu de state-only

### D7. Preferences de notification [SOC-07]
- Table notification_preferences + check avant enqueue

### D8. Validation longueur message client [SOC-08]
**Fichiers :** `useDirectMessages.ts`
- Valider longueur max cote client avant INSERT

**DoD Sprint D :**
- [ ] Blocage fonctionnel
- [ ] Rate limit DMs et friends
- [ ] Profil prive enforce
- [ ] Moderation basique
- [ ] Notifications persistees

---

## SPRINT E — GAMIFICATION SERVEUR
> Anti-triche — deplacer logique serveur.

### E1. RPC validate_and_complete_trail [SEC-01] [GAM-01]
**Migration :** `016_server_validation.sql`
- RPC verifie : trail existe, pas de doublon, duree min >10min
- Insere dans user_activities ET retourne XP
- Retirer INSERT direct sur user_activities pour users normaux

### E2. RPC compute_user_xp [GAM-01]
**Migration :** `016_server_validation.sql`
- COUNT * 100 + SUM(distance) * 10 + SUM(elevation) * 0.5
- Utiliser dans loadProgress

### E3. RPC get_user_zone_progress [GAM-01]
**Migration :** `016_server_validation.sql`
- Retourne (zone_slug, completed_count, total_count) par zone
- Client affiche mais ne calcule plus

### E4. Streak timezone UTC+4 + backup serveur [GAM-02] [GAM-03]
**Fichiers :** `progressStore.ts:63-86, 246-257`
- Forcer Indian/Reunion
- Backup streaks dans table user_stats Supabase

**DoD Sprint E :**
- [ ] Completion par RPC serveur
- [ ] XP serveur-side
- [ ] Zones serveur-side
- [ ] Streaks UTC+4 + backup DB
- [ ] INSERT direct bloque

---

## SPRINT F — QUALITE DU CODE (Hooks & Mutations)
> Stabiliser les hooks et la gestion d'erreurs.

### F1. Fix erreurs generiques mutations [CODE-09]
**Fichiers :** `useSorties.ts:135-217`, `useLiveShare.ts:73-120`
- Logger erreur complete
- Passer message Supabase specifique a l'utilisateur
- Fix echecs silencieux useLiveShare

### F2. Fix useVoiceGuidance code mort [CODE-11]
**Fichiers :** `useVoiceGuidance.ts:125-142`
- Supprimer effet dead code (125-130)
- Simplifier effet duplique

### F3. Remplacer Record<string,unknown> par types stricts [CODE-12]
**Fichiers :** `useSorties.ts:63`, `useAllSorties.ts:110`, `useFeed.ts`
- Definir interfaces : SortieParticipant, PostWithDetails, etc.

### F4. Fix useAvatar catch manquant [CODE-13]
**Fichiers :** `useAvatar.ts:15-22`
- Ajouter .catch() avec log

### F5. Fix useLeaderboard type guard [CODE-14]
**Fichiers :** `useLeaderboard.ts:74-100`
- Enforcer type retour coherent dans RPC

### F6. Fix cache coherence 7 jours [CODE-15]
**Fichiers :** `useSupabaseTrails.ts`, `useOverpassPOI.ts`
- Invalidation par mutation ou cache headers serveur

### F7. Fix progress store refresh loop [CODE-16]
**Fichiers :** `progressStore.ts:402`
- Update incrementiel au lieu de reload complet apres validation

### F8. Pagination messages chat et DM [CODE-04 suite]
**Fichiers :** `useSortieChat.ts`, `useDirectMessages.ts`
- 50 messages initiaux + cursor-based "Charger precedents"

### F9. Fix N+1 + pagination feed [CODE-04] [CODE-05]
**Fichiers :** `useFeed.ts`
- Subqueries Supabase posts+like_count+comment_count
- Cursor-based infinite scroll

**DoD Sprint F :**
- [ ] Mutations avec messages specifiques
- [ ] 0 code mort
- [ ] Types stricts partout
- [ ] Feed pagine + N+1 elimine
- [ ] Messages pagines

---

## SPRINT G — UX & POLISH
> Experience professionnelle sur tous les ecrans.

### G1. HomeScreen dans les onglets [UX-02]
**Fichiers :** `RootTabs.tsx`
- Ajouter Tab.Screen HomeTab OU fusionner avec MapScreen

### G2. Etats vides tous ecrans [UX-03]
**Fichiers :** `HomeScreen.tsx`, `FeedScreen.tsx`, `FriendsScreen.tsx`, `InboxScreen.tsx`
- Messages encourageants + CTA pour chaque ecran vide

### G3. TrailDetailScreen fallback [UX-04]
**Fichiers :** `TrailDetailScreen.tsx:50-70`
- "Sentier introuvable" + bouton retour

### G4. Username validation [SEC-08]
**Fichiers :** `authStore.ts:12-34`, `lib/formatters.ts`
- sanitizeUsername() : caracteres, longueur 3-20, mots reserves

### G5. MapScreen FlatList perf [UX-05]
**Fichiers :** `MapScreen.tsx:464-474`
- removeClippedSubviews, initialNumToRender, maxToRenderPerBatch

### G6. MapScreen BottomSheet error/loading [UX-06]
**Fichiers :** `MapScreen.tsx:475-522`
- Fallback UI si selectedTrail data manquante

### G7. SortieChat retry avec check reseau [UX-08]
**Fichiers :** `SortieChat.tsx:35-58`
- Integrer useNetInfo avant retry

### G8. Sortie chat participant visibility [SOC-09]
**Fichiers :** `useSortieChat.ts:40-44`
- Verifier cote client que user est participant accepte

### G9. Accessibilite labels manquants [UX divers]
**Fichiers :** `MapScreen.tsx`, `HomeScreen.tsx`, `SettingsScreen.tsx`
- accessibilityLabel sur boutons/toggles manquants

### G10. Notifications mark-as-read feedback [UX-07]
**Fichiers :** `NotificationsScreen.tsx`
- Toast ou indicateur visuel apres markAllRead

### G11. ProfileScreen goal tooltips [UX-10]
**Fichiers :** `ProfileScreen.tsx:353-382`
- accessibilityHint quand boutons desactives

**DoD Sprint G :**
- [ ] HomeScreen accessible
- [ ] Etats vides partout
- [ ] Accessibility labels complets
- [ ] Fallbacks UI sur erreurs

---

## SPRINT H — RGPD & LEGAL
> Conformite avant soumission stores.

### H1. Mettre a jour politique confidentialite [RGPD-01] [RGPD-02]
**Fichiers :** `politique-confidentialite.html`
- Corriger : live_tracking, DMs, notifications, blocage
- Coherence avec code apres tous les sprints precedents

### H2. Implementer suppression de compte [RGPD-03]
- Edge Function delete-account avec cascade
- Confirmation double dans SettingsScreen

### H3. Documenter transferts hors EU [RGPD-05]
- Section "Transferts internationaux" : Mapbox, Open-Meteo, OSRM

### H4. Permission POST_NOTIFICATIONS [DEPLOY-04]
**Fichiers :** `app.json`
- Ajouter permission Android

### H5. Documenter provenance donnees sentiers [CARTE-02]
- Verifier provenance des donnees geographiques publiques
- Documenter dans SECURITE_RGPD.md

**DoD Sprint H :**
- [ ] Politique coherente
- [ ] Suppression compte fonctionnelle
- [ ] Transferts documentes
- [ ] POST_NOTIFICATIONS ajoute

---

## SPRINT I — DEPLOIEMENT & MONITORING
> Derniers preparatifs.

### I1. Integrer Sentry [DEPLOY-02]
- `npx expo install @sentry/react-native`
- Sentry.init() + connecter ErrorBoundary

### I2. Reduire taille APK [DEPLOY-03]
- ProGuard/R8, split trails.json, compresser assets
- Cible <100MB

### I3. Config EAS complete [DEPLOY-01]
- Apple Team ID, App ID, serviceAccountKeyPath
- Note : necessite comptes Apple (99$/an) + Google (25$) par Nicolas

### I4. EAS Secrets production
- Migrer variables .env vers EAS Secrets

### I5. Data Safety Section / App Privacy [DEPLOY-05 partiel]
- Documenter pour Google Play et Apple

### I6. Soft delete + Realtime cleanup [DB-04] [DB-05]
- Ajouter deleted_at sur posts et direct_messages
- Desactiver Realtime sur post_likes

**DoD Sprint I :**
- [ ] Sentry fonctionnel
- [ ] APK < 100MB
- [ ] EAS configure
- [ ] Data Safety documente

---

## ISSUES BACKLOG (post-beta, non bloquantes)

Ces issues sont FAIBLE ou de type "amelioration future". Elles seront adressees apres la beta :

| ID | Titre | Severite |
|---|---|---|
| GPS-07 | OSRM throttling 30s | FAIBLE |
| GPS-08 | Douglas-Peucker tolerance hardcodee | FAIBLE |
| CARTE-04 | Clustering perf metrics | FAIBLE |
| UX-09 | InAppNotifications auto-dismiss timing | FAIBLE |
| DB-07 | Activity details join non pagine | MOYENNE |
| DEPLOY-05 | Analytics (Mixpanel/Amplitude) | MOYENNE |
| RGPD-04 | Chiffrement E2E des DMs | HAUTE (post-beta) |

---

## AUDIT FINAL — RE-AUDIT COMPLET

### Procedure
1. Copier le prompt depuis `docs/PROMPT_AUDIT_TEMPLATE.md`
2. Lancer l'audit complet
3. Comparer scores avec audit V2

### Objectifs post-sprints

| Domaine | Score V2 | Objectif |
|---|---|---|
| Securite applicative | 4/10 | **8/10** |
| Conformite RGPD/CNIL | 6/10 | **9/10** |
| Qualite du code | 5/10 | **8/10** |
| UX / Interface | 7/10 | **9/10** |
| Carte & Sentiers | 7/10 | **8/10** |
| GPS & Navigation | 5/10 | **8/10** |
| Fonctionnalites sociales | 4/10 | **8/10** |
| Gamification | 4/10 | **8/10** |
| Backend & BDD | 6/10 | **9/10** |
| Preparation deploiement | 4/10 | **7/10** |
| **Global** | **5.2/10** | **8.2/10** |

### Criteres de succes
- [ ] 0 issue CRITIQUE restante
- [ ] 0 issue HAUTE restante
- [ ] Score global >= 8/10
- [ ] App publiable en beta privee

---

## CHECKLIST COMPLETE (71 issues → sprint)

### CRITIQUE (9)
| ID | Sprint | Titre |
|---|---|---|
| SEC-01 | E1 | Validation sentiers client-side |
| SEC-02 | B1 | RLS posts friends |
| SEC-03 | B2 | live_tracking public |
| SEC-04 | B3 | DELETE policies manquantes |
| CODE-01 | A1 | Memory leak useInAppNotifications |
| CODE-02 | A1 | Memory leak useDirectMessages |
| UX-01 | A2 | Pas d'Error Boundary |
| RGPD-01 | H1 | Contradiction politique GPS |
| DEPLOY-01 | I3 | EAS config TODO |

### HAUTE (21)
| ID | Sprint | Titre |
|---|---|---|
| SEC-05 | B12 | .env secrets / service_role |
| SEC-06 | C2 | GPS backup non chiffre |
| SEC-09 | B5 | sortie_participants UPDATE policy |
| SEC-11 | B6 | Conversations RLS apres unfriend |
| RGPD-02 | H1 | DMs non mentionnes politique |
| RGPD-03 | H2 | Suppression compte non fonctionnelle |
| RGPD-04 | Backlog | DMs non chiffres (post-beta) |
| CODE-03 | A5 | Race condition GPS buffer |
| CODE-04 | F8-F9 | Pas de pagination |
| CODE-05 | F9 | N+1 queries feed |
| CODE-08 | A1 | Memory leak useSortieChat |
| CODE-09 | F1 | Erreurs generiques mutations |
| UX-02 | G1 | HomeScreen pas dans onglets |
| CARTE-01 | A3 | Formule distance erronee |
| GPS-01 | A4 | Pas de filtrage precision |
| GPS-02 | C1 | Hors-sentier point-a-point |
| SOC-01 | D1 | Pas de blocage utilisateur |
| SOC-02 | D2 | Pas de rate limiting |
| SOC-05 | D5 | Conversation permission check |
| DB-01 | B7 | FK inconsistantes |
| DEPLOY-02 | I1 | Pas de Crashlytics |
| DEPLOY-03 | I2 | APK 170MB |

### MOYENNE (30)
| ID | Sprint | Titre |
|---|---|---|
| SEC-07 | B4 | Commentaires publics |
| SEC-08 | G4 | Username non valide |
| SEC-10 | B10 | Storage pas de validation type |
| RGPD-05 | H3 | Transferts hors EU |
| CODE-06 | A6 | npm audit flatted |
| CODE-10 | A8 | Auth store race condition |
| CODE-11 | F2 | useVoiceGuidance code mort |
| CODE-12 | F3 | Record<string,unknown> au lieu de types |
| CODE-13 | F4 | useAvatar catch manquant |
| CODE-14 | F5 | useLeaderboard type guard |
| CODE-15 | F6 | Cache coherence 7 jours |
| CODE-16 | F7 | Progress store refresh loop |
| UX-03 | G2 | Etats vides |
| UX-04 | G3 | TrailDetail ecran blanc |
| UX-05 | G5 | MapScreen FlatList perf |
| UX-06 | G6 | BottomSheet error/loading |
| UX-08 | G7 | SortieChat retry reseau |
| UX-11 | A7 | Console.error production |
| CARTE-02 | H5 | Provenance donnees sentiers |
| CARTE-03 | A7 | Mapbox token failure silencieuse |
| GPS-03 | C3 | Auto-validation 80% |
| GPS-04 | C4 | Cooldowns incoherents |
| SOC-03 | D4 | Pas de moderation |
| SOC-04 | D3 | Profil prive non enforce |
| SOC-06 | D6 | Notifications non persistees |
| SOC-07 | D7 | Pas de preferences notification |
| SOC-09 | G8 | Sortie chat participant visibility |
| DB-02 | B8 | Index manquants |
| DB-04 | I6 | Pas de soft delete |
| DB-05 | I6 | Realtime trop de tables |
| DB-06 | B11 | Sortie message trigger FK |
| DEPLOY-04 | H4 | POST_NOTIFICATIONS manquante |
| DEPLOY-05 | Backlog | Pas d'analytics |

### FAIBLE (7)
| ID | Sprint | Titre |
|---|---|---|
| DB-03 | B9 | Migration dupliquee |
| GPS-05 | C6 | Altitude smoothing bias |
| GPS-06 | C8 | GPS interval/distance conflict |
| GPS-07 | Backlog | OSRM throttling 30s |
| GPS-08 | Backlog | Douglas-Peucker hardcode |
| GPS-09 | C7 | Elevation null handling |
| CARTE-04 | Backlog | Clustering perf metrics |
| UX-07 | G10 | Notifications mark-as-read |
| UX-09 | Backlog | Auto-dismiss timing |
| UX-10 | G11 | Goal buttons tooltip |
| SOC-08 | D8 | Message length client |
| DB-07 | Backlog | Activity join non pagine |

### POSITIF (4)
| ID | Note |
|---|---|
| CODE-07 | 0 TODO/FIXME/HACK |
| AUTH+ | Token storage secure (expo-secure-store) |
| OAUTH+ | OAuth2 flow correctement implemente |
| STORAGE+ | Policies storage restrictives (OK) |
