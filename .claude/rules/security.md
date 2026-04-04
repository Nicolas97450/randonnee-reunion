# Règles de sécurité — Randonnée Réunion

## Secrets et credentials
- Ne JAMAIS inclure de clés API, tokens ou secrets dans le code source
- Utiliser exclusivement des variables d'environnement via .env (non commité)
- Référencer app/.env.example pour documenter les variables nécessaires
- Avant chaque commit, vérifier qu'aucun secret n'est dans le diff
- Le token Mapbox secret dans gradle.properties doit être révoqué et géré via EAS secrets
- La clé service_role Supabase ne doit JAMAIS être côté client — uniquement côté serveur

## Supabase spécifique
- Utiliser UNIQUEMENT la clé anon (EXPO_PUBLIC_SUPABASE_ANON_KEY) côté client
- Toutes les opérations sensibles passent par des RPC Supabase (validate_and_complete_trail, compute_user_xp, etc.)
- Chaque table a des policies RLS — ne JAMAIS les désactiver
- Les RPCs anti-triche (migration 016) valident côté serveur

## Validation des entrées
- Toute donnée utilisateur est validée et assainie avant insertion
- Le module moderation.ts filtre les contenus (keyword filter FR)
- sanitizeUsername() dans formatters.ts pour les noms d'utilisateur
- Ne jamais construire de requêtes par concaténation — utiliser le client Supabase

## Données GPS
- Les points GPS sont chiffrés via SecureStore (crash-safe)
- Le filtrage accuracy+speed dans useGPSTracking empêche les données corrompues

## Dépendances
- Ne pas installer de packages sans vérifier popularité et maintenance
- Vérifier les vulnérabilités connues (npm audit) avant d'ajouter une dépendance
- Sentry est installé pour le monitoring d'erreurs en production
