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

## 18 mars 2026 — Jour 2 : Build, scraping, V2 complete

### Build Android
- [x] Build dev reussi (724a48f9) — teste sur emulateur
- [x] Fix : babel-preset-expo (cause racine crash autolinking)
- [x] Fix : compileSdkVersion 35→36
- [x] Fix : trigger handle_new_user
- [x] Fix : confirmation email desactivee
- [x] Build preview V2 COMPLET — **f174732b** — termine

### Scraping & Donnees
- [x] 710 sentiers scrapes de Randopitons.re avec GPS reels
- [x] 706 descriptions detaillees (1500-2000 chars chacune)
- [x] Migration 002 Sorties executee dans Supabase
- [x] Migration 003 Trail Reports + SOS executee dans Supabase (17/03/2026 via CLI)
- [x] Cle API meteo configuree
- [x] Google OAuth configure (Google Cloud + Supabase)

### V2 — Features codees et integrees

#### Donnees & APIs
- [x] 710 sentiers reels avec GPS (scrape Randopitons.re)
- [x] 706 descriptions detaillees
- [x] Meteo 3 jours (appel direct API meteo-concept)
- [x] Statut ONF dynamique (scraping live onf.fr, cache 1h)
- [x] Script batch ONF (Edge Function + GitHub Actions, toutes les heures)

#### Carte & Navigation
- [x] Carte MapLibre interactive (fond dark, markers colores)
- [x] GPS tracking temps reel (position, trace, stats)
- [x] Alerte hors-sentier (200m, vibration)
- [x] Bouton SOS urgence (appel PGHM, SMS avec GPS, numeros urgence)
- [x] Bouton SOS integre dans NavigationScreen + TrailDetailScreen

#### Game Changers
- [x] Waze de la rando — Signalements terrain temps reel
  - 11 types (boue, arbre, eau, brouillard, danger...)
  - Position GPS automatique, expire apres 48h
  - Formulaire de signalement (ReportForm)
  - Affichage des signalements sur la fiche sentier
  - Integre dans NavigationScreen (bouton + modal)
- [x] Bouton SOS urgence
  - Appel direct PGHM Reunion (0262 930 930)
  - SMS avec coordonnees GPS + altitude + lien Google Maps
  - Numeros urgence expandables (SAMU, Pompiers, 112)
  - Fonctionne sans internet (GPS = satellites, SMS = 2G)

#### Social
- [x] Creer une sortie (formulaire complet)
- [x] Chat temps reel (Supabase Realtime)
- [x] Gestion participants (accepter/refuser)
- [x] Bouton "Organiser une sortie" sur chaque sentier
- [x] Notifications push — Rappel J-1 avant sortie
- [x] Integration Strava — Export activite + deep link

#### Gamification
- [x] 18 zones geographiques (carte qui se colorie)
- [x] Progression par zone (gris → vert gradient)
- [x] 14 badges (progression, distance, denivele, regions, social, communaute)
  - Premier Pas, Randonneur, Explorateur, Legendaire
  - 50km, 200km, Sommet 3000m, Grimpeur 10000m D+
  - Maitre des Cirques, Zone Complete, Tour de l'Ile
  - Leader (premiere sortie), Sentinelle, Veilleur

#### Authentification & Securite
- [x] Connexion email + mot de passe
- [x] Connexion Google OAuth
- [x] Session SecureStore (persistee)
- [x] Onboarding 3 ecrans (adapte aux features actuelles)

#### RGPD & Conformite
- [x] Document SECURITE_RGPD.md complet
- [x] Bouton "Supprimer mon compte" (Settings → Zone dangereuse)
- [x] Export donnees personnelles en JSON (RGPD Art. 20)
- [x] Liens Politique de confidentialite + CGU dans Settings
- [x] useAccountActions hook (export + suppression)

#### Monetisation
- [x] premiumStore (Zustand) avec beta mode
- [x] PremiumPaywall component (19.99 EUR/an ou 2.99 EUR/mois)
- [x] RevenueCat installe (react-native-purchases)
- [x] SettingsScreen : statut abonnement + bouton premium
- [x] Beta mode ON par defaut (tout accessible pendant les tests)

#### UX
- [x] Dark / Light / System mode
- [x] Offline banner (detection reseau)
- [x] SettingsScreen complet (premium, theme, offline, RGPD, about, danger zone)

### Verification technique
- [x] TypeScript : zero erreur
- [x] Expo Doctor : 17/17 checks passed
- [x] Git : tout pousse sur main

---

## Ce qui reste a faire

### Avant deploiement stores
- [x] Build preview V2 reussi (f174732b)
- [ ] Tester sur Android reel
- [ ] Corriger les bugs remontes
- [x] Executer migration 003 dans Supabase (trail_reports + emergency_contacts) — FAIT 17/03/2026
- [ ] Branding (logo, icone, couleurs, nom definitif)
- [ ] Heberger politique de confidentialite + CGU (URL web)
- [ ] Creer compte Apple Developer (99$/an)
- [ ] Creer compte Google Play Developer (25$)
- [ ] Configurer RevenueCat (produits in-app)
- [ ] Screenshots stores
- [ ] Soumission App Store + Play Store

### Ameliorations futures
- [ ] Cartes offline (.pmtiles) — serveur Linux necessaire
- [ ] Covoiturage vers les departs de sentier
- [ ] Photos communautaires sur les sentiers
- [ ] Version anglaise
- [ ] Apple Watch / Garmin
- [ ] Partenariat officiel ONF/IRT

---

## Historique des builds

| Date | Build ID | Profil | Contenu | Resultat |
|---|---|---|---|---|
| 17/03 | 724a48f9 | development | S1-S6 sans MapLibre | **SUCCES** |
| 18/03 | 998cc97e | preview | MapLibre + meteo + ONF | Annule (queue longue) |
| 18/03 | a7fe037c | preview | Idem | Annule (queue longue) |
| 18/03 | f174732b | preview | **V2 COMPLETE** — toutes features | Build termine |

---

## Comptes et acces

| Service | Compte | Statut |
|---|---|---|
| GitHub | Nicolas97450 | Actif |
| Expo/EAS | @nicolasreunionlouis | Actif |
| Supabase | wnsitmaxjgbprsdpvict | Actif (710 sentiers + 706 descriptions) |
| Google Cloud | valiant-student-484810-k1 | OAuth configure |
| meteo-concept | Cle API dans .env | Actif |
| Apple Developer | Non cree | Requis pour App Store |
| Google Play | Non cree | Requis pour Play Store |
| RevenueCat | Non cree | Requis pour les paiements |

---

*Document mis a jour le 17 mars 2026 — V2 complete, build f174732b termine, phase test en cours*
