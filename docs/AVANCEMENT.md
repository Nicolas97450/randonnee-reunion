# Avancement — Randonnee Reunion

---

## 17 mars 2026 — Jour 1 : Code des 6 sprints

- [x] Init Expo SDK 55 + TypeScript
- [x] Schema BDD PostgreSQL + PostGIS + RLS
- [x] Supabase client + Auth (email)
- [x] React Navigation (tabs + stack)
- [x] 20 sentiers seed
- [x] TrailCard + TrailListScreen avec filtres
- [x] MapLibre GL + carte interactive
- [x] GPS tracking temps reel
- [x] Alerte hors-sentier
- [x] Store offline (.pmtiles)
- [x] Edge Functions (meteo, ONF, tiles URL)
- [x] WeatherWidget + TrailStatusBadge
- [x] Gamification (18 zones, carte colorisable)
- [x] Onboarding 3 ecrans
- [x] Dark/Light mode + Settings
- [x] Feature Sorties (chat, participants)
- [x] Config EAS Build
- [x] Descriptions stores

---

## 18 mars 2026 — Jour 2 : Build, scraping, features completes

### Build Android
- [x] Build dev reussi (724a48f9) — teste sur emulateur
- [x] Fix : babel-preset-expo (cause racine crash autolinking)
- [x] Fix : compileSdkVersion 35→36
- [x] Fix : trigger handle_new_user
- [x] Fix : confirmation email desactivee
- [ ] Build preview en cours (a7fe037c) — APK autonome

### Scraping & Donnees
- [x] 710 sentiers scrapes de Randopitons.re avec GPS
- [x] 706 descriptions detaillees (1500-2000 chars)
- [x] Migration Sorties (002) executee
- [x] Cle API meteo configuree

### Nouvelles features
- [x] MapLibre reintegre (carte interactive)
- [x] Google OAuth (Supabase + Google Cloud Console)
- [x] Meteo 3 jours (appel direct API meteo-concept)
- [x] Statut ONF dynamique (scraping live onf.fr, cache 1h)
- [x] Bouton "Organiser une sortie" sur chaque sentier
- [x] Message inscription corrige

### Documentation
- [x] Dashboards HTML (business plan, analyse marche, plan lancement, version test)
- [x] Analyse concurrentielle enrichie (Rando Tec-Tec, ONF plateforme, WeRun)
- [x] Business plan + projections financieres
- [x] Plan de lancement Go-to-Market
- [x] Memory Claude Code mise a jour

---

## Ce qui reste a faire

### Priorite haute (apres tests)
- [ ] Tester l'APK preview sur Android reel
- [ ] Corriger les bugs remontes
- [ ] Branding (logo, icone, couleurs, nom definitif)

### Priorite moyenne
- [ ] Cartes offline (.pmtiles) — serveur Linux necessaire
- [ ] Build preview pour beta testeurs (10-50 personnes)
- [ ] Ameliorer les descriptions des sentiers sans description
- [ ] Compte Apple Developer (99$/an) + Google Play (25$)
- [ ] Soumission stores

### V2
- [ ] Notifications push (rappel J-1 sortie)
- [ ] Integration Strava
- [ ] Badges et recompenses
- [ ] Photos sentiers (user-generated)
- [ ] Version anglaise
- [ ] Scraping 550+ sentiers supplementaires

---

## Historique des builds

| Date | Build ID | Profil | Resultat |
|---|---|---|---|
| 17/03 | 6eabb122 | development | Echec (MapLibre plugin) |
| 17/03 | 005b1b20 | development | Echec (Kotlin 1.9.25) |
| 17/03 | 465f69bf | development | Echec (babel-preset-expo) |
| 17/03 | 724a48f9 | development | **SUCCES** |
| 17/03 | 22833d1e | preview | Annule (sans MapLibre) |
| 18/03 | a6a1e2dc | preview | Annule (queue trop longue) |
| 18/03 | a7fe037c | preview | **En cours** |

---

## Comptes et acces

| Service | Compte | Statut |
|---|---|---|
| GitHub | Nicolas97450 | Actif |
| Expo/EAS | @nicolasreunionlouis | Actif |
| Supabase | wnsitmaxjgbprsdpvict | Actif (schema + 710 sentiers) |
| Google Cloud | valiant-student-484810-k1 | OAuth configure |
| meteo-concept | Cle API dans .env | Actif |
| Apple Developer | Non cree | Requis pour App Store |
| Google Play | Non cree | Requis pour Play Store |

---

*Document mis a jour le 18 mars 2026*
