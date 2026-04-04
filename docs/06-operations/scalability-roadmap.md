# Roadmap de scalabilité — Randonnée Réunion

**Document opérationnel | V1.0 | 4 avril 2026**

Plan des améliorations techniques POST-test APK et AVANT soumission stores. Ce document priorise les actions critiques pour garantir une expérience utilisateur stable à 5 000+ utilisateurs actifs mensuels.

---

## 1. Corrections pré-stores (BLOQUANT)

Ces tâches doivent être complétées avant la soumission aux stores. Elles évitent les rejets et les bugs critiques en production.

### 1.1 Pagination sur les listes

**Problème** : Le feed, les sorties et les avis chargent TOUS les éléments sans LIMIT. À 1 000 posts, cela crée des lags et des crashes mémoire.

| Liste | Fichier | Statut | Effort | Priorité |
|-------|---------|--------|--------|----------|
| Feed posts | FeedScreen.tsx | À faire | 2h | CRITIQUE |
| Sorties | SortiesScreen.tsx | À faire | 1h30 | CRITIQUE |
| Commentaires trail | TrailDetailScreen.tsx | À faire | 1h | CRITIQUE |
| Reviews | ReviewListScreen.tsx | À faire | 1h | CRITIQUE |
| Live tracking | LeaderboardScreen.tsx | À faire | 30min | HAUTE |

**Approche** :
- FlatList : ajouter `initialNumToRender: 20`, `maxToRenderPerBatch: 10`, `windowSize: 10`
- React Query : ajouter pagination avec cursor (offset/limit 20)
- Bouton "Charger plus" ou auto-load au bottom sheet scroll
- Cacher les anciennes posts après 90 jours (soft delete + archive)

**Code exemple** :
```typescript
// FeedScreen.tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam, 20),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

<FlatList
  data={data?.pages.flatMap(p => p.posts)}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={10}
  onEndReached={() => hasNextPage && fetchNextPage()}
/>
```

### 1.2 Protéger les console.error par __DEV__

**Problème** : Des console.error restants pourraient révéler des infos sensibles ou causer des lags en production.

| Fichier | Localisation | Statut | Effort |
|---------|--------------|--------|--------|
| useTrailReports.ts | catch API | Vérifier | 10min |
| useTrailReviews.ts | catch API | Vérifier | 10min |
| useInAppNotifications.ts | 3 emplacements | Vérifier | 15min |
| App.tsx | ErrorBoundary | Vérifier | 5min |

**Checklist** :
```typescript
// ❌ À éviter
catch (error) {
  console.error('Erreur API:', error);  // Exposé en prod
}

// ✅ Correct
catch (error) {
  if (__DEV__) console.error('Erreur API:', error);
  logToSentry(error); // Sentry loggue en prod
}
```

---

## 2. Monitoring et Analytics (HAUTE PRIORITÉ)

La visibilité en production est essentielle pour détecter les problèmes rapidement et comprendre le comportement utilisateur.

### 2.1 Vérifier Sentry en production

**Statut** : Sentry est installé (package + initialisation App.tsx) mais N'A PAS ÉTÉ TESTÉ sur device réel.

| Tâche | Effort | Résultat attendu |
|-------|--------|-----------------|
| Déclencher volontairement une erreur sur device | 15min | L'erreur remonte dans Sentry.io dashboard |
| Vérifier les source maps (pas exposées publiquement) | 15min | Code minifié reste lisible dans Sentry |
| Configurer alertes email si crash > 5/heure | 10min | Notifications envoyées |

**Test manuel** :
```typescript
// Dans un écran de test (à supprimer après)
<Button onPress={() => {
  throw new Error('Test Sentry crash');
}} title="Crash test" />
```

Vérifier dans Sentry.io qu'après 30sec, l'erreur s'affiche dans le dashboard.

### 2.2 Ajouter PostHog ou Amplitude pour le tracking

**Pourquoi** : Comprendre quels écrans les utilisateurs visitent, où ils dropent, comment ils utilisent la gamification.

