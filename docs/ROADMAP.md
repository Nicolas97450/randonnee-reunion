# Roadmap — Randonnee Reunion
**Format Now / Next / Later | 18 mars 2026**

> Developpement en vibe coding assiste par IA — cycles 3 a 5x plus rapides qu'un dev traditionnel.

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

## NEXT — Semaines 6 a 10 (Monetisation & Engagement) — PARTIELLEMENT CODE

> Objectif : Activer le modele freemium, engager les premiers utilisateurs, collecter des donnees.
> **STATUT au 18/03/2026 : Sorties + social codes et fonctionnels. Paywall/badges codes mais pas actifs. Notifications/Strava codes mais pas connectes. RevenueCat pas configure.**

| # | Feature | Valeur | Notes | Statut |
|---|---|---|---|---|
| N.1 | **Paywall freemium** (> 3 cartes offline = premium) | Revenus | Composant PremiumPaywall code, beta mode ON | **COMPOSANT CODE** — RevenueCat PAS configure |
| N.2 | Systeme de badges et recompenses (14 badges) | Gamification | Distance, denivele, regions, social | **CODE** |
| N.3 | Notifications push (rappel J-1 sortie) | Retention | Hook code, pas de serveur push | **HOOK CODE** — PAS CONNECTE |
| N.4 | Partage sortie sur reseaux sociaux (image generee auto) | Acquisition virale | Carte colorisee partageable | A faire |
| N.5 | Statistiques avancees (denivele cumule, km/mois, streak) | Engagement | Premium uniquement | A faire |
| N.6 | Suggestions sentiers basees sur localisation actuelle | Decouverte | Requete PostGIS | A faire |
| N.7 | Export GPX de sa propre trace enregistree | Utilite | Premium uniquement | A faire |
| N.8 | Analyse metriques J30 + iterations UX | Produit | Posthog ou Amplitude | A faire — analytics pas implemente |
| **N.9** | **Sorties — Creation d'evenements rando** | **Social** | **Tables sorties + participants** | **CODE ET FONCTIONNEL** |
| **N.10** | **Chat de groupe par Sortie (Supabase Realtime)** | **Social** | **Real-time subscriptions** | **CODE ET FONCTIONNEL** |
| **N.11** | **Position live partagee dans une Sortie** | **Securite groupe** | **Foreground uniquement** | **PAS CODE** |
| **N.12** | **Notifications Sorties (rappel J-1)** | **Engagement** | **Expo Push Notifications** | **HOOK CODE** — PAS CONNECTE |
| **N.13** | **Systeme d'amis** | **Social** | **Recherche, demande, accepter/refuser/supprimer** | **CODE ET FONCTIONNEL** |
| **N.14** | **Feed communaute** | **Social** | **Posts, likes, partage progression** | **CODE ET FONCTIONNEL** |
| **N.15** | **Photo de profil** | **Social** | **Upload Supabase Storage, 2MB max** | **CODE ET FONCTIONNEL** |

---

> **Note** : Les features sociales (N.9-N.10, N.13-N.15) sont entierement fonctionnelles. Les features "hook code mais pas connecte" (N.3, N.12) necessitent un serveur push ou une configuration externe pour fonctionner reellement. RevenueCat (N.1) necessite la creation d'un compte et la configuration des produits in-app.

---

## LATER — A partir de S11 (V2 : Communaute & Scale)

> Objectif : Faire de l'app une plateforme communautaire et envisager l'expansion.

| # | Feature | Valeur | Condition de déclenchement |
|---|---|---|---|
| L.1 | Integration Strava (export automatique activite post-sentier) | Acquisition | Hook code mais PAS CONNECTE (pas de compte Strava configure) |
| L.2 | Photos & avis utilisateurs sur les sentiers | Communauté | Ressources de modération disponibles |
| L.3 | Guidage vocal turn-by-turn sur sentier | Navigation | Partenariat contenu audio |
| L.4 | Multilangues (EN, DE) pour touristes internationaux | Marché | > 20% utilisateurs non-francophones |
| L.5 | Intégration Apple Watch / Garmin | Premium | Demande utilisateurs confirmée |
| L.6 | Version web responsive | Accessibilité | Post-product/market fit confirmé |
| L.7 | Partenariat institutionnel IRT / OMF officiel | Légitimité | Traction > 5 000 utilisateurs actifs |
| L.8 | Extension géographique (Mayotte, Maurice…) | Croissance | Marché Réunion saturé |

---

## Vue synthetique

```
SEMAINES  1    2    3    4    5    6    7    8    9    10   11+
          |----|----|----|----|----|----|----|----|----|----|----------->
NOW       [============================]  FAIT (code termine)
          Fondations  Cartes  Live+Gamif  Polish  Beta+Launch

NEXT                                         [================]  EN COURS
                                             Social OK | Freemium/Push/Strava: a connecter

LATER                                                               [>  V2
                                                                    Offline
                                                                    Photos
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

*Roadmap mise a jour le 18 mars 2026 — NOW code et termine, NEXT partiellement code (social fonctionnel, notifications/Strava/RevenueCat pas connectes), build local en test*
