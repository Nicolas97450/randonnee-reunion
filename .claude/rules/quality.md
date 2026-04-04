# Règles de qualité — Randonnée Réunion

## Tests
- Chaque nouvelle feature devrait avoir au minimum un test
- Tester les cas normaux ET les cas d'erreur
- Le script full-test-v2.mjs couvre les tests end-to-end principaux

## Pas de contournements
- Ne JAMAIS désactiver un linter, un test ou une vérification de sécurité
- Ne JAMAIS désactiver les policies RLS Supabase "pour tester"
- Si un problème bloque, le documenter dans project/TASKS.md

## Performance (React Native)
- Les listes utilisent FlatList (pas ScrollView) pour la virtualisation
- Les requêtes Supabase utilisent React Query pour le cache
- Le bundle trails.json (~10MB) est chargé une seule fois
- Les images sont optimisées (2MB max pour les avatars)
- Douglas-Peucker pour la compression des traces GPS
- Sous-échantillonnage 50 points pour le profil d'élévation

## Accessibilité
- accessibilityLabel sur tous les éléments interactifs
- Contrastes WCAG AA (minimum 4.5:1)
- Navigation au clavier fonctionnelle

## Spécifique React Native
- ProGuard activé pour la minification Android
- expo-keep-awake pour le GPS tracking background
- ErrorBoundary global pour capturer les crashes
- Haptics (expo-haptics) pour le feedback tactile
