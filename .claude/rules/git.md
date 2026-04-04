# Règles Git — Randonnée Réunion

## Branches
- Ne JAMAIS push directement sur main
- Format : feature/S[sprint]-[num]-[description] (ex: feature/S1-03-supabase-setup)
- Fixes : fix/[description]
- Nommer en kebab-case

## Commits
- Messages en français ou anglais, format conventionnel :
  feat: ajouter le guidage vocal TTS
  fix: corriger le calcul de distance haversine
  perf: optimiser le chargement des sentiers
  docs: mettre à jour le PRD
  refactor: simplifier le flow d'authentification
- Un commit = un changement logique

## Avant chaque commit
- Vérifier qu'aucun secret n'est dans le diff (.env, tokens, clés)
- Vérifier le .gitignore : .env, node_modules, android/.gradle, .expo/
- Ne JAMAIS commiter app/.env (contient les secrets Supabase/Mapbox)

## Fichiers à ne jamais commiter
- app/.env (secrets)
- app/android/.gradle/ (cache build)
- app/.expo/ (cache Expo)
- node_modules/
- *.apk, *.aab (binaires de build)
