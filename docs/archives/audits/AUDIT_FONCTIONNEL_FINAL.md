# AUDIT FONCTIONNEL FINAL — Randonnee Reunion
> Date : 19 mars 2026
> Methode : Lecture du code + requetes curl Supabase (service_role)
> 30 features testees, 4 bugs corriges, 2 problemes notes

---

## Resume

| Categorie | OK | BUG (corrige) | MANQUANT |
|---|---|---|---|
| A. Sorties (7 tests) | 6 | 1 | 0 |
| B. Social (8 tests) | 8 | 0 | 0 |
| C. Profil (4 tests) | 2 | 1 | 1 |
| D. Sentiers (4 tests) | 3 | 0 | 1 |
| E. Navigation (3 tests) | 2 | 1 | 0 |
| F. Gamification (4 tests) | 4 | 0 | 0 |
| **TOTAL** | **25** | **3 corriges** | **2 notes** |

---

## A. SORTIES

### A1. Creer une sortie
**OK** — `useCreateSortie` fait un INSERT dans `sorties` avec resolution slug->UUID. Teste avec curl : INSERT reussit, retourne la sortie avec statut `ouvert`.

### A2. Rejoindre une sortie
**OK** — `useJoinSortie` fait un INSERT dans `sortie_participants` avec `statut: 'en_attente'`. Teste avec curl : OK.

### A3. Accepter un participant
**OK** — `useUpdateParticipant` fait un UPDATE `statut = 'accepte'` sur `sortie_participants`. Boutons dans `SortieDetailScreen` (lignes 76-85). Teste avec curl : OK.

### A4. Refuser un participant
**OK** — Meme hook `useUpdateParticipant` avec `statut = 'refuse'`. Bouton present dans `SortieDetailScreen`. Teste avec curl : OK.

### A5. Annuler une sortie
**OK** — `useCancelSortie` fait un UPDATE `statut = 'annule'` sur `sorties`. Bouton "Annuler la sortie" (ligne 134). Teste avec curl : OK.

### A6. Quitter une sortie
**BUG CORRIGE** — Le hook pour quitter (DELETE `sortie_participants`) n'existait pas et aucun bouton "Quitter" n'etait present dans `SortieDetailScreen`.

**Corrections appliquees :**
- Ajoute `useLeaveSortie` dans `useSorties.ts` (DELETE sortie_participants par sortie_id + user_id)
- Ajoute bouton "Quitter la sortie" dans `SortieDetailScreen.tsx` pour les participants acceptes ou en attente
- Ajoute styles `leaveButton` et `leaveText`

### A7. Chat
**OK** — `useSortieChat` fait un INSERT dans `sortie_messages`. Utilise Realtime avec optimistic updates et retry. Teste avec curl : OK.

---

## B. SOCIAL

### B8. Liker un post
**OK** — `useToggleLike` fait un INSERT dans `post_likes` avec optimistic update + rollback. Teste avec curl : OK.

### B9. Unliker un post
**OK** — Meme `useToggleLike` fait un DELETE sur `post_likes` quand `isLiked=true`. Teste avec curl : DELETE 204.

### B10. Creer un post texte
**OK** — `useCreatePost` fait un INSERT dans `posts`. Teste avec curl : OK.

### B11. Creer un post avec photo
**OK** — `FeedScreen.handlePublish` upload l'image dans le bucket `avatars` (sous-dossier `posts/`), recupere l'URL publique, puis INSERT dans `posts` avec `image_url`. Le bucket `avatars` a les policies INSERT/SELECT. Code coherent.

### B12. Commenter un post
**OK** — `useCreateComment` fait un INSERT dans `post_comments`. Table creee par migration 007. Teste avec curl : OK. UI avec BottomSheet dans `FeedScreen`.

### B13. Ajouter un ami
**OK** — `useSendFriendRequest` fait un INSERT dans `friendships` avec `status: 'pending'`. Teste avec curl : OK.

### B14. Accepter un ami
**OK** — `useRespondFriendRequest` fait un UPDATE `status = 'accepted'` sur `friendships`. Teste avec curl : OK.

### B15. Supprimer un ami
**OK** — `useRemoveFriend` fait un DELETE sur `friendships` par ID. Teste avec curl : DELETE 204.

