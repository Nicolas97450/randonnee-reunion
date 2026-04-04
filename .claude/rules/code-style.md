# Conventions de code — Randonnée Réunion

## TypeScript
- TypeScript strict — pas de `any`
- Indentation : 2 espaces
- Point-virgules : oui
- Guillemets : simples pour JS/TS, doubles pour JSX

## Nommage
- Composants React : PascalCase (TrailCard.tsx, SOSButton.tsx)
- Hooks : camelCase avec préfixe use (useTrails.ts, useWeather.ts)
- Stores Zustand : camelCase + Store (authStore.ts, progressStore.ts)
- Constantes : UPPER_SNAKE_CASE (COLORS, MAP_STYLES)
- Tables BDD : snake_case (user_profiles, trail_reports)
- Fichiers utilitaires : camelCase (parseWKB.ts, formatters.ts)

## Structure des fichiers
- Un composant par fichier dans src/components/
- Un hook par fichier dans src/hooks/
- Un store par fichier dans src/stores/
- Imports groupés : libs externes d'abord, puis imports internes

## Couleurs et styles
- Toutes les couleurs via COLORS constants — JAMAIS de valeurs hardcodées
- Design tokens dans private/branding/design-tokens.json
- Dark/Light mode via themeStore

## Accessibilité
- accessibilityLabel sur TOUS les boutons et inputs
- Contrastes WCAG AA respectés (textMuted minimum #8a8178)

## Données sentiers
- Slug→UUID : TOUJOURS résoudre via resolveTrailId() avant requêtes Supabase
- Les 710 sentiers sont en bundle local (src/data/trails.json ~10MB) + Supabase
- WKB parsing via parseWKB.ts pour les géométries PostGIS

## Gestion d'erreurs
- onError handler sur TOUTES les mutations React Query
- ErrorBoundary global (composant ErrorBoundary.tsx)
- Sentry pour le reporting d'erreurs production
