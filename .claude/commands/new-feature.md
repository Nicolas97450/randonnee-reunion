# Commande /new-feature — Ajouter une fonctionnalité

Quand l'utilisateur tape /new-feature [description], effectue cette checklist :

## Avant de coder
1. Vérifier project/DECISIONS.md — cette feature a-t-elle déjà été discutée ?
2. Vérifier docs/02-product/features-roadmap.md — est-elle dans la roadmap ?
3. Ajouter la tâche dans project/TASKS.md
4. Créer une branche git : feature/[nom-de-la-feature]

## Pendant le développement
5. Implémenter en respectant .claude/rules/ (TypeScript strict, COLORS, accessibilityLabel)
6. Hook dans src/hooks/, composant dans src/components/, écran dans src/screens/
7. Si nouvelle table Supabase : créer migration numérotée + policies RLS
8. Si nouvelle donnée utilisateur : vérifier RGPD (compliance.md)

## Après le développement
9. Mettre à jour docs/02-product/PRD.md
10. Si feature touche aux données utilisateur :
    - Mettre à jour docs/04-legal/privacy-policy.md
    - Ajouter entrée dans docs/04-legal/compliance-log.md
11. Ajouter entrée dans project/CHANGELOG.md
12. Marquer la tâche comme faite dans project/TASKS.md
13. Commit : feat: [description]