---

## C. PROFIL

### C16. Modifier username
**MANQUANT** — Pas de hook `useUpdateProfile` ni d'ecran pour editer le username. `ProfileScreen` affiche `user?.user_metadata?.username` mais aucun bouton d'edition. La table `user_profiles.username` est updatable (teste avec curl : OK).

> Action suggeree : Ajouter un champ editable dans `SettingsScreen` ou `ProfileScreen` avec un hook `useUpdateProfile`.

### C17. Upload photo profil
**OK** — `useAvatar` upload dans le bucket `avatars` (2MB max, jpeg/png/webp). Recupere l'URL publique + cache bust. Met a jour `user_profiles.avatar_url`. Bucket et policies confirmes.

### C18. Supprimer compte
**BUG CORRIGE** — `deleteMyAccount` ne supprimait pas `post_comments` et `live_tracking` avant de supprimer le profil. Les foreign keys auraient bloque la suppression si des commentaires ou sessions live existaient.

**Corrections appliquees dans `useAccountActions.ts` :**
- Ajoute `await supabase.from('post_comments').delete().eq('user_id', userId)` avant les autres deletions
- Ajoute `await supabase.from('live_tracking').delete().eq('user_id', userId)`

### C19. Export donnees
**BUG CORRIGE** — `exportMyData` ne recuperait pas `post_comments` ni `live_tracking`.

**Corrections appliquees dans `useAccountActions.ts` :**
- Ajoute requete `post_comments` et `live_tracking` dans le Promise.all
- Ajoute `commentaires` et `partages_position` dans l'objet exporte

---

## D. SENTIERS

### D20. Laisser un avis
**OK** — `useCreateReview` fait un UPSERT dans `trail_reviews` avec `onConflict: 'trail_id,user_id'`. Table creee par migration 005 avec contrainte UNIQUE. Teste avec curl (UPSERT via `on_conflict`) : OK. Note moyenne calculee par `useAverageRating`.

### D21. Ajouter aux favoris
**OK** — `useFavorites` utilise AsyncStorage (stockage local). Table `user_favorites` existe en Supabase (migration 005) mais n'est pas utilisee par le hook. Le choix AsyncStorage est delibere (fonctionnement offline). `deleteMyAccount` tente un DELETE sur `user_favorites` qui sera un no-op silencieux.

### D22. Signaler un probleme
**OK** — `useCreateReport` fait un INSERT dans `trail_reports` avec type, message, coordonnees GPS et expiration 48h. Teste avec curl : OK.

### D23. Ajouter photo sentier
**MANQUANT (policies)** — `useUploadTrailPhoto` upload dans le bucket `trail_photos`. Le bucket existe (5MB max, public) MAIS aucune policy INSERT n'etait definie pour les utilisateurs authentifies. Upload echouera avec une erreur RLS.

**Correction appliquee dans `005_storage_policies.sql` :**
- Ajoute policies INSERT/SELECT/DELETE pour `trail_photos`
- Ajoute policies INSERT/SELECT pour `reports`
- **A deployer via Supabase Dashboard > SQL Editor**

---

## E. NAVIGATION

### E24. Valider un sentier
**BUG CORRIGE** — `progressStore.validateTrail` utilisait `upsert` avec `onConflict: 'user_id,trail_id'`, mais la migration 006 a supprime la contrainte UNIQUE pour permettre les completions multiples. L'UPSERT aurait echoue silencieusement.

**Correction appliquee dans `progressStore.ts` :**
- Remplace `supabase.from('user_activities').upsert(...)` par `supabase.from('user_activities').insert(...)`
- Note : `NavigationScreen` faisait deja un INSERT correct (ligne 416).

### E25. Partage position live
**OK** — `useLiveShare` fait un INSERT dans `live_tracking`, UPDATE des coordonnees throttle a 30s, et deactivation (`is_active: false`) a l'arret. Table creee par migration 008 avec Realtime active. Teste avec curl (INSERT, UPDATE position, STOP) : OK.

### E26. Arreter la rando
**OK** — `NavigationScreen.handleToggleTracking` arrete le tracking GPS, collecte les stats, sauvegarde l'activite complete (distance, duree, denivele, vitesse moyenne, trace GeoJSON) dans `user_activities`, puis navigue vers `HikeSummaryScreen`.

