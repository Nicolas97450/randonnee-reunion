# Checklist sécurité pré-production — Randonnée Réunion

## Secrets et credentials

- [ ] Token Mapbox secret révoqué de gradle.properties → EAS secrets
- [ ] Clé service_role Supabase retirée du client → côté serveur uniquement
- [ ] .env non commité (vérifier historique git)
- [ ] .env.example ne contient que des placeholders
- [x] Variables EAS configurées (SUPABASE_URL, SUPABASE_ANON_KEY, MAPBOX_TOKEN)

## Supabase RLS

- [x] 90+ policies RLS actives
- [x] Trigger validate_sortie_message_author (migration 014)
- [x] RPCs anti-triche : validate_and_complete_trail, compute_user_xp (migration 016)
- [x] blocked_users table + policies (migration 015)
- [ ] Audit storage bucket policies (taille, type MIME)

## Code

- [x] ProGuard activé pour Android
- [x] ErrorBoundary global
- [x] Sentry installé + DSN configuré (projet react-native sur nicolas-oh.sentry.io)
- [x] Modération contenu (keyword filter FR)
- [x] sanitizeUsername dans formatters.ts
- [x] onError handlers sur toutes les mutations
- [x] GPS chiffré SecureStore (crash-safe)
- [ ] Audit console.log en production (retirer les données sensibles)
- [ ] Rate limiting API calls côté client

## RGPD

- [x] Consentement CGU à l'inscription
- [x] Droit à la suppression (19 tables)
- [x] Droit à l'export
- [x] Profil privé (toggle visibilité)
- [x] Disclaimer SOS première utilisation
- [x] Politique de confidentialité à jour (live tracking, DMs, EU)