**Package** : `expo-analytics-segment` ou `@react-native-community/hooks`

**Événements critiques à tracker** (minimum viable) :

| Événement | Contexte | Utilité |
|-----------|----------|---------|
| `app_open` | Au lancement | Compter les DAU |
| `trail_viewed` | Clic sur fiche sentier | Identifier les sentiers populaires |
| `trail_downloaded` | Téléchargement offline | Compter les users offline |
| `trail_completed` | Validation GPS ou manuelle | Tracker la gamification |
| `sortie_created` | Création d'événement groupe | Mesurer adoption social |
| `premium_purchased` | Subscription | Conversion freemium |
| `crash_reported` | Via ErrorBoundary | Bugs en production |

**Effort** : 4h (choix plateforme + intégration + tests)

**Timing** : Peut attendre post-lancement (activable post-publication stores)

### 2.3 Configurer EAS Updates (expo-updates) pour hotfixes OTA

**Pourquoi** : Pouvoir corriger un bug critique sans passer par 3-5 jours de review stores.

| Composant | Statut | Effort |
|-----------|--------|--------|
| Package expo-updates | À installer | 30min |
| Updates.checkAsync() dans App.tsx | À ajouter | 30min |
| EAS CLI configuration | À faire | 15min |
| Test d'une mise à jour OTA | À faire | 30min |

**Limitation** : Les mises à jour OTA ne peuvent changer que du JavaScript. Les changements natifs (Android/iOS config) requièrent un rebuild store.

**Effort total** : 2h

---

## 3. Scalabilité Supabase (MOYENNE PRIORITÉ)

Le free tier Supabase supporte ~2 000-5 000 utilisateurs actifs. Au-delà, des lags apparaissent.

### 3.1 Monitoring de l'utilisation free tier

**Tâches** (à effectuer chaque mois en V1) :

| Métrique | Seuil limite free | Action à M6 si dépassé |
|----------|------------------|----------------------|
| Stockage DB | 500 MB | Upgrade Pro (+25$/mois) |
| Stockage Storage (avatars) | 1 GB | Ajouter CDN Cloudflare R2 |
| Authentification (users) | Illimité | Monitor les clés API |
| Realtime connections | 200 concurrent | Optimiser ou upgrade Pro |

**Checklist** : Supabase Dashboard → Usage → vérifier les graphiques mensuels

### 3.2 Ajouter index PostGIS sur les requêtes chaudes

**Requêtes chaudes** (utilisées > 10 fois/jour) :

```sql
-- Index sur les filtres sentiers (PRD.md requête découverte)
CREATE INDEX idx_trails_difficulty ON trails(difficulty);
CREATE INDEX idx_trails_region ON trails(region);
CREATE INDEX idx_trails_type ON trails(trail_type);

-- Index spatial (cercle de 50km autour de la position)
CREATE INDEX idx_trails_start_point ON trails USING GIST (start_point);

-- Index composite pour les requêtes fréquentes
CREATE INDEX idx_trails_region_difficulty ON trails(region, difficulty);
```

**Effort** : 30min (vérifier si les index existent déjà dans les migrations 001-020)

**Bénéfice** : Réduction latence queries de 200ms → 50ms

### 3.3 Nettoyer les anciennes données (TTL cleanup)

**Problème** : live_tracking, trail_reports, et other logs s'accumulent indéfiniment.

| Table | Règle de rétention | Trigger | Effort |
|-------|-------------------|---------|--------|
| live_tracking | > 30 jours → supprimer | Cron quotidien | 1h |
| trail_reports | > 48h → supprimer (déjà implémenté via expires_at) | ✅ Actif | — |
| direct_messages | > 1 an → soft delete | Cron mensuel | 1h |
| post_likes | Aucune | À revoir | 30min |
| notifications | > 3 mois → supprimer | À ajouter | 1h |

**Implémentation** : Edge Function Supabase appelée via cron (pg-cron ou externe)