---

## F. GAMIFICATION

### F27. Progression zones
**OK** — `progressStore.loadProgress` recupere les trails (slug + region), les overrides `trail_zones`, et les `user_activities` en parallele. Calcule la progression par zone avec fallback `REGION_TO_ZONE` quand `map_zones`/`trail_zones` sont vides. Logique coherente.

### F28. Streaks
**OK** — Logique dans `progressStore` : calcul par semaine ISO, increment si semaines consecutives, reset si gap. Persistance AsyncStorage. `getISOWeek` et `getNextWeek` implementes correctement.

### F29. XP
**OK** — `computeXP` : 100 XP de base + 10 XP/km + 0.5 XP/m de denivele. Recalcul complet au `loadProgress`. XP incrementale (+100) au `validateTrail` en attendant le refresh.

### F30. Defis
**OK** — 8 defis dans `challenges.ts` : 3 Cirques, Volcanologue, Chasseur de cascades, Tour de l'ile, Altitude, Familial, Semaine intensive, Endurance. Chaque defi a une fonction `getProgress` avec calcul coherent. Ecran `ChallengesScreen` fonctionnel avec tri par progression. Defis communautaires via `community_challenges` (table + seed data confirmes).

---

## TABLES SUPABASE VERIFIEES

| Table | Existe | Donnees | RLS |
|---|---|---|---|
| trails | oui | 710 | oui |
| user_profiles | oui | 5 | oui |
| user_activities | oui | 1+ | oui |
| sorties | oui | 3+ | oui |
| sortie_participants | oui | 3+ | oui |
| sortie_messages | oui | 3+ | oui |
| trail_reports | oui | 3+ | oui |
| trail_reviews | oui | 1+ | oui |
| user_favorites | oui | 0 | oui |
| posts | oui | 2+ | oui |
| post_likes | oui | 1+ | oui |
| post_comments | oui | 0 | oui |
| friendships | oui | 0 | oui |
| live_tracking | oui | 0 | oui |
| community_challenges | oui | 1 | oui |
| user_emergency_contacts | oui | 0 | oui |
| map_zones | oui | 0 | oui |
| trail_zones | oui | 0 | oui |

## STORAGE BUCKETS VERIFIES

| Bucket | Existe | Public | Limite | Policies |
|---|---|---|---|---|
| avatars | oui | oui | 2MB | INSERT/UPDATE/SELECT/DELETE |
| trail_photos | oui | oui | 5MB | **MANQUANT** (ajoute en migration) |
| reports | oui | oui | 2MB | **MANQUANT** (ajoute en migration) |

---

## BUGS CORRIGES (4)

1. **`useAccountActions.ts`** — `deleteMyAccount` et `exportMyData` ne géraient pas `post_comments` et `live_tracking` (RGPD incomplet)
2. **`SortieDetailScreen.tsx` + `useSorties.ts`** — Pas de bouton/hook "Quitter la sortie" pour les participants
3. **`progressStore.ts`** — `validateTrail` utilisait UPSERT avec une contrainte UNIQUE supprimee (migration 006)
4. **`005_storage_policies.sql`** — Policies manquantes pour `trail_photos` et `reports` (a deployer)

## MANQUANTS NON CORRIGES (2)

1. **Modifier username** — Pas d'UI pour editer le username (table OK, pas de hook/ecran)
2. **Storage policies** — Les policies pour `trail_photos` et `reports` sont dans la migration mais doivent etre deployees via Supabase Dashboard

---

## FICHIERS MODIFIES

- `app/src/hooks/useAccountActions.ts` — Ajoute suppression/export de post_comments + live_tracking
- `app/src/hooks/useSorties.ts` — Ajoute hook `useLeaveSortie`
- `app/src/screens/SortieDetailScreen.tsx` — Ajoute bouton "Quitter la sortie" + import + styles
- `app/src/stores/progressStore.ts` — UPSERT remplace par INSERT (contrainte UNIQUE supprimee)
- `app/supabase/migrations/005_storage_policies.sql` — Ajoute policies trail_photos + reports
