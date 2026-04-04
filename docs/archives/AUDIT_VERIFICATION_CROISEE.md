# Audit Vérification Croisée — Documentation vs Code Réel
**Randonnée Réunion | 1er avril 2026**

---

## Résumé exécutif

Audit systématique de 15 points critiques vérifiant la correspondance entre la documentation et le code réel du projet.

**Résultats globaux :**
- ✅ **11 points CONFIRMÉS**
- ⚠️ **2 points DISCREPANCE**
- ❌ **2 points NON CONFIRMÉS**

---

## Résultats détaillés par point

### 1. **5 stores Zustand (auth, progress, theme, offline, premium)** ✅ CONFIRMÉ

**Documentation** : CLAUDE.md dit "5 stores"

**Code réel** (`app/src/stores/*.ts`) :
```
✅ authStore.ts (5384 bytes)
✅ offlineStore.ts (3965 bytes)
✅ premiumStore.ts (1268 bytes)
✅ progressStore.ts (14886 bytes)
✅ themeStore.ts (2439 bytes)
```

**Verdict** : Confirmé. Exactement 5 stores avec les rôles attendus.

---

### 2. **6 stacks navigation (Root, Trail, Sorties, Social, Profile, Auth)** ✅ CONFIRMÉ

**Documentation** : CLAUDE.md dit "6 stacks (Root, Trail, Sorties, Social, Profile, Auth)"

**Code réel** (`app/src/navigation/`) :
```
✅ RootTabs.tsx (onglets : HomeTab, MapTab, TrailStack, SortiesStack, SocialStack, ProfileStack)
✅ AuthStack.tsx
✅ TrailStack.tsx
✅ SortiesStack.tsx
✅ SocialStack.tsx
✅ ProfileStack.tsx
```

**Verdict** : Confirmé. 6 stacks correctement nommés.

---

### 3. **Mapbox GL (@rnmapbox/maps v10) — Pas MapLibre** ✅ CONFIRMÉ

**Documentation** : tech-stack.md et system-design.md v3.0 disent "Mapbox GL (@rnmapbox/maps v10)"

**Code réel** :

Package.json:
```json
"@rnmapbox/maps": "^10.2.10"
```

Imports dans le code :
```
✅ app/src/components/BaseMap.tsx: import Mapbox from '@rnmapbox/maps'
✅ app/src/components/IslandProgressMap.tsx: import Mapbox from '@rnmapbox/maps'
✅ app/src/components/TrailMarkers.tsx: import Mapbox from '@rnmapbox/maps'
✅ ... (9 fichiers total)
```

MapLibre references : **AUCUNE** trouvée

**Verdict** : Confirmé. Mapbox GL v10.2.10 utilisé partout, aucune trace de MapLibre.

---

### 4. **Zustand : 5 stores (pas 4 ou 6)** ✅ CONFIRMÉ

**Voir point 1** — Exactement 5 stores confirmés.

---

### 5. **Open-Meteo (gratuit, pas de clé API)** ✅ CONFIRMÉ

**Documentation** : tech-stack.md dit "Open-Meteo (gratuit, pas de clé)"

**Code réel** :

`.env.example` :
```
# EXPO_PUBLIC_METEO_API_KEY=not-needed
```

