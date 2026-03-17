# PROJECT_MEMORY.md — Randonnee Reunion
> Memoire longue du projet. Mise a jour le 18 mars 2026.

---

## Porteur du projet

- **Nom** : Nicolas
- **Profil** : Data Analyst junior, Reunionnais
- **Approche dev** : Vibe coding avec Claude Code
- **Plateformes cibles** : iOS + Android
- **Date de demarrage** : 17 mars 2026

---

## Vision produit

Creer **la reference numerique pour la randonnee a La Reunion** :
- Toutes les infos officielles (sentiers, meteo, etat ONF)
- Cartes qui fonctionnent sans reseau (a venir)
- Gamification : colorier l'ile au fil des sentiers
- Feature sociale : organiser des randos en groupe avec chat

**Positionnement :** *"La premiere app qui te donne envie de decouvrir toute La Reunion — pas juste de t'y retrouver."*

---

## Comptes et acces

| Service | Compte | Statut |
|---|---|---|
| GitHub | Nicolas97450 | Actif — repo randonnee-reunion |
| Expo/EAS | @nicolasreunionlouis | Actif |
| Supabase | wnsitmaxjgbprsdpvict.supabase.co | Actif — 710 sentiers + 706 descriptions |
| Google Cloud | valiant-student-484810-k1 | OAuth configure pour Google Sign-In |
| meteo-concept | Cle API dans .env | Actif — 500 appels/jour gratuits |
| Apple Developer | Non cree | 99$/an — requis pour App Store |
| Google Play | Non cree | 25$ une fois — requis pour Play Store |

---

## Donnees en base

### Sentiers
- **710 sentiers** scrapes de Randopitons.re (17 mars 2026)
- **706 descriptions detaillees** (1500-2000 caracteres chacune)
- Coordonnees GPS reelles pour chaque sentier
- 190 sentiers "Ailleurs" (hors Reunion) exclus du scraping

### Repartition par region
| Region | Sentiers |
|---|---|
| Cote Ouest | 142 |
| Grand Sud Sauvage | 128 |
| Nord | 104 |
| Cote Est | 82 |
| Cirque de Cilaos | 80 |
| Cirque de Salazie | 59 |
| Cirque de Mafate | 52 |
| Massif du Volcan | 42 |
| Plaine des Cafres | 11 |
| Grand Benare | 9 |
| Plaine des Palmistes | 6 |

### Tables Supabase
- `trails` — 710 sentiers avec PostGIS
- `trail_conditions` — etats ONF (cache)
- `user_profiles` — profils utilisateurs
- `user_activities` — sentiers valides
- `map_zones` — 18 zones gamification
- `trail_zones` — liaison sentiers/zones
- `sorties` — evenements rando
- `sortie_participants` — membres
- `sortie_messages` — chat Realtime
- `trail_reports` — signalements terrain (migration 003)
- `user_emergency_contacts` — contacts urgence (migration 003)

---

## Historique des sprints

### Jour 1 — 17 mars 2026

**Sprint 1 :** Init Expo, Auth, BDD, Navigation, Liste sentiers
**Sprint 2 :** MapLibre, GPS tracking, cartes offline store, alerte hors-sentier
**Sprint 3 :** Meteo, ONF, gamification 18 zones, profil progression
**Sprint 4 :** Onboarding, dark/light mode, settings, offline banner
**Sprint 5 :** Config EAS Build, descriptions stores
**Sprint 6 :** Sorties sociales, chat temps reel, gestion participants

### Jour 2 — 18 mars 2026

- Build dev reussi (724a48f9) — teste sur emulateur Android
- Fix build : babel-preset-expo + compileSdkVersion 36 + trigger auth
- MapLibre reintegre dans le build
- Google OAuth code + configure (Supabase + Google Cloud)
- Meteo integree (appel direct API meteo-concept)
- Statut ONF dynamique (scraping live onf.fr)
- 710 sentiers scrapes de Randopitons.re
- 706 descriptions detaillees scrappees
- Build preview V2 termine (f174732b) — phase test en cours
- Migration 003 executee dans Supabase (trail_reports + user_emergency_contacts)
- Supabase CLI lie au projet (npx supabase db query --linked)
- Popup disclaimer SOS ajoutee dans SOSButton.tsx (premiere utilisation)
- Checkbox CGU obligatoire ajoutee dans RegisterScreen.tsx
- Documents legaux rediges (private/legal/politique-confidentialite.html + cgu.html)
- Brand guide cree (private/branding/brand-guide.html + design-tokens.json)
- Checklist pre-deploiement creee (docs/PRE_DEPLOIEMENT.md)
- Checklist de test creee (private/dashboards/checklist-test-app.html)
- Documents strategie crees (Business Plan, Plan Lancement, Store Listing, Analyse Concurrentielle)

---

## Decisions techniques

