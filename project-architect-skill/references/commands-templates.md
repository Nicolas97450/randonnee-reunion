# Templates pour .claude/commands/

Les commandes slash sont des raccourcis que l'utilisateur tape dans Claude Code
pour déclencher un workflow structuré. Chaque commande guide Claude à travers
une séquence d'étapes précise.

---

## status.md — /status

```markdown
# Commande /status — État du projet

Quand l'utilisateur tape /status, effectue ces étapes dans l'ordre :

1. Lis project/PROJECT_STATE.md et affiche un résumé de l'état actuel
2. Lis project/TASKS.md et affiche :
   - Nombre de tâches par priorité (blockers / bugs / features / améliorations)
   - Les 3 tâches les plus prioritaires (dans l'ordre : blockers > bugs > features)
3. Lis project/SESSIONS.md et affiche un résumé de la dernière session
4. Vérifie s'il y a des incohérences évidentes (tâche marquée "fait" mais
   le code n'existe pas, etc.)
5. Vérifie s'il y a de la dette technique documentée dans DECISIONS.md
   dont la date de résolution est dépassée
6. Propose les prochaines actions recommandées, triées par priorité
```

---

## health-check.md — /health-check

```markdown
# Commande /health-check — Audit santé du projet

Quand l'utilisateur tape /health-check, effectue un audit complet du projet.
Cette commande devrait être lancée toutes les 5-10 sessions de travail pour
vérifier que le projet reste sain.

## 1. Documentation
- Les compteurs dans CLAUDE.md et PROJECT_STATE.md sont-ils à jour ?
  (Compter les écrans, composants, hooks, migrations réels et comparer)
- Le PRD reflète-t-il les features réellement implémentées ?
- Les features marquées "FAIT" dans le PRD existent-elles dans le code ?

## 2. Tests
- Les tests existants passent-ils tous ?
- Y a-t-il des features sans aucun test ?
- Y a-t-il des tests désactivés ou en skip ?

## 3. Sécurité
- Y a-t-il des secrets dans le code source (scan rapide) ?
- Les dépendances ont-elles des vulnérabilités connues (npm audit / pip audit) ?
- Les policies RLS / permissions sont-elles en place ?

## 4. Dette technique
- Y a-t-il des dettes techniques documentées dans DECISIONS.md dont la date
  de résolution est dépassée ?
- Y a-t-il des TODO/FIXME/HACK dans le code ?
- Y a-t-il des fichiers de plus de 500 lignes qui devraient être refactorisés ?

## 5. Qualité
- Y a-t-il des erreurs TypeScript / linter ignorées ?
- Y a-t-il des couleurs hardcodées, des valeurs magiques non-constantes ?
- Les fichiers ont-ils des commentaires d'en-tête ?

## Format de sortie
Présente un rapport avec une note sur 10 pour chaque catégorie, les problèmes
trouvés classés par sévérité, et un plan d'action priorisé.
```

---

## new-feature.md — /new-feature

