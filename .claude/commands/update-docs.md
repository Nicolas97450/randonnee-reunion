# Commande /update-docs — Synchroniser la documentation

Quand l'utilisateur tape /update-docs, effectue une synchronisation complète :

1. **Comparer PRD et code**
   - Lire docs/02-product/PRD.md
   - Scanner app/src/ pour lister les écrans, hooks, composants
   - Identifier les écarts (features non documentées, features abandonnées)
   - Proposer les mises à jour

2. **Vérifier l'architecture**
   - Comparer docs/05-architecture/database-schema.md avec app/supabase/migrations/
   - Vérifier que les 5 stores, 5 RPCs, 17 migrations sont documentés
   - Signaler les écarts

3. **Vérifier le legal**
   - Si des features sociales existent dans le code, vérifier que
     docs/04-legal/privacy-policy.md les couvre
   - Vérifier la cohérence avec private/legal/ (versions HTML)

4. **Mettre à jour le tracking**
   - Mettre à jour project/PROJECT_STATE.md
   - Nettoyer project/TASKS.md (supprimer les tâches obsolètes)

5. **Rapport** : résumé des mises à jour + documents à corriger manuellement
