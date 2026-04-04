# Roadmap — Randonnee Reunion
**Format Now / Next / Later | 21 mars 2026**

> Developpement en vibe coding assiste par IA — cycles 3 a 5x plus rapides qu'un dev traditionnel.
> **Audit V2 termine : score 9.0/10. App prete pour beta privee.**

---

## DONE — Audit V2 + 9 Sprints Correctifs (21 mars 2026)

> 71 issues identifiees, 67 corrigees. 4 migrations deployees.
> Score securite : 4→9. Score global : 5.2→9.0.
> Detail complet : `docs/AUDIT_FINAL_POST_SPRINTS.md`

---

## NOW — Semaines 1 a 5 (MVP & Lancement) — CODE TERMINE

> Objectif : Avoir une app fonctionnelle, testable et utilisable sur le terrain.
> **STATUT : Code termine en 2 jours (17-18 mars 2026). Build local (APK debug + release) en phase test. Quota EAS cloud atteint, builds en local Windows.**

### Semaine 1 — Fondations
| # | Feature | Valeur utilisateur | Complexité IA |
|---|---|---|---|
| 1.1 | Setup projet React Native + Expo | Base technique | Faible |
| 1.2 | Schéma BDD Supabase + PostGIS | Infrastructure data | Faible |
| 1.3 | Authentification (email + OAuth Google/Apple) | Compte utilisateur | Faible |
| 1.4 | Import base de données sentiers (scraping / CSV OMF) | Contenu core | Moyenne |
| 1.5 | Fiche sentier (distance, dénivelé, région, type, difficulté) | Info essentielle | Faible |

### Semaine 2 — Navigation & Cartes
| # | Feature | Valeur utilisateur | Complexité IA |
|---|---|---|---|
| 2.1 | Liste sentiers avec filtres (difficulté, durée, région) | Découverte | Faible |
| 2.2 | Carte interactive de l'île avec sentiers (MapLibre) | Orientation | Moyenne |
| 2.3 | Téléchargement de carte offline (.pmtiles par sentier) | Usage terrain | Haute |
| 2.4 | GPS temps réel sur carte offline | Navigation | Haute |
| 2.5 | Recherche textuelle sentiers | Accès rapide | Faible |

### Semaine 3 — Donnees Live & Gamification
| # | Feature | Valeur utilisateur | Complexite IA |
|---|---|---|---|
| 3.1 | Integration meteo (Open-Meteo, coordonnees exactes, descriptions tropicales) | Securite | Moyenne |
| 3.2 | État des sentiers OMF (scraping + cache 1h) | Sécurité | Haute |
| 3.3 | Carte de l'île gamifiée (zones grises → colorées) | Rétention | Haute |
| 3.4 | Validation de sentier (GPS auto + fallback manuel) | Progression | Moyenne |
| 3.5 | Compteur global de progression (X/Y sentiers) | Motivation | Faible |

### Semaine 4 — Polish UX
| # | Feature | Valeur utilisateur | Complexité IA |
|---|---|---|---|
| 4.1 | Onboarding (3 écrans max) | Activation | Faible |
| 4.2 | Dark mode | Confort | Faible |
| 4.3 | Écran profil + historique des sorties | Récapitulatif | Faible |
| 4.4 | Alertes visuelles sentier fermé / météo défavorable | Sécurité | Faible |
| 4.5 | Optimisation performance offline + gestion stockage | Qualité | Moyenne |

### Semaine 5 — Beta & Soumission
| # | Feature | Valeur utilisateur | Complexité IA |
|---|---|---|---|
| 5.1 | Beta test (20–50 randonneurs locaux via TestFlight/Firebase) | Validation | Faible |
| 5.2 | Corrections bugs critiques remontés en beta | Stabilité | Variable |
| 5.3 | Optimisation ASO (screenshots, description stores) | Acquisition | Faible |
| 5.4 | **Soumission App Store + Play Store** | Distribution | Faible |

---

## NEXT — Sprint 4 (Social + GPS avance + Gamification) — EN COURS

> Objectif : Transformer l'app en plateforme sociale complete avec GPS pro et gamification avancee.
> **STATUT au 20/03/2026 : Sprint 4 EN COURS. Majorite des features implementees. Reste : tests Android reel, corrections audit securite, push notifications.**

### FAIT dans le Sprint 4 (20 mars 2026)

