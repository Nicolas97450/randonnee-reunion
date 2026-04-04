# AUDIT COMPLET V2 — RANDONNEE REUNION
> Date : 20 mars 2026 | Auditeur : Claude Code (Opus 4.6)
> Mode : Lecture seule — aucun fichier modifie
> **71 issues identifiees** (9 CRITIQUE, 21 HAUTE, 30 MOYENNE, 7 FAIBLE, 4 POSITIF)

---

## SYNTHESE EXECUTIVE

### Scores de maturite par domaine (sur 10)

| Domaine | Score | Commentaire |
|---|---|---|
| Securite applicative | **4/10** | Secrets exposes, RLS incomplet, validation client-only |
| Conformite RGPD/CNIL | **6/10** | Docs legales presentes mais contradiction GPS, DM non mentionnes |
| Qualite du code | **5/10** | Memory leaks Realtime, pas de pagination, race conditions |
| UX / Interface | **7/10** | Bonne structure, etats vides manquants, pas d'Error Boundary |
| Carte & Sentiers | **7/10** | 710 sentiers fonctionnels, clustering OK, formule distance erronee |
| GPS & Navigation | **5/10** | Tracking background OK, mais drift non filtre, hors-sentier imprecis |
| Fonctionnalites sociales | **4/10** | DM en clair, pas de blocage utilisateur, pas de rate limiting |
| Gamification | **4/10** | Toute la logique client-side = trichiable |
| Backend & BDD | **6/10** | RLS present mais incomplet, index manquants, FK inconsistants |
| Preparation deploiement | **4/10** | EAS config incomplete, pas de Crashlytics, APK 170MB |

**Score global : 5.2 / 10**

### Top 5 des problemes les plus urgents

1. **Validation sentiers/XP/badges 100% client-side** — La gamification entiere est trichiable via l'API directe
2. **RLS incomplet** — Posts "amis" visibles par tous, live_tracking expose la position a tous, messages non supprimables
3. **Memory leaks Realtime** — useInAppNotifications, useSortieChat, useDirectMessages re-creent des channels sans cleanup
4. **Politique RGPD contradictoire** — Dit "les traces GPS ne quittent jamais votre appareil" alors que `live_tracking` envoie la position au serveur
5. **Pas d'Error Boundary ni Crashlytics** — Un crash en production est invisible et irrecuperable

### Verdict
**NON PUBLIABLE en l'etat.** Beta privee possible apres ~1 semaine de corrections critiques.

---

## PARTIE 1 : RAPPORT D'AUDIT DETAILLE (71 issues)

---

### DOMAINE 1 — SECURITE APPLICATIVE (11 issues)

#### [SEC-01] Validation des sentiers/XP/badges 100% client-side
**Severite :** CRITIQUE
**Fichier(s) :** `progressStore.ts:339-404`, `badges.ts:254-260`, `challenges.ts:91-237`
**Probleme :** Toute la logique de validation est cote client. L'API accepte un INSERT direct dans user_activities.
**Correction :** RPC Supabase `validate_and_complete_trail` avec verification serveur.

#### [SEC-02] RLS incomplet — Posts "friends" visibles par tous
**Severite :** CRITIQUE
**Fichier(s) :** `004_social.sql:52-56`
**Probleme :** Policy ne gere que `visibility = 'public' OR user_id = auth.uid()`. Friends non gere.
**Correction :** Nouvelle policy avec check friendships.

#### [SEC-03] live_tracking expose la position GPS a tous
**Severite :** CRITIQUE
**Fichier(s) :** `008_live_community.sql:20-24`
**Probleme :** `USING (is_active = true)` — position de TOUS les randonneurs visible.
**Correction :** Restreindre aux amis acceptes ou opt-in.

#### [SEC-04] Pas de DELETE policy sur user_profiles et sortie_messages
**Severite :** CRITIQUE
**Fichier(s) :** `001_initial_schema.sql:119-126`, `002_sorties.sql:96-119`
**Probleme :** Aucune policy DELETE. RGPD non respecte. Messages irremovables.
**Correction :** Ajouter policies DELETE.

#### [SEC-05] .env — secrets et service_role key historique
**Severite :** HAUTE
**Fichier(s) :** `app/.env`, `app/.gitignore`
**Probleme :** .env non git-tracked (OK) mais service_role key precedemment exposee. Cle meteo inutilisee presente.
**Correction :** Confirmer regeneration service_role. EAS Secrets en production. Restrictions Mapbox.