```markdown
# Commande /new-feature — Ajouter une fonctionnalité

Quand l'utilisateur tape /new-feature [description], effectue cette checklist :

## Phase 1 — Mini-discovery (AVANT de coder)
1. Vérifier project/DECISIONS.md — cette feature a-t-elle déjà été discutée/rejetée ?
2. Vérifier docs/02-product/features-roadmap.md — est-elle dans la roadmap ?
3. Analyser l'impact :
   - Quelles tables BDD, quels écrans, quels hooks sont touchés ?
   - Collecte-t-elle de nouvelles données personnelles ? (→ RGPD)
   - Expose-t-elle de nouvelles surfaces d'attaque ? (→ sécurité)
   - Questions scalabilité (voir scalability.md) :
     Que se passe-t-il si cette feature est utilisée par 10 000 users ?
     Les listes générées peuvent-elles devenir très longues ?
     Y a-t-il un appel API tierce qui pourrait tomber ?
4. Estimer la complexité : si > 2 sessions de travail, signaler le risque de
   scope creep et proposer un découpage en sous-features
5. Présenter l'analyse d'impact à l'utilisateur et attendre sa validation

## Phase 2 — Documentation AVANT de coder
5. Ajouter la feature dans docs/02-product/PRD.md
6. Ajouter dans docs/02-product/features-roadmap.md si absente
7. Si impact BDD : pré-documenter dans docs/05-architecture/database-schema.md
8. Si impact RGPD : mettre à jour docs/04-legal/privacy-policy.md + compliance-log.md
9. Ajouter la tâche dans project/TASKS.md (section priorité appropriée)
10. Documenter la décision dans project/DECISIONS.md
11. Créer une branche git : feature/[nom-de-la-feature]

## Phase 3 — Développement
12. Implémenter la feature en respectant .claude/rules/
13. Commenter chaque nouveau fichier et chaque nouvelle fonction (voir code-comments.md)
14. Gérer les edge cases (liste vide, erreur réseau, input invalide — voir defensive-coding.md)
15. Écrire les tests PENDANT le développement (au minimum : happy path + cas d'erreur)
16. Les tests DOIVENT passer avant de continuer (voir testing.md)

## Phase 4 — Finalisation
17. Mettre à jour docs/02-product/user-stories.md si pertinent
18. Ajouter une entrée dans project/CHANGELOG.md
19. Mettre à jour les compteurs dans CLAUDE.md et project/PROJECT_STATE.md
20. Mettre à jour project/TASKS.md — marquer la tâche comme faite
21. Commit avec message conventionnel : feat: [description]

## Rappel
Ne JAMAIS sauter les étapes de documentation et de tests. Ne JAMAIS commencer
à coder avant la validation utilisateur. C'est ce qui évite que le projet
devienne un bordel.
```

---

## update-docs.md — /update-docs

```markdown
# Commande /update-docs — Synchroniser la documentation

Quand l'utilisateur tape /update-docs, effectue une synchronisation complète :

1. **Comparer PRD et code**
   - Lire docs/02-product/PRD.md
   - Scanner src/ pour lister les features implémentées
   - Identifier les écarts (features dans le PRD non implémentées,
     features dans le code non documentées)
   - Proposer les mises à jour nécessaires

2. **Vérifier l'architecture**
   - Comparer docs/05-architecture/database-schema.md avec les modèles réels
   - Comparer docs/05-architecture/api-design.md avec les routes réelles
   - Signaler les écarts

3. **Vérifier le legal**
   - Si des features sociales ou de collecte existent dans le code,
     vérifier que docs/04-legal/ les couvre
   - Signaler les manques

4. **Mettre à jour le tracking**
   - Mettre à jour project/PROJECT_STATE.md avec l'état actuel
   - Nettoyer project/TASKS.md (supprimer les tâches obsolètes)

5. **Présenter un rapport**
   - Résumé des mises à jour effectuées
   - Liste des documents encore à mettre à jour manuellement
```

---

## review.md — /review

```markdown
# Commande /review — Revue avant commit

Quand l'utilisateur tape /review, effectue une revue complète avant commit.
Cette commande orchestre les agents spécialisés pour une review approfondie.

## Étapes

1. **Git diff** — Analyser tous les changements en cours (fichiers modifiés, ajoutés, supprimés)

2. **Revue code-reviewer** — Appliquer la checklist de l'agent code-reviewer :
   - Sécurité : pas de secrets, entrées validées, pas d'injection
   - Qualité : conventions du projet, nommage, pas de duplication
   - Architecture : cohérence avec l'architecture existante
   - Commentaires : en-têtes fichier et fonctions documentés (code-comments.md)

3. **Revue security-auditor** — Si les changements touchent à l'auth, aux données
   utilisateur, ou aux API : appliquer la checklist de l'agent security-auditor

4. **Tests** — Vérifier que tous les tests passent. Si la feature a de nouveaux
   fichiers sans tests, le signaler comme bloquant (testing.md)

5. **Documentation** — Vérifier via l'agent doc-keeper :
   - Les changements nécessitent-ils une MAJ du PRD, de la BDD, de l'API ?
   - Les compteurs dans CLAUDE.md sont-ils à jour ?
   - Si nouvelles données perso : compliance-log.md à jour ?

6. **Verdict** — Pour chaque catégorie : OK / avertissement / bloquant
   Si bloquant → lister les corrections requises avant commit
   Si OK → proposer un message de commit conventionnel
```
