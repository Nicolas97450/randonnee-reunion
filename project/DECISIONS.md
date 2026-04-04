# Décisions techniques — Randonnée Réunion

Chaque décision est définitive sauf justification forte. Ne pas re-débattre.

---

## D001 — React Native + Expo SDK 55
**Date** : 17 mars 2026
**Contexte** : Choix du framework mobile
**Décision** : React Native + Expo managed workflow
**Raison** : Cross-platform iOS+Android, TypeScript, écosystème riche, EAS Build cloud
**Alternative écartée** : Flutter (moins de libs cartographie), natif (trop long en solo)

## D002 — Mapbox GL (pas MapLibre)
**Date** : 19 mars 2026
**Contexte** : Choix de la solution cartographique
**Décision** : @rnmapbox/maps v10 avec token Mapbox
**Raison** : Meilleur support React Native, 4 styles natifs (Outdoor/Satellite/Light/Dark), clustering natif
**Alternative écartée** : MapLibre (problèmes de build EAS, plugin legacy)
**Note** : Le code a migré de MapLibre vers Mapbox pendant le Sprint 2

## D003 — Supabase (pas Firebase)
**Date** : 17 mars 2026
**Contexte** : Choix du backend
**Décision** : Supabase (PostgreSQL + PostGIS + Auth + Realtime + Storage)
**Raison** : PostGIS pour les géo-requêtes, Realtime pour le chat, gratuit MVP, SQL natif
**Alternative écartée** : Firebase (pas de PostGIS, NoSQL moins adapté aux données géo)

## D004 — Open-Meteo (pas Météo-Concept)
**Date** : 18 mars 2026
**Contexte** : API météo
**Décision** : Open-Meteo (gratuit, pas de clé API)
**Raison** : Couvre La Réunion, données riches (UV, rafales, sunrise/sunset, visibilité), illimité
**Alternative écartée** : Météo-Concept (500 appels/jour limité)

## D005 — Scraping ONF direct (pas Edge Function)
**Date** : 18 mars 2026
**Contexte** : Statut des sentiers ONF
**Décision** : L'app scrape onf.fr directement (cache 1h)
**Raison** : Pas de serveur à maintenir, matching strict 2+ mots
**Risque** : Si ONF change leur site, le scraping casse

## D006 — Zustand (pas Redux/Context)
**Date** : 17 mars 2026
**Contexte** : State management
**Décision** : Zustand avec 5 stores
**Raison** : Léger, simple, pas de boilerplate, persist middleware

## D007 — JSON bundle local pour les sentiers
**Date** : 19 mars 2026
**Contexte** : Chargement des 710 sentiers
**Décision** : Bundle trails.json (~10MB) embarqué dans l'app + Supabase
**Raison** : Performance au premier lancement, pas de dépendance réseau
**Risque** : Taille du bundle (+10MB)

## D008 — Confirmation email désactivée
**Date** : 18 mars 2026
**Contexte** : Flow d'inscription
**Décision** : Pas de confirmation email pour le MVP
**Raison** : Évite les problèmes d'inscription, friction réduite
**À revoir** : Activer la confirmation pour la v2

## D009 — OSRM foot profile pour le routing
**Date** : 19 mars 2026
**Contexte** : Itinéraire vers le départ du sentier
**Décision** : OSRM avec profil `foot` (pas `driving`)
**Raison** : Routing piéton plus pertinent pour la randonnée

## D010 — Architecture projet restructurée
**Date** : 27 mars 2026
**Contexte** : Documentation chaotique après 5 jours de dev intensif
**Décision** : Réorganisation complète avec .claude/, docs/ en 6 phases, project/
**Raison** : Permettre à Claude Code de travailler efficacement à chaque session