| # | Decision | Raison |
|---|---|---|
| 1 | React Native + Expo SDK 55 | MapLibre mature, TypeScript, Expo managed |
| 2 | MapLibre + PMTiles | Open-source, 100% offline, pas de licence Mapbox |
| 3 | Supabase | PostGIS inclus, Realtime pour chat, gratuit MVP |
| 4 | Meteo direct (pas Edge Function) | Pas besoin de deployer, l'app appelle l'API directement |
| 5 | ONF scraping direct | Pas de serveur necessaire, l'app scrape onf.fr a la demande |
| 6 | babel-preset-expo dans package.json | CRITIQUE — sans ca, l'autolinking crash sur EAS Build |
| 7 | compileSdkVersion 36 | Requis par androidx.core 1.17 |
| 8 | Confirmation email desactivee | Evite les problemes d'inscription pour le MVP |
| 9 | Supabase CLI lie au projet | Permet d'executer du SQL via `npx supabase db query --linked` |
| 10 | Disclaimer SOS popup | Obligation legale — avertissement premiere utilisation |
| 11 | Checkbox CGU obligatoire | Conformite RGPD — consentement explicite a l'inscription |

---

## Bugs resolus

| Bug | Cause | Fix |
|---|---|---|
| Build crash settings.gradle:29 | babel-preset-expo manquant | Ajoute dans package.json |
| Build crash KSP | kotlinVersion 1.9.25 incompatible Gradle 9 | Supprime l'override |
| Build crash compileSdk | androidx.core 1.17 requiert SDK 36 | compileSdkVersion: 36 |
| "database error saving new user" | Trigger handle_new_user crashait sur username null | Simplifie le INSERT |
| "Compte cree, verifie tes emails" | Message trompeur + confirmation email active | Message corrige + toggle desactive |
| Emulateur "system not responding" | Emulateur Android gourmand en RAM | Pas un bug — cliquer "Wait" |

---

## Concurrence — Points cles

| Concurrent | Sentiers Reunion | Notre avantage |
|---|---|---|
| Randopitons | 600+ | UX moderne, gamification, meteo, ONF, social |
| AllTrails | 495 | Donnees locales + OMF + gamification |
| Visorando | 17 ! | 710 sentiers vs 17 |
| Komoot | Collections | En crise (85% licencies) |
| Strava | 0 | Integration V2 (pas competition) |
| ONF Web | 850km | On a l'app mobile, eux non |

---

## Metriques cibles

| Metrique | Cible | Delai |
|---|---|---|
| Telechargements | 10 000 | M6 |
| Note stores | >= 4.5/5 | M3 |
| Retention J30 | >= 40% | M3 |
| Conversion freemium | >= 8% | M6 |
| Abonnes premium | 800 | M12 |

---

## Couts

| Poste | Cout |
|---|---|
| Infrastructure MVP | ~0 EUR/mois |
| Apple Developer | 99 USD/an |
| Google Play | 25 USD (une fois) |
| API meteo | Gratuit |
| Expo/EAS | Gratuit (30 builds/mois) |

---

## Documents de reference

### Docs techniques
| Doc | Chemin |
|---|---|
| PRD | docs/PRD_Randonner_Reunion.md |
| Architecture | docs/ARCHITECTURE_Randonner_Reunion.md |
| Roadmap | docs/ROADMAP.md |
| Sprint Planning | docs/SPRINT_PLANNING.md |
| Avancement | docs/AVANCEMENT.md |
| Securite RGPD | docs/SECURITE_RGPD.md |

### Docs strategiques (Business)
| Doc | Chemin |
|---|---|
| Business Plan | docs/strategie/BUSINESS_PLAN.md |
| Plan Lancement | docs/strategie/PLAN_LANCEMENT.md |
| Analyse Concurrentielle | docs/strategie/ANALYSE_CONCURRENTIELLE.md |
| Store Listing | docs/strategie/STORE_LISTING.md |

### Dashboards
| Tableau | Chemin |
|---|---|
| Dashboard complet | private/dashboards/dashboard-complet.html |
| Dashboard version test | private/dashboards/dashboard-version-test.html |
| Dashboard Business Plan | private/dashboards/dashboard-business-plan.html |
| Dashboard Plan Lancement | private/dashboards/dashboard-plan-lancement.html |
| Checklist test app | private/dashboards/checklist-test-app.html |

### Documents legaux & Branding
| Doc | Chemin |
|---|---|
| Politique de confidentialite | private/legal/politique-confidentialite.html |
| CGU | private/legal/cgu.html |
| Brand guide | private/branding/brand-guide.html |
| Design tokens | private/branding/design-tokens.json |

### Analyses externes
Les autres agents deposent leurs HTML ici :
- `private/analyses/` → Marketing, Legal, Risques, Projet

---

*Derniere mise a jour : 18 mars 2026 — Build V2 f174732b termine, migration 003 executee, documents legaux + brand guide crees, disclaimer SOS + checkbox CGU ajoutes*