#### [SEC-06] GPS backup dans AsyncStorage non chiffre
**Severite :** HAUTE
**Fichier(s) :** `useGPSTracking.ts:57-58, 190-206`
**Probleme :** Traces GPS en clair dans AsyncStorage (non chiffre Android).
**Correction :** Utiliser expo-secure-store ou chiffrer avant ecriture.

#### [SEC-07] Commentaires visibles meme sur posts prives
**Severite :** MOYENNE
**Fichier(s) :** `007_comments.sql:17-22`
**Probleme :** `USING (true)` sur post_comments — commentaires de posts friends-only visibles par tous.
**Correction :** Filtrer selon visibility du post parent.

#### [SEC-08] Username non valide a la creation de profil
**Severite :** MOYENNE
**Fichier(s) :** `authStore.ts:12-34`
**Probleme :** Pas de validation (reserves, profanite, longueur, caracteres).
**Correction :** sanitizeUsername() avec filtres.

#### [SEC-09] Missing UPDATE policy sur sortie_participants
**Severite :** HAUTE
**Fichier(s) :** `011_fix_participant_policies.sql:6-14`
**Probleme :** Seul l'organisateur peut UPDATE. Les participants ne peuvent pas changer leur statut eux-memes.
**Correction :** Ajouter policy `USING (auth.uid() = user_id)` pour UPDATE.

#### [SEC-10] Storage buckets — pas de validation type fichier
**Severite :** MOYENNE
**Fichier(s) :** `005c_storage_policies.sql`
**Probleme :** Aucune verification que les fichiers uploades sont bien des images. Malware possible.
**Correction :** Valider MIME type (jpeg/png/webp) dans une Edge Function ou cote client avant upload.

#### [SEC-11] Conversations RLS permet acces apres unfriend
**Severite :** HAUTE
**Fichier(s) :** `010_realtime_and_dms.sql:31-42`
**Probleme :** La policy exige l'amitie pour CREER une conversation, mais pas pour continuer a lire les DMs apres unfriend.
**Correction :** Ajouter check friendship actif dans la policy SELECT des direct_messages.

---

### DOMAINE 2 — CONFORMITE LEGALE & RGPD (5 issues)

#### [RGPD-01] Contradiction politique de confidentialite vs realite technique
**Severite :** CRITIQUE
**Fichier(s) :** `politique-confidentialite.html:243`, `008_live_community.sql`
**Probleme :** "Les traces GPS ne quittent jamais votre appareil" mais live_tracking envoie au serveur.
**Correction :** Mettre a jour la politique.

#### [RGPD-02] Messages prives (DM) non mentionnes dans la politique
**Severite :** HAUTE
**Fichier(s) :** `politique-confidentialite.html`
**Correction :** Ajouter "Messages prives entre amis — Serveur (EU)".

#### [RGPD-03] Suppression de compte non fonctionnelle
**Severite :** HAUTE
**Fichier(s) :** `SettingsScreen.tsx`
**Probleme :** Bouton UI mais pas de backend.
**Correction :** Edge Function `delete-account` avec cascade complete.

#### [RGPD-04] DMs non chiffres — donnees personnelles en clair
**Severite :** HAUTE
**Fichier(s) :** `useDirectMessages.ts:225-229`, `useSortieChat.ts:150-154`
**Correction :** Chiffrement au repos (Supabase Pro) ou E2E.

#### [RGPD-05] Transfert de donnees hors EU — Mapbox et OSRM
**Severite :** MOYENNE
**Correction :** Documenter transferts + DPA Mapbox.

---

### DOMAINE 3 — QUALITE DU CODE (16 issues)

#### [CODE-01] Memory leak Realtime — useInAppNotifications
**Severite :** CRITIQUE
**Fichier(s) :** `useInAppNotifications.ts:113-370`
**Probleme :** enqueue recree a chaque render. Boucle infinie de subscriptions.
**Correction :** Memoiser enqueue. removeChannel() avant re-sub.

#### [CODE-02] Memory leak Realtime — useDirectMessages
**Severite :** CRITIQUE
**Fichier(s) :** `useDirectMessages.ts:124-200`
**Probleme :** queryClient dans les deps useEffect = nouvel objet a chaque render.
**Correction :** Retirer queryClient des deps.