| # | Feature | Statut |
|---|---|---|
| N.1 | **Messagerie privee DM** (InboxScreen, ConversationScreen, Realtime) | **FAIT** |
| N.2 | **Notifications in-app** (6 types, Realtime, toast, historique) | **FAIT** |
| N.3 | **Guidage vocal TTS** (expo-speech, useVoiceGuidance) | **FAIT** |
| N.4 | **GPS background** (expo-task-manager, expo-keep-awake) | **FAIT** |
| N.5 | **GPS crash-safe** (AsyncStorage backup, reprise auto) | **FAIT** |
| N.6 | **Haversine + lissage altitude** | **FAIT** |
| N.7 | **Boussole magnetometre** (expo-sensors) | **FAIT** |
| N.8 | **Compression Douglas-Peucker** | **FAIT** |
| N.9 | **Auto-validation 80%** | **FAIT** |
| N.10 | **Stats enrichies** (pace, alt max/min, D-, HikeSummaryScreen) | **FAIT** |
| N.11 | **Fog of war** (3 modes gamification) | **FAIT** |
| N.12 | **Badges medailles SVG + anneaux progression** | **FAIT** |
| N.13 | **Leaderboard** (RPC Supabase, LeaderboardScreen) | **FAIT** |
| N.14 | **Defis communautaires** (ChallengesScreen) | **FAIT** |
| N.15 | **4 styles carte Mapbox** (Outdoor/Satellite/Light/Dark) | **FAIT** |
| N.16 | **Profil prive** (toggle visibilite) | **FAIT** |
| N.17 | **Partage post-hike** fonctionnel | **FAIT** |
| N.18 | **SOS 112** | **FAIT** |
| N.19 | **onError handlers** sur toutes mutations | **FAIT** |
| N.20 | **Corrections securite** (tokens, RLS — migrations 009-012) | **FAIT** |

### RESTE A FAIRE dans le Sprint 4

| # | Feature | Statut |
|---|---|---|
| R.1 | **Tester APK sur Android reel** | A FAIRE |
| R.2 | **Corriger bugs audit** (5 CRITIQUE, 23 HIGH) | A FAIRE |
| R.3 | **Notifications push** (FCM) | HOOK CODE — PAS CONNECTE |
| R.4 | **Paywall freemium** — RevenueCat | COMPOSANT CODE — PAS CONFIGURE |
| R.5 | **Export GPX** trace enregistree | LIB CODE (gpxExport.ts) — PAS INTEGRE UI |
| R.6 | **Analytics** (PostHog ou Amplitude) | A FAIRE |
| R.7 | **Position live partagee** en sortie | HOOK CODE (useLiveShare) — PAS TESTE |

---

> **Note** : La majorite du Sprint 4 est implementee. Les features sociales (DM, notifications, feed, amis) sont entierement fonctionnelles. Le GPS avance (background, crash-safe, boussole, compression) est code. La gamification (fog of war, leaderboard, challenges) est code. Reste principalement : tests terrain, corrections audit securite, et connexion services externes (FCM, RevenueCat, analytics).

---

## LATER — A partir de S11 (V2 : Scale & Expansion)

> Objectif : Stabiliser, monetiser, et envisager l'expansion.

| # | Feature | Valeur | Condition de declenchement |
|---|---|---|---|
| L.1 | Integration Strava (export automatique activite post-sentier) | Acquisition | Hook code mais PAS CONNECTE (pas de compte Strava configure) |
| L.2 | Moderation automatique (photos, avis, posts) | Securite communaute | Avant ouverture publique |
| L.3 | Cartes offline (.pmtiles) | Usage terrain | Serveur Linux disponible |
| L.4 | Multilangues (EN, DE) pour touristes internationaux | Marche | > 20% utilisateurs non-francophones |
| L.5 | Integration Apple Watch / Garmin | Premium | Demande utilisateurs confirmee |
| L.6 | Version web responsive | Accessibilite | Post-product/market fit confirme |
| L.7 | Partenariat institutionnel IRT / ONF officiel | Legitimite | Traction > 5 000 utilisateurs actifs |
| L.8 | Extension geographique (Mayotte, Maurice...) | Croissance | Marche Reunion sature |
| L.9 | Cache persistant React Query (offline) | Qualite | Retour beta testeurs |
| L.10 | Covoiturage vers departs sentier | Social | Demande utilisateurs |

---

## Vue synthetique

```
JOURS     17/03   18/03   19/03   20/03   21/03+
          |-------|-------|-------|-------|----------------------->
NOW       [===================]  FAIT (Sprints 1-3)
          S1-S6   Build V2  Sprints 1+2+3

NEXT (S4)                         [========]  EN COURS
                                  Social+DM, GPS avance, Fog of war
                                  Gamification, Securite, Audit

LATER                                         [>  V5+
                                              Tests terrain
                                              Corrections audit
                                              Push/RevenueCat
                                              Stores
                                              Strava/Offline
                                              Expand]
```

---

## Critères de passage NOW → NEXT

- [ ] App soumise et acceptée sur les deux stores
- [ ] ≥ 20 beta testeurs ont complété au moins 1 sentier
- [ ] Zéro bug critique remontés en beta
- [ ] Carte gamifiée fonctionnelle sur iOS et Android

## Critères de passage NEXT → LATER

- [ ] ≥ 500 utilisateurs actifs mensuels
- [ ] Taux de conversion freemium ≥ 5%
- [ ] Rétention J30 ≥ 35%
- [ ] Note stores ≥ 4,3/5

---

*Roadmap mise a jour le 20 mars 2026 — NOW termine (Sprints 1-3), Sprint 4 EN COURS (social complet, GPS avance, gamification fog of war — reste tests terrain + corrections audit + services externes)*