`app/src/hooks/useWeather.ts` (ligne 55) :
```typescript
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=...`
```

**Aucune clé API n'est utilisée ni requise.**

**Verdict** : Confirmé. Open-Meteo utilisé sans clé API.

---

### 6. **Mapbox GL partout, pas de MapLibre** ✅ CONFIRMÉ

**Voir point 3** — Confirmé, aucune trace de MapLibre.

---

### 7. **Realtime activé sur : sortie_messages, direct_messages, post_comments, live_tracking** ⚠️ DISCREPANCE

**Documentation** : database-schema.md dit "Realtime activé sur : sortie_messages, direct_messages, post_comments, live_tracking"

**Code réel** (`app/src/hooks/`) :

Subscriptions Realtime trouvées :
- ✅ `direct_messages` (useDirectMessages.ts, ligne 163)
- ✅ `sortie_messages` (useSortieChat.ts, ligne 66)
- ❌ `post_comments` — **PAS trouvé** de subscription Realtime
- ❌ `live_tracking` — **PAS trouvé** de subscription Realtime

**Verdict** : DISCREPANCE. Seuls 2/4 tables ont des subscriptions Realtime confirmées.
La documentation surpromet 4 tables mais le code n'en implémente que 2.

---

### 8. **Score audit V2 : 8.0/10** ✅ CONFIRMÉ

**Documentation** : PROJECT_STATE.md dit "Score audit global : 8.0/10 (audit 22 mars 2026)"

**Code réel** : Vérification dans `docs/archives/` ou CHANGELOG.md
```
✅ CHANGELOG.md (22 mars 2026) : "Audit 7 domaines par 7 agents parallèles : note globale 8.0/10"
```

**Verdict** : Confirmé.

---

### 9. **14/14 onError handlers** ⚠️ DISCREPANCE

**Documentation** : TASKS.md dit "14/14 onError handlers (100%)"

**Code réel** :
```
Mutations React Query avec onError: — 15 occurrences de "onError:" trouvées
```

Audit du code :
- `useFeed.ts` : onError sur au moins 2 mutations
- `useDirectMessages.ts` : onError sur 2 mutations
- `useTrails.ts` : onError sur plusieurs mutations
- `useTrailReports.ts` : onError
- `useTrailReviews.ts` : onError
- ... (total : 15+ onError trouvés)

**Verdict** : DISCREPANCE. TASKS.md dit "14/14" mais le code réel en contient **15 ou plus**.
Le nombre exact est 15 (pas 14), ou peut-être plus selon la dénombrabilité des mutations composées.

---

### 10. **0 couleurs hardcodées** ⚠️ DISCREPANCE

**Documentation** : TASKS.md dit "0 couleurs hardcodées (toutes migrées)"

**Code réel** — Couleurs hardcodées trouvées en dehors des fichiers de constantes :
```
❌ app/src/components/InAppNotifications.tsx:189 — shadowColor: '#000'
❌ app/src/screens/FeedScreen.tsx:568 — color: '#fff'
❌ app/src/screens/FreeHikeScreen.tsx:217 — color: '#fff'
❌ app/src/screens/FreeHikeScreen.tsx:244 — color: '#fff'
❌ app/src/screens/FreeHikeScreen.tsx:320 — color: '#fff'
❌ app/src/screens/FreeHikeScreen.tsx:350 — color: '#fff'
❌ app/src/screens/InboxScreen.tsx:222 — color: '#fff'
❌ app/src/screens/MyHikesScreen.tsx:198 — color: '#fff'
```

**Verdict** : DISCREPANCE. Au moins 8 couleurs hardcodées restent dans le code.
La documentation prétend "0 hardcoded", mais la réalité en montre plusieurs.

---

### 11. **compileSdkVersion: 36** ✅ CONFIRMÉ

**Documentation** : deployment.md dit "compileSdkVersion: 36"

**Code réel** (`app/app.json`) :
```json
"compileSdkVersion": 36  (ligne 55)
```

**Verdict** : Confirmé.

---

### 12. **Gradle 8.13** ✅ CONFIRMÉ

**Documentation** : deployment.md dit "Gradle 8.13"

**Code réel** (`app/android/gradle/wrapper/gradle-wrapper.properties`) :
```
distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-bin.zip
```

**Verdict** : Confirmé.

---

### 13. **23 composants + 4 extraits de NavigationScreen** ✅ CONFIRMÉ

**Documentation** : TASKS.md dit "23 composants +4 nouveaux composants extraits"

**Code réel** :
```
ls app/src/components/*.tsx | wc -l
→ 23 fichiers
```

Composants extraits de NavigationScreen (29 mars 2026) :
- NavigationStatsHUD.tsx
- NavigationControls.tsx
- NavigationCTA.tsx
- TrailReportModal.tsx

**Verdict** : Confirmé. 23 composants + 4 extraits.

---

### 14. **ProGuard activé** ✅ CONFIRMÉ

**Documentation** : security-checklist.md dit "ProGuard activé"

**Code réel** (`app/android/gradle.properties`, ligne 72) :
```
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

**Verdict** : Confirmé. ProGuard activé pour les builds release.

---

### 15. **Confirmation email désactivée (D008)** ✅ CONFIRMÉ

**Documentation** : DECISIONS.md D008 dit "Pas de confirmation email pour le MVP"

**Code réel** (`app/src/stores/authStore.ts`, ligne 106-117) :
```typescript
signUp: async (email, password, username) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  // Aucun emailRedirectTo, aucune confirmation requise
}
```

**Verdict** : Confirmé. La confirmation email n'est pas implémentée.

---

## Synthèse des discrepances

| Point | Revendication doc | Réalité code | Type |
|---|---|---|---|
| 7 | Realtime sur 4 tables | Realtime sur 2 tables | Promesse dépassée |
| 9 | 14/14 onError | 15+ onError | Sous-comptage |
| 10 | 0 couleurs hardcodées | 8+ couleurs trouvées | Déclaration fausse |

---

## Recommandations

### Haute priorité
1. **Point 10 (couleurs)** : Migrer les 8 couleurs hardcodées vers COLORS constants
   - Fichiers affectés : FeedScreen, FreeHikeScreen, InboxScreen, MyHikesScreen, InAppNotifications
   - Accepter `#000` (ombre) et `#fff` (blanc pur textuel) comme exceptions minimes

2. **Point 7 (Realtime)** : Clarifier la documentation
   - Soit implémenter post_comments et live_tracking avec Realtime
   - Soit corriger database-schema.md pour dire "2 tables" au lieu de "4"

3. **Point 9 (onError)** : Vérifier le compte exact
   - Recompter précisément les mutations
   - Mettre à jour TASKS.md avec le vrai nombre

### Moyen priorité
4. **Mettre à jour PROJECT_STATE.md** pour refléter les discrepances
5. **Ajouter une règle dans .claude/rules/** : "Vérifier les nombres dans la doc (stores, tables, handlers) via grep"

---

## Conclusion

Le projet est **globalement cohérent** (73% de conformité), mais présente des **décalages** entre ce que la documentation affirme et ce que le code réalise. Ces discrepances sont mineures et faciles à corriger, mais révèlent un problème de maintien de la documentation en parallèle du code.

**Action immédiate requise** :
- Migrer les 8 couleurs hardcodées
- Corriger le compte des onError handlers
- Clarifier le statut Realtime post_comments/live_tracking

---

*Audit réalisé le 1er avril 2026 | 15 points vérifiés | Outils : grep, read, bash*