#### [CODE-03] Race condition GPS — buffer global non synchronise
**Severite :** HAUTE
**Fichier(s) :** `useGPSTracking.ts:65-67, 172, 89`
**Probleme :** _backgroundPoints ecrit/lu sans verrouillage.
**Correction :** Queue atomique ou AsyncStorage intermediaire.

#### [CODE-04] Pas de pagination feed et messages
**Severite :** HAUTE
**Fichier(s) :** `useFeed.ts:100-106`, `useDirectMessages.ts`, `useSortieChat.ts`
**Correction :** Cursor-based pagination.

#### [CODE-05] N+1 queries — useFeed
**Severite :** HAUTE
**Fichier(s) :** `useFeed.ts:114-141`
**Correction :** RPC ou subqueries Supabase.

#### [CODE-06] Vulnerabilite npm (flatted)
**Severite :** MOYENNE
**Correction :** `npm audit fix`

#### [CODE-07] 0 TODO/FIXME/HACK
**Severite :** POSITIF

#### [CODE-08] Memory leak Realtime — useSortieChat
**Severite :** HAUTE
**Fichier(s) :** `useSortieChat.ts:56-121`
**Probleme :** Channel recree a chaque changement sortieId sans cleanup propre. userInfoRef potentiellement undefined.
**Correction :** Ref stable pour channel, validate userInfo, cleanup lastChannelRef.

#### [CODE-09] Erreurs generiques dans les mutations
**Severite :** HAUTE
**Fichier(s) :** `useSorties.ts:135-217`, `useLiveShare.ts:73-120`
**Probleme :** Messages d'erreur generiques ("Impossible de creer la sortie"). Pas de log. Echecs silencieux dans useLiveShare.
**Correction :** Logger erreur complete + passer message Supabase a l'utilisateur.

#### [CODE-10] Auth store race condition
**Severite :** MOYENNE
**Fichier(s) :** `authStore.ts:59-94`
**Probleme :** Subscription auth configuree APRES set state. Si auth change pendant initialize(), event manque.
**Correction :** Configurer subscription AVANT set state.

#### [CODE-11] useVoiceGuidance — code mort et effets dupliques
**Severite :** MOYENNE
**Fichier(s) :** `useVoiceGuidance.ts:125-142`
**Probleme :** Effet dead code (125-130) + logique dupliquee (133-142).
**Correction :** Supprimer effet mort, simplifier.

#### [CODE-12] TypeScript Record<string, unknown> au lieu de types stricts
**Severite :** MOYENNE
**Fichier(s) :** `useSorties.ts:63`, `useAllSorties.ts:110`, `useFeed.ts:114-141`
**Probleme :** Record<string, unknown> defait la securite TypeScript.
**Correction :** Definir interfaces SortieParticipant, PostWithDetails, etc.

#### [CODE-13] useAvatar — pas de catch sur requete
**Severite :** MOYENNE
**Fichier(s) :** `useAvatar.ts:15-22`
**Probleme :** Requete Supabase dans useEffect sans .catch().
**Correction :** Ajouter .catch() avec log.

#### [CODE-14] useLeaderboard — type guard fragile
**Severite :** MOYENNE
**Fichier(s) :** `useLeaderboard.ts:74-100`
**Probleme :** `Array.isArray(data) ? data[0] : data` — RPC peut retourner format inattendu.
**Correction :** Enforcer type retour coherent dans la RPC.

#### [CODE-15] Cache coherence — stale 7 jours
**Severite :** MOYENNE
**Fichier(s) :** `useSupabaseTrails.ts`, `useOverpassPOI.ts`
**Probleme :** Cache 7 jours sans invalidation. Donnees potentiellement obsoletes.
**Correction :** Invalidation par mutation ou cache headers serveur.

#### [CODE-16] Progress store refresh loop
**Severite :** MOYENNE
**Fichier(s) :** `progressStore.ts:402`
**Probleme :** validateTrail() puis loadProgress() recharge TOUT. Performance degradee avec 100+ trails.
**Correction :** Update incrementiel du trail valide au lieu de reload complet.

---

### DOMAINE 4 — UX / INTERFACE (11 issues)

#### [UX-01] Pas d'Error Boundary global
**Severite :** CRITIQUE
**Fichier(s) :** `App.tsx`
**Correction :** ErrorBoundary avec fallback + bouton Reessayer.

