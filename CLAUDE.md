# CLAUDE.md — Randonnée Réunion
> Fichier de contexte lu automatiquement par Claude Code à chaque session.
> Mis à jour au fil du projet. Ne pas supprimer.

---

## 🗺️ C'est quoi ce projet ?

Application mobile de randonnée **100% dédiée à l'île de La Réunion**.
Stack cross-platform iOS + Android, fonctionnement hors-ligne, gamification territoriale.

**Différenciateurs clés vs concurrents :**
- Seule app avec intégration officielle état des sentiers OMF en temps réel
- Carte de l'île qui se colorise au fur et à mesure qu'on réalise des sentiers
- Feature "Sorties" : planifier une rando et inviter d'autres randonneurs avec chat groupe
- Fonctionne sans réseau sur le terrain (cartes .pmtiles offline)

---

## ⚡ Stack technique (décisions finales)

| Composant | Choix | Pourquoi |
|---|---|---|
| Framework mobile | **React Native + Expo** | Écosystème MapLibre mature, TypeScript |
| Cartographie | **MapLibre GL Native** | Open-source, offline natif, pas de licence restrictive |
| Format cartes offline | **PMTiles** | Fichier unique par sentier, téléchargement atomique |
| Backend | **Supabase** | PostgreSQL + PostGIS inclus, Realtime pour le chat, Auth, Storage |
| BDD géospatiale | **PostGIS** | Requêtes spatiales (sentiers dans un rayon, bbox) |
| State management | **Zustand** | Léger, compatible Expo |
| Data fetching | **React Query** | Cache, pagination, offline support |
| Navigation | **React Navigation v6** | Standard Expo |
| Paiements | **RevenueCat** | Gestion abonnements iOS + Android |
| Analytics | **PostHog** | RGPD-friendly, event tracking |
| Push notifications | **Expo Notifications** | Cross-platform |
| Chat temps réel | **Supabase Realtime** | Déjà dans la stack, subscriptions PostgreSQL |

---

## 📁 Structure du projet (cible)

```
/
├── CLAUDE.md                    ← Tu es ici
├── memory/
│   └── PROJECT_MEMORY.md        ← Mémoire détaillée, décisions, contexte
├── docs/
│   ├── PRD_Randonner_Reunion.md
│   ├── ARCHITECTURE_Randonner_Reunion.md
│   ├── ANALYSE_CONCURRENTIELLE.md
│   ├── ROADMAP.md
│   └── SPRINT_PLANNING.md
└── app/                         ← Code React Native (créé au Sprint 1)
    ├── src/
    │   ├── screens/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   └── types/
    ├── supabase/
    │   ├── migrations/
    │   └── functions/
    └── scripts/                 ← Import sentiers, génération PMTiles
```

---

## 🏃 Phase actuelle

**SPRINT 1 — Fondations** (Jours 1–5)

Prochaine tâche : **S1-01** — Init projet Expo + TypeScript

Consulte `docs/SPRINT_PLANNING.md` pour la liste complète des tâches et les **prompts Claude Code prêts à utiliser**.

---

## 🗄️ Schéma BDD (résumé)

Tables principales Supabase :
- `trails` — sentiers (PostGIS : start_point, bbox)
- `trail_conditions` — état OMF (cache 1h)
- `user_profiles` — étend auth.users (is_premium, premium_until)
- `user_activities` — sentiers réalisés (validation GPS ou manuelle)
- `map_zones` — zones géographiques pour la gamification (GeoJSON)
- `trail_zones` — liaison sentiers ↔ zones
- `sorties` — événements rando planifiés (feature sociale)
- `sortie_participants` — membres d'une sortie
- `sortie_messages` — chat groupe par sortie (Realtime)

Script SQL complet : `docs/ARCHITECTURE_Randonner_Reunion.md` → Section 4

---

## 💰 Modèle freemium

| Feature | Gratuit | Premium |
|---|---|---|
| Fiches sentiers | ✅ Illimité | ✅ |
| Cartes offline | 3 max | ✅ Illimité |
| GPS + Météo + OMF | ✅ | ✅ |
| Gamification carte île | ✅ | ✅ |
| Créer une Sortie | 1 active max | ✅ Illimité |
| Stats avancées | ❌ | ✅ |
| Export GPX | ❌ | ✅ |

Prix : **2,99€/mois** ou **19,99€/an**

---

## ⚠️ Points bloquants à résoudre

1. **API OMF** — Pas d'API publique documentée. Solution MVP : scraping `sentiers.reunion.fr` + cache 1h. Négocier partenariat officiel en parallèle.
2. **Droits données IGN** — Valider l'utilisation des données géographiques IGN pour les tuiles. Fallback : OpenStreetMap (libre).
3. **Source données sentiers** — Scraping Randopitons.re (550 sentiers) ou accord data avec OMF/IRT.

---

## 🤝 Feature Sorties (Sprint 6 — après lancement)

Système de randonnées sociales planifiées :
- Créer un événement rando (sentier + date + heure + nb places)
- Rejoindre une sortie existante
- Chat groupe temps réel (Supabase Realtime)
- Partage de position live entre participants pendant la rando
- Rappel push J-1 avec météo du jour automatique

Spec complète : `docs/PRD_Randonner_Reunion.md` → Section P1 "Feature Sorties"

---

## 📏 Conventions de code

- **TypeScript strict** — pas de `any`
- **Composants** : PascalCase (`TrailCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useTrails.ts`)
- **Prompts qui ont bien marché** : logger dans `memory/PROMPTS.md`
- **Un commit par tâche** du sprint planning (ex: `feat: S1-01 init expo project`)
- **Tests manuels sur device réel** avant de passer à la tâche suivante (GPS surtout)

---

## 🔄 Comment mettre à jour ce fichier

À chaque fin de sprint, mettre à jour :
1. La section "Phase actuelle" avec le sprint en cours
2. Les "Points bloquants" résolus ou nouveaux
3. La structure du projet si de nouveaux dossiers ont été créés

Ne jamais supprimer les décisions techniques déjà prises — les annoter si elles changent.