**Code exemple** :
```sql
-- Migration XXX : TTL cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Supprimer les positions GPS > 30 jours
  DELETE FROM live_tracking
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Soft delete les notifications > 3 mois
  UPDATE notifications
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '3 months' AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger (pg-cron nécessaire, non disponible sur free tier)
SELECT cron.schedule('cleanup-daily', '0 2 * * *', 'SELECT cleanup_old_data()');
```

**Effort total** : 3h (après free tier) | À faire dès M3

### 3.4 Augmenter le cache ONF de 1h à 6h

**Contexte** : Le scraping onf.fr actuellement rechache les données toutes les heures. C'est excessif — l'état des sentiers change rarement (sauf cyclone).

| Change | Ancien | Nouveau | Raison |
|--------|--------|---------|--------|
| Cache TTL | 1h | 6h | État sentiers change rarement |
| Requête onf.fr | 24/jour | 4/jour | Réduire charge serveur externe |

**Code** (app/src/lib/onf.ts) :
```typescript
const ONF_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 heures (au lieu de 1h)
```

**Effort** : 5min

**Bénéfice** : -80% requêtes externes, -20% latence moyenne

### 3.5 Ajouter rate limiting côté client pour le scraping ONF

**Pourquoi** : Si une fonction appelle le scraper ONF sans vérifier le cache, on peut faire 100+ requêtes en quelques secondes.

```typescript
// useONFStatus.ts
const lastFetchTime = useRef<number>(0);
const RATE_LIMIT_INTERVAL = 30000; // 30 secondes minimum entre 2 scrapes

const fetchStatus = useCallback(async () => {
  if (Date.now() - lastFetchTime.current < RATE_LIMIT_INTERVAL) {
    return cachedStatus;
  }
  lastFetchTime.current = Date.now();
  return await scrapeONF();
}, []);
```

**Effort** : 30min

---

## 4. Performance App (MOYENNE PRIORITÉ)

Optimisations pour réduire les lags et la consommation mémoire.

### 4.1 Vérifier et regénérer trail-coords.json

**Problème découvert** : Le fichier `data/trail-coords.json` est vide (0 octets) — supposément pour le cache local rapide.

| Question | Action |
|----------|--------|
| Pourquoi est-il vide ? | Vérifier le code qui crée ce fichier |
| Devrait-il être utilisé ? | Ou est-il de la dette technique ? |
| Si oui, comment le regénérer ? | Script de preprocessing avant build |

**Approche** :
- Si c'est du cache : le regénérer via un script `npm run build:cache` avant chaque release
- Si c'est inutilisé : supprimer le fichier et la référence dans le code

**Effort** : 1h (investigation + decision + implémentation)

### 4.2 Compresser les images sentiers (WebP 80%)

**Contexte** : Les photos sentiers depuis Storage Supabase ne sont pas optimisées.

| Format | Taille (exemple) | Temps chargement | Support |
|--------|-----------------|------------------|---------|
| JPEG original | 2.5 MB | 3s (4G) | 100% |
| WebP 80% | 800 KB | 800ms (4G) | 95% (iOS 14+) |
| JPEG progressive | 1.2 MB | 1.5s (4G) | 100% |

**Implémentation** :
- Utiliser `react-native-image-resizer` pour compresser avant upload
- Ou demander à l'utilisateur de choisir une image max 1200px
- Servir WebP depuis CDN si possible (Cloudflare)

**Code exemple** :
```typescript
// Avant upload
const compressed = await ImageResizer.createResizedImage({
  uri: selectedImage.uri,
  width: 1200,
  height: 1200,
  format: 'WEBP',
  quality: 80,
});
```

**Effort** : 2h (upload, compression, tests)

### 4.3 Configurer les quotas de stockage par bucket

**Supabase** : Permet de limiter la taille d'un bucket à N MB.