#### [UX-02] HomeScreen non accessible depuis les onglets
**Severite :** HAUTE
**Fichier(s) :** `RootTabs.tsx:44-52`
**Correction :** Ajouter Tab.Screen HomeTab.

#### [UX-03] Etats vides non geres
**Severite :** MOYENNE
**Fichier(s) :** `HomeScreen.tsx`, `FeedScreen.tsx`, `FriendsScreen.tsx`, `InboxScreen.tsx`
**Correction :** Messages encourageants + CTA.

#### [UX-04] TrailDetailScreen ecran blanc si sentier introuvable
**Severite :** MOYENNE
**Fichier(s) :** `TrailDetailScreen.tsx:50-70`
**Correction :** Ecran "Sentier introuvable" + retour.

#### [UX-05] MapScreen FlatList suggestions sans optimisation perf
**Severite :** MOYENNE
**Fichier(s) :** `MapScreen.tsx:464-474`
**Probleme :** FlatList horizontale sans removeClippedSubviews, initialNumToRender.
**Correction :** Ajouter props de performance.

#### [UX-06] MapScreen BottomSheet sans gestion erreur/loading
**Severite :** MOYENNE
**Fichier(s) :** `MapScreen.tsx:475-522`
**Probleme :** Si selectedTrail a des donnees manquantes (gpx_url null), la sheet rend du vide.
**Correction :** Fallback UI pour donnees manquantes.

#### [UX-07] NotificationsScreen mark-as-read sans feedback
**Severite :** FAIBLE
**Fichier(s) :** `NotificationsScreen.tsx:73-81`
**Probleme :** markAllRead() appele sans confirmation de succes ni gestion d'erreur.
**Correction :** Toast ou indicateur visuel.

#### [UX-08] SortieChat retry sans check reseau
**Severite :** MOYENNE
**Fichier(s) :** `SortieChat.tsx:35-58`
**Probleme :** Bouton "Reessayer" ne verifie pas la connectivite avant retry.
**Correction :** Integrer useNetInfo avant retry.

#### [UX-09] InAppNotifications auto-dismiss trop rapide
**Severite :** FAIBLE
**Fichier(s) :** `InAppNotifications.tsx:126-170`
**Probleme :** Toast auto-dismiss 4000ms — peut etre trop court pour lire.
**Correction :** Augmenter a 5-6s ou ajouter countdown visuel.

#### [UX-10] ProfileScreen goal buttons sans tooltip disabled
**Severite :** FAIBLE
**Fichier(s) :** `ProfileScreen.tsx:353-382`
**Probleme :** Boutons +/- desactives aux limites sans explication visuelle.
**Correction :** accessibilityHint expliquant pourquoi desactive.

#### [UX-11] Console.error en production dans BaseMap
**Severite :** MOYENNE
**Fichier(s) :** `BaseMap.tsx:15`
**Probleme :** console.error inconditionnel. Fuite dans logs production.
**Correction :** Wrapper dans `if (__DEV__)`.

---

### DOMAINE 5 — CARTE & SENTIERS (4 issues)

#### [CARTE-01] Formule de distance erronee dans NavigationScreen
**Severite :** HAUTE
**Fichier(s) :** `NavigationScreen.tsx:254-262`
**Probleme :** Coefficients fixes au lieu de Haversine. ~10% surestimation.
**Correction :** Utiliser haversineDistance() de lib/geo.ts.

#### [CARTE-02] Legalite des donnees de sentiers
**Severite :** MOYENNE
**Correction :** Verifier provenance des donnees geographiques publiques.

#### [CARTE-03] Mapbox token failure silencieuse
**Severite :** MOYENNE
**Fichier(s) :** `BaseMap.tsx:13-17`
**Probleme :** Si token absent, console.error + token vide. Map ne charge pas sans feedback user.
**Correction :** Throw error attrapee par ErrorBoundary ou Alert explicite.

#### [CARTE-04] Clustering — pas de mesure de performance
**Severite :** FAIBLE
**Fichier(s) :** `TrailMarkers.tsx:68-76`
**Probleme :** 710 markers clusters, performance non mesuree sur bas de gamme.
**Correction :** Ajouter lazy-loading markers sous zoom 8. Mesurer avec perf trace.

---

### DOMAINE 6 — GPS & NAVIGATION (9 issues)

