# Roadmap — Randonnée Réunion
**Format Now / Next / Later | Mars 2026**

> ⚡ Développement en vibe coding assisté par IA — cycles 3 à 5× plus rapides qu'un dev traditionnel.

---

## 🟢 NOW — Semaines 1 à 5 (MVP & Lancement)

> Objectif : Avoir une app fonctionnelle, téléchargeable et utilisable sur le terrain.

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

### Semaine 3 — Données Live & Gamification
| # | Feature | Valeur utilisateur | Complexité IA |
|---|---|---|---|
| 3.1 | Intégration météo (Météo-France API) sur point de départ | Sécurité | Moyenne |
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

## 🟡 NEXT — Semaines 6 à 10 (Monétisation & Engagement)

> Objectif : Activer le modèle freemium, engager les premiers utilisateurs, collecter des données.

| # | Feature | Valeur | Notes |
|---|---|---|---|
| N.1 | **Paywall freemium** (> 3 cartes offline = premium) | Revenus | Stripe ou RevenueCat |
| N.2 | Système de badges et récompenses (1er sommet, cirques complétés…) | Gamification | Extension gamification V1 |
| N.3 | Notifications push (alerte réouverture sentier favori) | Rétention | Expo Notifications |
| N.4 | Partage sortie sur réseaux sociaux (image générée auto) | Acquisition virale | Carte colorisée partageable |
| N.5 | Statistiques avancées (dénivelé cumulé, km/mois, streak) | Engagement | Premium uniquement |
| N.6 | Suggestions sentiers basées sur localisation actuelle | Découverte | Requête PostGIS |
| N.7 | Export GPX de sa propre trace enregistrée | Utilité | Premium uniquement |
| N.8 | Analyse métriques J30 + itérations UX | Produit | Posthog ou Amplitude |
| **N.9** | **🤝 Feature Sorties — Création d'événements rando** | **Social** | **Tables sorties + participants** |
| **N.10** | **💬 Chat de groupe par Sortie (Supabase Realtime)** | **Social** | **Real-time subscriptions** |
| **N.11** | **📍 Position live partagée dans une Sortie** | **Sécurité groupe** | **Foreground uniquement** |
| **N.12** | **🔔 Notifications Sorties (demande, acceptation, rappel J-1)** | **Engagement** | **Expo Push Notifications** |

---

> 💡 **Note Sorties** : les features N.9 à N.12 forment un bloc cohérent à développer ensemble en semaines 7–8. Supabase Realtime est déjà dans la stack — pas de changement d'architecture requis.

---

## 🔵 LATER — À partir de S11 (V2 : Communauté & Scale)

> Objectif : Faire de l'app une plateforme communautaire et envisager l'expansion.

| # | Feature | Valeur | Condition de déclenchement |
|---|---|---|---|
| L.1 | Intégration Strava (export automatique activité post-sentier) | Acquisition | > 2 000 utilisateurs actifs |
| L.2 | Photos & avis utilisateurs sur les sentiers | Communauté | Ressources de modération disponibles |
| L.3 | Guidage vocal turn-by-turn sur sentier | Navigation | Partenariat contenu audio |
| L.4 | Multilangues (EN, DE) pour touristes internationaux | Marché | > 20% utilisateurs non-francophones |
| L.5 | Intégration Apple Watch / Garmin | Premium | Demande utilisateurs confirmée |
| L.6 | Version web responsive | Accessibilité | Post-product/market fit confirmé |
| L.7 | Partenariat institutionnel IRT / OMF officiel | Légitimité | Traction > 5 000 utilisateurs actifs |
| L.8 | Extension géographique (Mayotte, Maurice…) | Croissance | Marché Réunion saturé |

---

## Vue synthétique

```
SEMAINES  1    2    3    4    5    6    7    8    9    10   11+
          ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼──────────►
NOW       [████████████████████████████]
          Fondations  Cartes  Live+Gamif  Polish  Beta+Launch

NEXT                                         [████████████████]
                                             Freemium  Badges  Partage  Stats

LATER                                                               [►  V2
                                                                    Strava
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

*Roadmap mise à jour le 17 mars 2026*