| Bucket | Quota estimé | Hard limit | Raison |
|--------|--------------|-----------|--------|
| avatars | 100 MB (10 000 users × 10 KB) | 500 MB | Profils utilisateurs |
| trail_photos | 200 MB (2 000 photos × 100 KB) | 1 000 MB | Photos sentiers |
| reports | 50 MB | 200 MB | Pièces jointes signalements |

**Configuration** : Supabase Dashboard → Storage → Policies → Object size

**Effort** : 15min

**Bénéfice** : Prévention des uploads malveillants (spam de fichiers énormes)

---

## 5. Maintenabilité (POST-LANCEMENT)

Structure et processus pour faciliter la maintenance à long terme.

### 5.1 Versioning sémantique strict

**Format** : MAJOR.MINOR.PATCH (ex: 1.0.0 → 1.0.1 → 1.1.0 → 2.0.0)

| Version | Cas d'usage | Exemple | Impact utilisateur |
|---------|------------|---------|-------------------|
| Patch (1.0.X) | Bugfixes critiques | 1.0.1 = fix Douglas-Peucker | Hotfix OTA |
| Minor (1.X.0) | Nouvelles features | 1.1.0 = 100+ sentiers | Stores (1-5 jours) |
| Major (X.0.0) | Breaking changes | 2.0.0 = redesign complet | Nouveau build stores |

**Configuration** :
- `app/app.json` : version = "1.0.0" (mis à jour à chaque release)
- `app/app.json` : versionCode = 100000 + patch (Android obligatoire)
- Créer un tag git : `git tag -a v1.0.0 -m "Release v1.0.0"`

**Effort** : 15min par release

### 5.2 Tracker la version de l'app dans les données utilisateur

**Pourquoi** : Savoir quelle version l'utilisateur utilise pour le debugging.

```typescript
// Migration XXX : add_app_version
ALTER TABLE user_profiles ADD COLUMN app_version TEXT DEFAULT '1.0.0';

// App.tsx
await supabase.from('user_profiles')
  .update({ app_version: Constants.manifest?.version })
  .eq('id', user.id);
```

**Utilité** : "L'utilisateur X en version 1.0.0 rapporte un crash" → peut corréler avec le version code

**Effort** : 1h

### 5.3 Documenter la stratégie de rollback des migrations SQL

**Risque** : Une migration SQL déployée en prod casse le code. Il faut pouvoir revenir en arrière rapidement.

**Politique à implémenter** :

| Scenario | Rollback | Effort | Temps |
|----------|----------|--------|-------|
| Migr. destructive (DROP TABLE) | Restaurer depuis backup Supabase | Demander support | 24h |
| Migr. ajout colonne (ADD COLUMN) | Simplement ne pas utiliser la colonne | Code | 5min |
| Migr. RLS cassée | Revenir à l'ancienne politique RLS | SQL + redeploy | 10min |
| Migr. de données (UPDATE) | Trop tard — ne pas faire en production directement | N/A | N/A |

**Règle** : JAMAIS de migration destructive en production. Toujours test en staging (branche Supabase) d'abord.

**Effort de documentation** : 1h

### 5.4 Tester les migrations SQL avec des tests unitaires

**Statut** : Les migrations ne sont pas testées actuellement.

**Approche** :
- Créer une DB de test locale (PostgreSQL via Docker)
- Exécuter les migrations et vérifier les RLS policies
- Vérifier que les données existantes ne sont pas corrompues

**Exemple** :
```bash
# tests/migrations.test.ts
npm install --save-dev jest pg

// Test une migration
await runMigration('001_initial_schema.sql');
const users = await db.query('SELECT * FROM user_profiles');
expect(users.rows.length).toBe(0); // Table vide après création
```

**Effort** : 2 jours (setup infrastructure + tests des 20 migrations)

**Timing** : Post-lancement

---

## 6. Modération contenu (AVANT OUVERTURE PUBLIQUE)

Préparer la plateforme avant d'accepter du contenu utilisateur à grande échelle.

### 6.1 État actuel du filtrage

