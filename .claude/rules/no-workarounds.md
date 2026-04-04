# Règle fondamentale — ZÉRO BRICOLAGE

## Principe

Cette règle est la plus importante du projet. Elle s'applique à TOUTES les situations.

Un workaround n'est jamais une solution. Quand quelque chose ne marche pas, on comprend
pourquoi et on le résout proprement. Si on ne sait pas comment, on fait des recherches.
Si on ne trouve toujours pas, on documente le problème et on demande à l'utilisateur —
mais on ne bricole jamais.

Chaque ligne de code doit être écrite comme si elle allait en production demain.
Si ce n'est pas prêt pour la prod, ce n'est pas prêt tout court.

## Pourquoi cette règle existe

Dans le développement assisté par IA (vibe coding), la tentation est forte de "faire marcher"
un truc vite fait. L'IA propose un contournement, ça compile, on passe à la suite. Mais
ces petits hacks s'empilent et créent des problèmes qui coûtent 10x plus de temps à
résoudre plus tard : builds qui cassent, node_modules corrompus, configs incohérentes,
code dupliqué, erreurs silencieuses, documentation qui ment sur l'état réel du code.

Cette règle brise ce cycle.

## Ce qui est INTERDIT

### Contourner un problème d'installation ou de build
- Installer un package dans un dossier temporaire ou non standard
- Copier des fichiers manuellement au lieu de résoudre un conflit de dépendances
- Commenter du code qui ne compile pas pour "avancer"
- Ajouter un @ts-ignore, eslint-disable, ou tout autre mécanisme pour masquer une erreur
- Changer une version de package sans comprendre pourquoi la précédente ne marchait pas

### Contourner un problème d'architecture ou de données
- Dupliquer du code parce qu'un import ne fonctionne pas
- Mettre une fonction au mauvais endroit parce que "ça marche quand même"
- Créer un fichier temporaire ou un script one-shot qui restera dans le projet
- Hardcoder des valeurs parce qu'une requête ou une config échoue
- Mettre des try/catch vides qui avalent les erreurs silencieusement

### Mentir sur l'état du projet
- Dire "c'est implémenté" quand le code existe mais n'est pas connecté ou testé
- Marquer une tâche comme faite dans TASKS.md sans avoir vérifié dans le code réel
- Écrire dans la documentation qu'une feature fonctionne sans l'avoir vérifiée
- Rapporter dans un audit que des issues sont présentes sans vérifier dans le code

## Ce qui est OBLIGATOIRE

### Face à un problème
1. Lire l'erreur complète, pas juste la dernière ligne
2. Identifier la cause racine — pas le symptôme, la vraie cause
3. Chercher la solution propre — documentation officielle, web search si nécessaire
4. Implémenter proprement — de manière à ce que ça fonctionne en production

### Si la solution propre n'est pas possible dans l'environnement actuel
1. Documenter dans project/TASKS.md :
   - Quel est le problème exact (message d'erreur complet)
   - Pourquoi la solution ne peut pas être appliquée ici
   - Quelle commande ou action l'utilisateur doit faire sur sa machine
   - Quel sera le résultat attendu
2. NE PAS bricoler un contournement — mieux vaut ne rien faire que créer de la dette

### Quand on ne sait pas
1. Faire une recherche web dans la documentation officielle
2. Lire le code source du package ou de la lib
3. Demander à l'utilisateur s'il a plus de contexte
4. Documenter le blocage proprement si aucune solution n'est trouvée — c'est OK de dire
   "je ne sais pas", ce n'est PAS OK de bricoler un truc qui marchera 5 minutes
