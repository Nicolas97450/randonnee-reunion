# Guide de rédaction du CLAUDE.md

Le CLAUDE.md est le fichier le plus important du projet. Claude Code le lit au
début de CHAQUE session. Il doit être concis (~200 lignes max), structuré, et
pointer vers les docs détaillées avec la syntaxe @.

## Structure recommandée

```markdown
# [Nom du Projet]

[Description en 1-2 phrases : quoi, pour qui, pourquoi]

## Stack technique

- **Frontend** : [framework, version]
- **Backend** : [framework, version]
- **Base de données** : [type, version]
- **Hébergement** : [service]
- **Autres** : [services tiers, APIs, etc.]

## Commandes essentielles

- `npm run dev` — Lancer en développement
- `npm run build` — Build de production
- `npm test` — Lancer les tests
- `npm run lint` — Vérifier le code

## Architecture du code

- `src/components/` — Composants UI réutilisables
- `src/pages/` — Pages/routes de l'application
- `src/api/` — Endpoints API
- `src/lib/` — Utilitaires et helpers
- `src/types/` — Types TypeScript

## Conventions de code

- Indentation : 2 espaces
- Nommage : camelCase pour variables/fonctions, PascalCase pour composants
- Imports : absolus avec alias @ pour src/
- Tests : fichier .test.ts à côté du fichier testé

## Documentation du projet

Pour le contexte complet du projet, consulte :
- @docs/02-product/PRD.md — Requirements produit
- @docs/05-architecture/tech-stack.md — Choix techniques et justifications
- @docs/05-architecture/system-design.md — Architecture système
- @docs/05-architecture/database-schema.md — Schéma BDD
- @docs/05-architecture/api-design.md — Design API

## État du projet

- @project/PROJECT_STATE.md — État actuel, version, bugs connus
- @project/TASKS.md — Tâches en cours et à faire
- @project/DECISIONS.md — Décisions déjà prises (ne pas revenir dessus)

## Règles critiques

- JAMAIS de clés API, tokens ou secrets dans le code → .env uniquement
- TOUJOURS mettre à jour TASKS.md après chaque session de travail
- TOUJOURS vérifier project/DECISIONS.md avant de proposer un choix d'architecture
- Après ajout d'une feature : mettre à jour le PRD et les tests
```

## Principes de rédaction

### Être concis et actionnable
Chaque ligne doit apporter une information utile. Pas de prose, pas de répétition.
"Utilise 2 espaces pour l'indentation" > "Le code doit être correctement formaté"

### Pointer plutôt que dupliquer
Ne copie pas le contenu des docs dans le CLAUDE.md. Utilise @ pour pointer :
`@docs/05-architecture/api-design.md` est mieux qu'un résumé de l'API dans le CLAUDE.md.

### Mettre les règles critiques en évidence
Les 3-5 règles les plus importantes doivent apparaître dans le CLAUDE.md directement,
pas seulement dans les fichiers de rules. La double mention renforce le respect.

### Adapter au projet
Un projet Next.js n'a pas les mêmes commandes qu'un projet Python Django.
Un projet solo n'a pas besoin de conventions d'équipe élaborées.
Chaque CLAUDE.md doit être unique et spécifique.

### Tester la longueur
Compte les lignes. Si tu dépasses 200, coupe. Déplace le contenu détaillé vers
des fichiers dans docs/ ou .claude/rules/ et pointe avec @.