| Composant | Status | Couverture |
|-----------|--------|-----------|
| moderation.ts (keyword filter) | ✅ Code | 50 mots français bloqués |
| Front-end (sanitizeUsername) | ✅ Code | Accents, caractères spéciaux |
| Back-end (RLS policies) | ✅ Code | Empêcher lectures non autorisées |
| Modération serveur | ❌ Edge Function | Absent |
| Signalement de contenu | ❌ UI component | Absent |

### 6.2 Implémenter la modération côté serveur (Edge Function)

**Contexte** : Les utilisateurs malveillants peuvent contourner le filter client. Besoin d'une couche serveur.

```typescript
// supabase/functions/moderate-content/index.ts
export default async function handler(req: Request) {
  const { content, type } = await req.json();

  // 1. Keyword filter avancé (regex, contexte)
  if (containsBlockedKeywords(content)) {
    return reject('Contenu bloqué');
  }

  // 2. Détection spam (même contenu 10x dans 1h)
  if (await isSpam(userId, content)) {
    return reject('Activité spam détectée');
  }

  // 3. Vérification URLs malveillantes
  if (containsMaliciousUrls(content)) {
    return reject('URL bloquée');
  }

  return approve();
}
```

**Effort** : 6h (développement + tests)

**Timing** : Avant d'accepter des posts publics (V1.1)

### 6.3 Ajouter une UI de signalement de contenu

**Fonctionnalité** : Chaque post/commentaire a un bouton "Signaler" permettant de rapporter du contenu inapproprié.

**Workflow** :
1. Utilisateur clique "Signaler ce post"
2. Modal "Raison du signalement" (spam, harcèlement, contenu offensant, autre)
3. Envoi vers table `content_reports` (avec screenshot du contenu + ID utilisateur)
4. Admin Supabase revient dessus via dashboard

**Tables à créer** :
```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by_id UUID REFERENCES user_profiles(id),
  content_type TEXT, -- 'post' | 'comment' | 'review' | 'message'
  content_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending', -- 'pending' | 'reviewed' | 'dismissed'
  admin_notes TEXT
);
```

**Effort** : 3h (UI + hook + API)

**Timing** : V1.1

---

## Timeline recommandée

```
SEMAINE 1 (Avant stores)
├── Pagination listes (2h) — CRITIQUE
├── Protéger console.error (1h) — CRITIQUE
├── Vérifier Sentry (1h) — HAUTE
└── Regénérer trail-coords.json (1h)

SEMAINE 2-4 (Post-stores)
├── Config EAS Updates (2h) — HAUTE
├── PostHog/Analytics (4h) — HAUTE
├── Ajouter indexes Supabase (1h) — MOYENNE
└── Compresser images (2h) — MOYENNE

MOIS 2-3 (M2-M3)
├── TTL cleanup data (3h) — MOYENNE
├── Modération serveur (6h) — HAUTE
├── Tests migrations (16h) — MOYENNE
└── Signalement contenu (3h) — MOYENNE

CONTINU
├── Monitor free tier metrics — Monthly check
├── Rate limiting ONF (30min) — Rapide
└── Versioning strict — À chaque release
```

---

## Budget estimé

| Élément | Effort | Timing | Coût infrastructure |
|---------|--------|--------|---------------------|
| Corrections pré-stores | 6h | Semaine 1 | 0 EUR |
| Analytics (PostHog free) | 4h | S2-4 | 0 EUR (free ≤ 1M events) |
| EAS Updates | 2h | S2-4 | 0 EUR |
| Supabase Pro (M6+) | — | À M5-6 | +25 EUR/mois |
| Cloudflare R2 (images) | — | À M6+ | ~5 EUR/mois |
| Modération contenu | 9h | M2-3 | 0 EUR |
| Tests migrations | 16h | M2-3 | 0 EUR |
| **Total effort** | **~50h** | | **~30 EUR/mois** |

---

*Document créé le 4 avril 2026 — Mis à jour le 4 avril 2026*