#### [GPS-01] Pas de filtrage de precision GPS
**Severite :** HAUTE
**Fichier(s) :** `useGPSTracking.ts:72-91`
**Correction :** Filtrer accuracy > 20m + filtre vitesse max 15 km/h.

#### [GPS-02] Detection hors-sentier point-a-point au lieu de point-a-ligne
**Severite :** HAUTE
**Fichier(s) :** `useOffTrailAlert.ts:13-20`
**Correction :** pointToLineSegmentDistance() ou @turf/point-to-line-distance.

#### [GPS-03] Auto-validation 80% non automatique
**Severite :** MOYENNE
**Fichier(s) :** `NavigationScreen.tsx:538-546`
**Correction :** Enforcer validation auto ou mettre a jour doc.

#### [GPS-04] Cooldowns hors-sentier incoherents (60s vs 120s)
**Severite :** MOYENNE
**Fichier(s) :** `useOffTrailAlert.ts:10-11`, `useVoiceGuidance.ts:19`
**Correction :** Unifier a 60s. Constante partagee.

#### [GPS-05] Altitude smoothing bias aux extremites
**Severite :** FAIBLE
**Fichier(s) :** `useGPSTracking.ts:97-108`
**Probleme :** Rolling average window 5 reduite aux bords. Edge bias sur debut/fin de trace.
**Correction :** Savitzky-Golay ou padding des extremites.

#### [GPS-06] GPS interval vs distance filter conflict
**Severite :** FAIBLE
**Fichier(s) :** `useGPSTracking.ts:54-56`
**Probleme :** timeInterval 5s + distanceInterval 5m = OR logic. Batterie non optimale.
**Correction :** Ajuster apres test terrain (ex: 2s/10m).

#### [GPS-07] OSRM throttling trop agressif (30s)
**Severite :** FAIBLE
**Fichier(s) :** `useRouting.ts:63-75`
**Probleme :** Si user bouge entre 2 fetches dans les 30s, route affichee stale.
**Correction :** Reduire a 15s ou throttling intelligent (distance-based).

#### [GPS-08] Douglas-Peucker tolerance hardcodee
**Severite :** FAIBLE
**Fichier(s) :** `NavigationScreen.tsx:49`
**Probleme :** Tolerance 0.00005 (~5m) hardcodee. Peut perdre des details en montagne.
**Correction :** Parametrer selon difficulte du sentier (optionnel).

#### [GPS-09] Elevation profile — pas de fallback si altitude null
**Severite :** FAIBLE
**Fichier(s) :** `HikeSummaryScreen.tsx:142-149`
**Probleme :** Si tous les points ont altitude null, profil vide sans message.
**Correction :** Message "Donnees d'altitude non disponibles".

---

### DOMAINE 7 — FONCTIONNALITES SOCIALES (9 issues)

#### [SOC-01] Pas de blocage d'utilisateur
**Severite :** HAUTE
**Correction :** Table blocked_users + UI + filtrage dans feed/DMs/search/notifications.

#### [SOC-02] Pas de rate limiting DMs et friend requests
**Severite :** HAUTE
**Correction :** Rate limit client (5 msgs/min, 10 requests/jour).

#### [SOC-03] Pas de moderation de contenu
**Severite :** MOYENNE
**Correction :** Filtre keywords basique.

#### [SOC-04] Profil prive non enforce
**Severite :** MOYENNE
**Fichier(s) :** `FeedScreen.tsx:292-299`
**Correction :** Check is_private avant affichage.

#### [SOC-05] Conversation permission check manquant
**Severite :** HAUTE
**Fichier(s) :** `ConversationScreen.tsx:54-56`
**Probleme :** Acces direct a conversationId depuis route params sans verifier que l'user est participant.
**Correction :** Verifier user est user1_id ou user2_id avant d'afficher.

#### [SOC-06] Notifications non persistees en base
**Severite :** MOYENNE
**Fichier(s) :** `useInAppNotifications.ts:63-65`
**Probleme :** Notifications uniquement en React state. Perdues si crash/background.
**Correction :** Creer table notifications dans Supabase et persister.

#### [SOC-07] Pas de preferences de notification
**Severite :** MOYENNE
**Probleme :** Pas de moyen de muter certains types de notifications.
**Correction :** Table notification_preferences + check avant enqueue.

#### [SOC-08] DM message length non validee cote client
**Severite :** FAIBLE
**Fichier(s) :** `useDirectMessages.ts:225-229`
**Probleme :** Validation longueur uniquement en DB (CHECK). Pas de feedback immediat.
**Correction :** Valider longueur cote client avant INSERT.

