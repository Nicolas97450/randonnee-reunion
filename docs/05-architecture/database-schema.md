# Schéma base de données — Randonnée Réunion

Backend : Supabase (PostgreSQL + PostGIS)
Migrations : app/supabase/migrations/ (20 numéros — 22 fichiers SQL, 005 splitée en a/b/c)

## Tables principales

### Sentiers et carte
- `trails` — 710 sentiers avec PostGIS (géométrie, difficulté, région, distance, dénivelé)
- `trail_conditions` — états ONF (cache scraping, TTL 1h)
- `map_zones` — 18 zones de gamification
- `trail_zones` — liaison sentiers/zones (many-to-many)

### Utilisateurs
- `user_profiles` — profils (username, avatar_url, level, xp, bio, visibility)
- `user_activities` — sentiers validés (trail_id nullable pour rando libre)
- `user_favorites` — sentiers favoris
- `user_emergency_contacts` — contacts urgence
- `user_streaks` — séries consécutives (UTC+4)
- `blocked_users` — utilisateurs bloqués

### Social
- `friendships` — relations d'amitié (pending/accepted)
- `posts` — feed communautaire (soft delete)
- `post_likes` — likes sur les posts
- `post_comments` — commentaires
- `direct_messages` — DM (soft delete, Realtime)
- `conversations` — fils de conversation DM
- `notifications` — notifications in-app (6 types)
- `notification_preferences` — préférences par type

### Sorties de groupe
- `sorties` — événements de randonnée
- `sortie_participants` — membres (creator/participant)
- `sortie_messages` — chat temps réel (Realtime)

### Sentiers enrichis
- `trail_reports` — signalements terrain (multi-type)
- `trail_reviews` — avis et commentaires
- ~~`trail_photos`~~ — **N'EXISTE PAS en BDD** (photos gérées via storage bucket `trail_photos`)

### Live et communauté
- `live_tracking` — positions temps réel
- `community_challenges` — défis communautaires

### Notifications push
- `push_tokens` — tokens Expo/FCM pour les notifications push (Realtime)

## RPCs Supabase

| RPC | Migration | Rôle |
|---|---|---|
| get_leaderboard | 013 | Classement joueurs |
| get_user_rank | 013 | Rang d'un joueur |
| validate_and_complete_trail | 016 | Validation anti-triche |
| compute_user_xp | 016 | Calcul XP serveur |
| get_user_zone_progress | 016 | Progression zones |

## Storage buckets

- `avatars` — photos de profil (public, 2MB max, jpeg/png/webp)
- `trail_photos` — photos sentiers
- `reports` — pièces jointes signalements

## Realtime activé sur

### Côté SQL (migrations)
- sortie_messages, direct_messages, post_comments, live_tracking (4 tables dans supabase_realtime publication)
- post_likes retiré volontairement en migration 017 (réduction WAL bloat)

### Côté app (subscriptions JS)
- direct_messages (useDirectMessages.ts) — subscription active
- sortie_messages (useSortieChat.ts) — subscription active
- post_comments — PAS DE SUBSCRIPTION côté app (à implémenter si besoin temps réel)
- live_tracking — PAS DE SUBSCRIPTION côté app (hook useLiveShare.ts codé mais pas connecté)

## Migrations (séquentiel)

001: initial_schema → 002: sorties → 003: trail_reports_sos → 004: social →
005a: leaderboard_rpc → 005b: reviews_favorites → 005c: storage_policies →
006: activity_details → 007: comments → 008: live_community →
009: security_fixes → 010: realtime_and_dms → 011: fix_participant_policies →
012: fix_foreign_keys → 013: leaderboard_rpc → 014: rls_security_fixes →
015: social_security → 016: server_validation → 017: soft_delete_realtime →
018: free_hike → 019: server_security → 020: push_tokens
