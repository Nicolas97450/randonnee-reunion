# Données brutes — Randonnée Réunion

Ce dossier contient les fichiers de données sources qui ne sont PAS inclus dans le bundle de l'app.

## Fichiers

- `trails.json` (~9.9MB) — Les 710 sentiers avec traces GPS complètes
  - Ce fichier a été utilisé pour peupler la base Supabase
  - Il n'est PAS importé par l'app (les données viennent de Supabase)
  - Gardé ici comme backup / référence

## Données utilisées par l'app

L'app utilise uniquement :
- `app/src/data/trail-coords.json` (63KB) — Coordonnées de départ pré-parsées
- Supabase (API) — Données légères des sentiers + traces GPS à la demande
