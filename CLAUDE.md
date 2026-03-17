# CLAUDE.md — Randonnee Reunion
> Fichier de contexte lu automatiquement par Claude Code a chaque session.
> Derniere mise a jour : 18 mars 2026

---

## C'est quoi ce projet ?

Application mobile de randonnee **100% dediee a l'ile de La Reunion**.
Stack cross-platform iOS + Android, fonctionnement hors-ligne, gamification territoriale.

**Repo GitHub** : https://github.com/Nicolas97450/randonnee-reunion
**Compte Expo** : @nicolasreunionlouis/randonnee-reunion
**Supabase** : https://wnsitmaxjgbprsdpvict.supabase.co
**API Meteo** : meteo-concept.com (cle dans .env)

---

## Stack technique

| Composant | Choix |
|---|---|
| Framework mobile | React Native + Expo SDK 55 |
| Cartographie | MapLibre GL Native v10 |
| Format cartes offline | PMTiles (pas encore genere) |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime) |
| State management | Zustand |
| Data fetching | React Query (@tanstack/react-query) |
| Navigation | React Navigation v6 (bottom tabs + native stack) |
| Animations | React Native Reanimated + Gesture Handler |
| Bottom sheet | @gorhom/bottom-sheet |
| Meteo | API meteo-concept.com (appel direct) |
| Statut ONF | Scraping live onf.fr (cache 1h) |
| Auth | Supabase Auth (email + Google OAuth) |
| Build | EAS Build (Expo) |

---

## Structure du projet

```
/
├── CLAUDE.md
├── memory/PROJECT_MEMORY.md
├── docs/
│   ├── PRD_Randonner_Reunion.md       <- Specs fonctionnelles
│   ├── ARCHITECTURE_Randonner_Reunion.md
│   ├── ROADMAP.md
│   ├── SPRINT_PLANNING.md
│   ├── AVANCEMENT.md
│   ├── SECURITE_RGPD.md
│   └── strategie/                     <- Documents business
│       ├── BUSINESS_PLAN.md
│       ├── PLAN_LANCEMENT.md
│       ├── ANALYSE_CONCURRENTIELLE.md
│       └── STORE_LISTING.md
├── private/                           <- Dashboards + analyses (pas sur git)
│   ├── GROUPES_RESEAUX_SOCIAUX.xlsx
│   ├── dashboards/                    <- Tableaux de bord HTML
│   │   ├── dashboard-complet.html     <- 3 onglets : Business + Marche + Lancement
│   │   ├── dashboard-version-test.html <- Recap version test
│   │   ├── dashboard-business-plan.html
│   │   ├── dashboard-plan-lancement.html
│   │   └── checklist-test-app.html
│   └── analyses/                      <- Analyses des autres agents
│       ├── (marketing)
│       ├── (legal)
│       ├── (risques)
│       └── (projet)
└── app/
    ├── App.tsx
    ├── app.json
    ├── eas.json
    ├── react-native.config.js
    ├── .env                        <- Secrets (non commite)
    ├── src/
    │   ├── screens/               <- 11 ecrans
    │   ├── components/            <- 10 composants
    │   ├── hooks/                 <- 10 hooks
    │   ├── stores/                <- 4 stores Zustand
    │   ├── navigation/            <- Navigateurs
    │   ├── lib/                   <- Utilitaires
    │   ├── types/                 <- Types TypeScript
    │   └── constants/             <- Theme, couleurs, carte
    └── supabase/
        ├── migrations/
        │   ├── 001_initial_schema.sql
        │   └── 002_sorties.sql
        ├── seed/
        │   ├── seed_all_trails.sql        <- 710 sentiers
        │   ├── update_descriptions.sql    <- 706 descriptions
        │   └── desc_part1-4.sql           <- Descriptions decoupees
        └── functions/                     <- Edge Functions (pas deployees)
```

---

## Donnees en base (Supabase)

- **710 sentiers** scrapes de Randopitons.re avec GPS reels
- **706 descriptions** detaillees (1500-2000 caracteres)
- **17 regions** couvertes
- Tables : trails, trail_conditions, user_profiles, user_activities, map_zones, trail_zones, sorties, sortie_participants, sortie_messages

---

## Phase actuelle

**BUILD PREVIEW V2 TERMINE** — APK autonome avec toutes les features.
Build ID : f174732b
Lien : https://expo.dev/accounts/nicolasreunionlouis/projects/randonnee-reunion/builds/f174732b-1ae9-43b3-ad1b-962afa02e5c6

Prochaines etapes :
1. Tester l'APK sur Android reel (checklist : private/checklist-test-app.html)
2. Corriger les bugs remontes
3. Executer migration 003 dans Supabase (trail_reports + emergency_contacts)
4. Branding (logo, couleurs, nom definitif)
5. Comptes stores (Apple Developer 99$/an + Google Play 25$)
6. Nom de domaine (randonnee-reunion.re ~12 EUR) pour heberger politique confidentialite + CGU
7. Build production + soumission stores

---

## Points de vigilance build

- `babel-preset-expo` DOIT etre dans package.json (cause racine du crash autolinking)
- `compileSdkVersion: 36` requis (androidx.core 1.17)
- NE PAS mettre `kotlinVersion` dans app.json (laisser le defaut)
- NE PAS mettre `@maplibre/maplibre-react-native` dans les plugins app.json
- `react-native.config.js` avec packageName explicite (pour community autolinking)
- Le `.env` contient les secrets (Supabase anon + service_role + meteo) — ne pas commiter
- `SUPABASE_SERVICE_ROLE_KEY` dans `.env` — cle admin, JAMAIS cote client (pas de prefix EXPO_PUBLIC_)
- Confirmation email DESACTIVEE dans Supabase Auth
- Supabase CLI lie au projet (`supabase link` fait) — utiliser `npx supabase db query --linked "SQL"` pour executer du SQL

---

## Conventions de code

- TypeScript strict — pas de `any`
- Composants : PascalCase (`TrailCard.tsx`)
- Hooks : camelCase avec prefixe `use` (`useTrails.ts`)
- Commits : `feat: S1-01 description`
- Git flow : feature branches + merge --no-ff vers main
