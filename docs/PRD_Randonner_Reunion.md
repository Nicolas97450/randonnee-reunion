# PRD — Randonnée Réunion
**Application mobile de randonnée pour l'île de La Réunion**

> Version 1.0 | Mars 2026 | Statut : Draft

---

## Résumé exécutif

**Randonnée Réunion** est une application mobile (iOS & Android) qui centralise toutes les informations nécessaires au randonneur sur l'île de La Réunion : référencement complet des sentiers, cartes téléchargeables hors-ligne, météo en temps réel, état des sentiers via l'OMF, GPS intégré, et un système de gamification permettant à l'utilisateur de "colorier" l'île au fil de ses découvertes.

---

## 1. Problème

Les randonneurs à La Réunion — qu'ils soient locaux ou touristes — doivent aujourd'hui jongler entre plusieurs sources d'information disparates : le site de l'OMF pour l'état des sentiers, des applications météo génériques, des fichiers GPX épars, des forums et des PDF non interactifs. Il n'existe pas de solution unifiée, moderne et mobile-first qui réponde à l'ensemble de leurs besoins.

Ce manque crée de la friction avant chaque sortie (temps de préparation long, risque d'information incorrecte ou périmée) et prive les randonneurs d'une expérience de progression et de découverte motivante sur le long terme.

---

## 2. Objectifs

- Devenir **la référence numérique** pour la randonnée à La Réunion dans les 12 mois suivant le lancement.
- Atteindre **10 000 téléchargements actifs** dans les 6 premiers mois post-lancement.
- Obtenir une **note moyenne ≥ 4,5/5** sur l'App Store et le Play Store à 3 mois.
- Faire progresser le **taux de conversion freemium → premium à ≥ 8%** à 6 mois.
- Générer un **taux de rétention à J30 ≥ 40%** grâce à la mécanique de gamification.

---

## 3. Non-Objectifs (hors scope V1)

| Hors scope | Raison |
|---|---|
| Création de contenu communautaire (avis, photos utilisateurs) | Complexité de modération, à adresser en V2 |
| Randonnées hors de La Réunion | Focus géographique volontaire pour la V1 |
| Guidage audio sur sentier | Coût de production du contenu trop élevé pour le MVP |
| Réservation d'hébergements ou de guides | Hors du périmètre produit core |
| Application web | Priorisation mobile-first, web en V3 si pertinent |

---

## 4. Utilisateurs cibles

### Persona A — Le Réunionnais passionné
> Marc, 34 ans, Saint-Denis. Randonneur régulier, connaît plusieurs sentiers emblématiques mais veut découvrir les moins fréquentés. Motivé par le challenge de "compléter" l'île. Utilise son téléphone Android.

### Persona B — Le touriste aventurier
> Sofia, 28 ans, touriste depuis Lyon pour 2 semaines. Ne connaît pas l'île, cherche des sentiers adaptés à son niveau, a besoin de contexte, de météo et de cartes qui fonctionnent sans réseau.

---

## 5. User Stories

### Découverte & Exploration
- En tant que **randonneur**, je veux **consulter la liste complète des sentiers de La Réunion avec filtres (difficulté, durée, dénivelé, région)** afin de trouver rapidement un sentier adapté à mon niveau et mon temps disponible.
- En tant que **touriste**, je veux **voir les sentiers géolocalisés sur une carte de l'île** afin de planifier mon itinéraire en fonction de ma zone d'hébergement.

### Cartes & Navigation hors-ligne
- En tant que **randonneur**, je veux **télécharger la carte d'un sentier avant ma sortie** afin de pouvoir naviguer sans connexion internet sur le terrain.
- En tant que **randonneur**, je veux **suivre ma position GPS en temps réel sur la carte du sentier** afin de ne pas me perdre même sans réseau.

### Conditions & Météo
- En tant que **randonneur**, je veux **consulter la météo prévue sur le point de départ et d'arrivée du sentier** afin d'évaluer les conditions avant de partir.
- En tant que **randonneur**, je veux **connaître l'état officiel du sentier (ouvert / fermé / dégradé) via l'OMF** afin d'éviter de me rendre sur un sentier inaccessible.

### Gamification & Progression
- En tant que **utilisateur régulier**, je veux **voir une carte de l'île se "colorier" au fur et à mesure que je valide des sentiers** afin d'avoir une représentation visuelle de ma progression et d'être motivé à explorer davantage.
- En tant que **randonneur**, je veux **valider la réalisation d'un sentier (via GPS ou manuellement)** afin de l'enregistrer dans mon historique et débloquer la zone correspondante sur ma carte.

---

## 6. Exigences

### P0 — Must-Have (MVP V1)

**Référencement des sentiers**
- [ ] Base de données complète des sentiers officiels de La Réunion (GR, sentiers thématiques, circuits)
- [ ] Fiche détaillée par sentier : distance, dénivelé, durée estimée, difficulté, point de départ/arrivée, description
- [ ] Filtres : difficulté, durée, région, dénivelé, type (boucle / aller-retour)
- [ ] Recherche textuelle par nom de sentier ou lieu

**Cartes hors-ligne**
- [ ] Téléchargement de la carte tuile par sentier (zone tampon incluse)
- [ ] Navigation GPS temps réel sur carte téléchargée
- [ ] Trace GPX visible sur la carte
- [ ] Indicateur clair sur l'état de téléchargement (taille, progression)

**État des sentiers & Météo**
- [ ] Intégration API OMF : affichage statut ouvert/fermé/restreint par sentier
- [ ] Intégration API météo (ex. Météo-France ou OpenWeatherMap) : météo J et J+2 sur le point de départ
- [ ] Alertes visuelles si sentier fermé ou météo défavorable

**Gamification de base**
- [ ] Carte interactive de l'île avec zones géographiques grises par défaut
- [ ] Validation d'un sentier (GPS auto ou saisie manuelle)
- [ ] Colorisation de la zone correspondante à chaque sentier validé
- [ ] Compteur de sentiers réalisés / total disponible

**UX & Design**
- [ ] Design épuré, moderne, dark/light mode
- [ ] Onboarding en 3 écrans maximum
- [ ] Support iOS 16+ et Android 10+

---

### P1 — Nice-to-Have (V1.5 — Semaines 6–10)

- Système de badges et récompenses (premier 3000m, toutes les cirques complétées, etc.)
- Intégration météo avancée : vent, UV, risque de cyclone
- Suggestions de sentiers basées sur la localisation actuelle
- Export de l'historique en PDF ou partage sur réseaux sociaux
- Mode nuit pour l'interface carte
- Notifications push : alerte réouverture sentier favori

#### 🤝 Feature "Sorties" — Randonnées sociales planifiées

**Description**
Un utilisateur peut créer une "Sortie" en liant un sentier, une date et une heure de départ. Les autres utilisateurs peuvent découvrir les sorties publiques sur un sentier et demander à rejoindre. Un chat de groupe s'ouvre entre les participants pour se coordonner avant, pendant et après la rando.

**User stories**
- En tant que **randonneur**, je veux **créer une Sortie sur un sentier avec date, heure et nombre de places** afin d'organiser une randonnée avec d'autres personnes.
- En tant que **randonneur**, je veux **voir les Sorties prévues sur un sentier** afin de rejoindre un groupe existant plutôt que de partir seul.
- En tant que **participant**, je veux **accéder à un chat de groupe** afin de me coordonner avec les autres (point de rendez-vous, covoiturage, matériel).
- En tant que **organisateur**, je veux **accepter ou refuser les demandes de participation** afin de gérer le niveau et la taille du groupe.
- En tant que **participant**, je veux **partager ma position en live** avec le groupe uniquement pendant la sortie, afin de rester groupé sur le sentier.

**Exigences techniques (P1)**
- [ ] Table `sorties` : trail_id, organisateur_id, date, heure_depart, places_max, description, statut (ouvert/complet/annulé)
- [ ] Table `sortie_participants` : sortie_id, user_id, statut (en_attente/accepté/refusé)
- [ ] Table `sortie_messages` : sortie_id, user_id, contenu, created_at
- [ ] Chat temps réel via **Supabase Realtime** (subscriptions sur la table messages)
- [ ] Notifications push : nouvelle demande pour l'organisateur, acceptation/refus pour le participant
- [ ] Partage de position live limité aux participants d'une sortie active (foreground uniquement)
- [ ] Auto-fermeture du chat 24h après la date de la sortie

**Règles métier**
- Sortie visible sur la fiche du sentier + dans une section "Sorties à venir" sur l'accueil
- Maximum 20 participants par sortie (limite anti-abus)
- Organisateur peut annuler jusqu'à 2h avant le départ (notification automatique aux participants)
- Validation du sentier automatique pour tous les participants qui ont partagé leur position pendant la sortie

**Modèle freemium**
- Rejoindre une sortie : **gratuit**
- Créer une sortie : **gratuit** (1 sortie active max en gratuit, illimité en premium)
- Chat de groupe : **gratuit pour tous les participants**

---

### P2 — Future Considerations (V3+)

- Contenu communautaire : photos, avis, conditions du jour
- Guidage vocal sur sentier
- Intégration avec appareils connectés (Garmin, Apple Watch)
- Version web responsive
- Multilangues (EN, DE pour les touristes internationaux)

---

## 7. Modèle Freemium

| Fonctionnalité | Gratuit | Premium |
|---|---|---|
| Consultation des fiches sentiers | ✅ Illimité | ✅ Illimité |
| Cartes hors-ligne | 3 sentiers max | ✅ Illimité |
| GPS temps réel | ✅ | ✅ |
| Météo & état OMF | ✅ | ✅ |
| Gamification / carte de l'île | ✅ | ✅ |
| Historique complet des sorties | 10 dernières | ✅ Illimité |
| Stats avancées (dénivelé cumulé, km/mois) | ❌ | ✅ |
| Export GPX personnel | ❌ | ✅ |

> **Prix suggéré** : 2,99€/mois ou 19,99€/an

---

## 8. Métriques de succès

### Indicateurs avancés (leading)
- Taux d'activation J7 (utilisateur ayant consulté ≥ 3 sentiers ET téléchargé ≥ 1 carte)
- Nombre de sentiers validés par utilisateur actif par mois
- Taux d'ouverture des alertes météo/OMF

### Indicateurs retardés (lagging)
- Téléchargements cumulés à M1, M3, M6
- Rétention J7, J30, J90
- Taux de conversion free → premium à M3 et M6
- Note moyenne stores à M3

---

## 9. Questions ouvertes

| # | Question | Responsable | Priorité |
|---|---|---|---|
| Q1 | L'API OMF est-elle accessible publiquement ou faut-il un partenariat officiel ? | **Business / Legal** | 🔴 Bloquant |
| Q2 | Quelle source de données pour les fiches sentiers ? (OMF, IGN, saisie manuelle ?) | **Data / Engineering** | 🔴 Bloquant |
| Q3 | Quelle librairie cartographique pour les cartes hors-ligne ? (Mapbox offline, MapLibre, OSM) | **Engineering** | 🟠 Haute |
| Q4 | Quel est le coût de stockage estimé pour les tuiles cartographiques offline par utilisateur ? | **Engineering** | 🟠 Haute |
| Q5 | Faut-il une validation GPS obligatoire pour valider un sentier, ou permettre la déclaration manuelle (risque de triche) ? | **Product / Design** | 🟡 Moyenne |
| Q6 | Y a-t-il des contraintes légales liées à l'utilisation des données géographiques de La Réunion (IGN) ? | **Legal** | 🟡 Moyenne |

---

## 10. Considérations de calendrier

> ⚡ **Note** : Les délais ci-dessous sont calibrés pour un développement assisté par IA (vibe coding). Les cycles sont 3 à 5× plus rapides qu'un développement traditionnel.

### Phase 1 — MVP Core (Semaines 1–3)
- S1 : Setup projet, stack technique, base de données sentiers, schéma BDD
- S2 : Référencement sentiers + filtres + cartes offline + GPS
- S3 : Intégration météo + OMF + gamification de base (carte colorisable)
- **Fin S3 : Version beta fonctionnelle complète**

### Phase 2 — Polish & Lancement (Semaines 4–5)
- UX/UI fine-tuning, dark mode, onboarding
- Beta test avec 20–50 randonneurs locaux
- Corrections bugs critiques, optimisation performance offline
- **Fin S5 : Soumission App Store & Play Store**

### Phase 3 — Monétisation & Croissance (Semaines 6–10)
- Activation modèle freemium (paywall cartes offline > 3)
- Push notifications, partage social, badges
- Analyse métriques J30, itérations UX basées sur feedback
- **S10 : Roadmap V2 définie selon les données réelles**

---

## 11. Stack technique recommandée (à valider)

| Composant | Option recommandée | Raison |
|---|---|---|
| Framework mobile | **React Native** ou **Flutter** | Cross-platform iOS + Android |
| Cartes offline | **MapLibre GL** + tuiles OSM/IGN | Open-source, support offline natif |
| GPS | Expo Location / native GPS | Fiabilité terrain |
| API météo | **Météo-France API** ou **OpenWeatherMap** | Données locales précises |
| Backend | **Supabase** ou **Firebase** | Rapide à mettre en place pour MVP |
| Stockage tuiles | Téléchargement local device + CDN pour les updates | Éviter les coûts serveur excessifs |

---

*Document rédigé le 16 mars 2026 — Nicolas, Data Analyst | Projet personnel*