#### [SOC-09] Sortie chat — participant visibility non verifiee au chargement
**Severite :** MOYENNE
**Fichier(s) :** `useSortieChat.ts:40-44`
**Probleme :** Messages charges sans verifier que user est participant accepte.
**Correction :** RLS devrait bloquer mais verifier cote client aussi.

---

### DOMAINE 8 — GAMIFICATION (3 issues)

#### [GAM-01] Zone/progression/badges/challenges client-side uniquement
**Severite :** CRITIQUE — Cf. [SEC-01]

#### [GAM-02] Streak timezone non geree (UTC vs UTC+4)
**Severite :** MOYENNE
**Fichier(s) :** `progressStore.ts:63-86`
**Correction :** Forcer Indian/Reunion.

#### [GAM-03] Streak sauvegarde async — perte possible
**Severite :** MOYENNE
**Fichier(s) :** `progressStore.ts:246-257`
**Correction :** Backup table user_stats Supabase.

---

### DOMAINE 9 — BACKEND & BDD (7 issues)

#### [DB-01] FK inconsistantes — auth.users vs user_profiles
**Severite :** HAUTE
**Fichier(s) :** `010_realtime_and_dms.sql`, `007_comments.sql`
**Correction :** Standardiser FK vers user_profiles(id) ON DELETE CASCADE.

#### [DB-02] Index manquants
**Severite :** MOYENNE
**Correction :** user_activities.trail_id, friendships composite, posts composite.

#### [DB-03] Migration 013 duplique 005a
**Severite :** FAIBLE
**Correction :** Supprimer duplicat.

#### [DB-04] Pas de soft delete sur tables critiques
**Severite :** MOYENNE
**Probleme :** Posts, messages, friendships en hard delete. Suppressions accidentelles irrecuperables.
**Correction :** Ajouter deleted_at timestamp sur posts et direct_messages.

#### [DB-05] Realtime active sur trop de tables
**Severite :** MOYENNE
**Fichier(s) :** Migrations 002, 004, 008, 010
**Probleme :** 5+ tables en Realtime (sortie_messages, post_comments, post_likes, live_tracking, direct_messages). WAL log bloat.
**Correction :** Desactiver Realtime sur post_likes (polling suffit).

#### [DB-06] Sortie message — pas de trigger FK validation auteur
**Severite :** MOYENNE
**Fichier(s) :** `002_sorties.sql:43`
**Probleme :** sortie_messages.user_id reference user_profiles mais pas de check que user est participant.
**Correction :** Trigger validate_sortie_message_author().

#### [DB-07] Activity details join non pagine
**Severite :** MOYENNE
**Fichier(s) :** `progressStore.ts:270-273`
**Probleme :** Charge TOUS les user_activities avec nested trail joins. Lent si 500+ activities.
**Correction :** Paginer ou pre-agreger.

---

### DOMAINE 10 — PREPARATION AU DEPLOIEMENT (5 issues)

#### [DEPLOY-01] Config EAS incomplete — TODO
**Severite :** CRITIQUE
**Fichier(s) :** `eas.json:30-35`
**Correction :** Apple Developer account + configurer.

#### [DEPLOY-02] Pas de Crashlytics / Sentry
**Severite :** HAUTE
**Correction :** @sentry/react-native + ErrorBoundary.

#### [DEPLOY-03] APK 170MB trop lourd
**Severite :** HAUTE
**Correction :** Split trails.json, ProGuard/R8, cible <100MB.

#### [DEPLOY-04] Permission POST_NOTIFICATIONS manquante
**Severite :** MOYENNE
**Fichier(s) :** `app.json:31-35`
**Correction :** Ajouter permission Android.

#### [DEPLOY-05] Pas d'analytics
**Severite :** MOYENNE
**Probleme :** Aucun tracking user journeys. Impossible de mesurer adoption/engagement.
**Correction :** Mixpanel/Amplitude avec opt-in RGPD.

---

## COMPTEURS FINAUX

| Severite | Nombre |
|---|---|
| CRITIQUE | 9 |
| HAUTE | 21 |
| MOYENNE | 30 |
| FAIBLE | 7 |
| POSITIF | 4 (tokens secure store, OAuth OK, RLS storage OK, 0 TODO) |
| **Total** | **71 issues** |
