# Commande /review — Revue avant commit

Quand l'utilisateur tape /review, effectue une revue complète :

1. **Git diff** — Analyser tous les changements en cours
2. **Sécurité** — Vérifier qu'aucun secret n'est dans le diff :
   - Pas de token Mapbox, clé Supabase, ou credential
   - Pas de clé service_role côté client
3. **Qualité** — Le code respecte-t-il les conventions ?
   - TypeScript strict (pas de `any`)
   - COLORS constants (pas de couleurs hardcodées)
   - accessibilityLabel présents
   - onError handlers sur les mutations
4. **RLS** — Si une migration SQL est modifiée, les policies RLS sont-elles complètes ?
5. **Documentation** — Les changements nécessitent-ils une mise à jour de doc ?
6. **Verdict** — OK pour commit / changements nécessaires

Si tout est OK, proposer un message de commit conventionnel (feat:/fix:/docs:).
