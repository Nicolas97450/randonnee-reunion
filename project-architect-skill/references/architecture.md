# Architecture complète d'un projet

## Structure de fichiers

Voici l'arborescence complète à créer pour chaque projet. Adapte selon le type
de projet — tout n'est pas nécessaire pour un petit CLI, mais un SaaS aura besoin
de tout.

```
NomDuProjet/
│
├── CLAUDE.md                           ← FICHIER MAITRE (~200 lignes max)
├── .env.example                        ← Template des variables d'environnement
├── .gitignore                          ← Exclut .env, settings.local.json, node_modules, etc.
│
├── .claude/
│   ├── settings.json                   ← Config hooks, permissions, MCP
│   ├── settings.local.json             ← Config perso (gitignored)
│   │
│   ├── rules/                          ← Garde-fous automatiques
│   │   ├── no-workarounds.md           ← RÈGLE N°1 : zéro bricolage, zéro hack, zéro contournement
│   │   ├── security.md                 ← Secrets, validation, dépendances
│   │   ├── compliance.md               ← RGPD, données perso, consentement
│   │   ├── code-style.md              ← Conventions de code du projet
│   │   ├── code-comments.md           ← Commentaires systématiques (en-têtes, fonctions, logique)
│   │   ├── testing.md                  ← Tests bloquants (pas de feature suivante sans tests)
│   │   ├── scalability.md             ← Performance, pagination, cache, index
│   │   ├── defensive-coding.md        ← Edge cases, inputs invalides, réseau down
│   │   ├── documentation.md            ← MAJ docs après chaque feature + reprise de session
│   │   ├── git.md                      ← Branches, commits, reviews
│   │   └── quality.md                  ← Linting, accessibilité, qualité générale
│   │
│   ├── agents/                         ← Agents spécialisés
│   │   ├── code-reviewer.md            ← Revue de code systématique
│   │   ├── doc-keeper.md               ← Synchronisation documentation
│   │   ├── security-auditor.md         ← Audit sécurité continu
│   │   ├── qa-tester.md                ← Qualité et tests
│   │   └── performance-auditor.md      ← Audit performance et scalabilité
│   │
│   ├── commands/                       ← Commandes slash custom
│   │   ├── update-docs.md              ← /update-docs
│   │   ├── status.md                   ← /status (avec priorisation)
│   │   ├── new-feature.md              ← /new-feature (avec mini-discovery + validation user)
│   │   ├── health-check.md             ← /health-check (audit santé périodique)
│   │   └── review.md                   ← /review
│   │
│   └── skills/                         ← Skills spécifiques au projet
│       ├── installed/                  ← Skills récupérés (GitHub, communauté)
│       └── custom/                     ← Skills créés pour ce projet
│
├── docs/
│   ├── 01-discovery/                   ← Phase Idéation & Recherche
│   │   ├── brainstorm.md
│   │   ├── problem-statement.md
│   │   ├── market-analysis.md
│   │   ├── competitive-analysis.md
│   │   ├── user-personas.md
│   │   └── validation-notes.md
│   │
│   ├── 02-product/                     ← Phase Définition Produit
│   │   ├── PRD.md
│   │   ├── user-stories.md
│   │   ├── features-roadmap.md
│   │   └── acceptance-criteria.md
│   │
│   ├── 03-business/                    ← Phase Business & Stratégie
│   │   ├── business-model.md
│   │   ├── monetization.md
│   │   ├── go-to-market.md
│   │   └── financial-projections.md
│   │
│   ├── 04-legal/                       ← Phase Juridique & Compliance
│   │   ├── legal-checklist.md
│   │   ├── privacy-policy.md
│   │   ├── terms-of-service.md
│   │   ├── compliance-log.md
│   │   └── data-processing.md
│   │
│   ├── 05-architecture/                ← Phase Architecture Technique
│   │   ├── tech-stack.md
│   │   ├── system-design.md
│   │   ├── database-schema.md
│   │   ├── api-design.md
│   │   ├── testing-strategy.md
│   │   └── adr/
│   │       └── 001-template.md
│   │
│   └── 06-operations/                  ← Phase Déploiement & Ops
│       ├── deployment.md
│       ├── environments.md
│       ├── monitoring.md
│       └── security-checklist.md
│
├── project/
│   ├── PROJECT_STATE.md                ← État actuel du projet
│   ├── TASKS.md                        ← Tâches à faire / en cours / fait
│   ├── CHANGELOG.md                    ← Journal des changements
│   ├── SESSIONS.md                     ← Historique des sessions de travail
│   └── DECISIONS.md                    ← Décisions prises et justifications
│
└── src/                                ← Le code source
    └── ...
```

## Rôle de chaque dossier

### .claude/rules/ — Les garde-fous
Ces fichiers sont chargés automatiquement à CHAQUE session Claude Code. Ils empêchent
les erreurs courantes sans intervention humaine. Pense à eux comme des "lois" que
Claude doit respecter en permanence.

### .claude/agents/ — Les spécialistes
Chaque agent est un expert dans son domaine. Ils sont invoqués quand leur expertise
est nécessaire. Un agent de revue de code ne fait QUE de la revue de code, mais il
le fait parfaitement.

### .claude/commands/ — Les raccourcis
Des commandes slash que l'utilisateur peut taper pour déclencher un workflow complet.
Par exemple /new-feature lance une checklist complète : mise à jour du PRD, création
de la branche, mise à jour des tests, etc.

### docs/ — La base de connaissances
Organisée en phases du cycle de vie du projet. Claude Code peut aller chercher
n'importe quel document quand il en a besoin. Le CLAUDE.md pointe vers ces docs
avec la syntaxe @docs/...

### project/ — Le tableau de bord
La mémoire du projet. TASKS.md empêche le travail en double. SESSIONS.md garde
la trace de ce qui a été fait. DECISIONS.md évite de re-débattre des choix déjà faits.

#### Templates de contenu pour project/

**TASKS.md** — système de priorisation strict :
```markdown
# Tâches — [Nom du Projet]

> Format : [x] fait, [-] en cours, [ ] à faire
> Claude traite TOUJOURS dans l'ordre : Blockers > Bugs > Features > Améliorations

## Blockers (empêchent d'avancer)
- [ ] [tâche]

## Bugs (l'existant ne fonctionne pas)
- [ ] [tâche]

## Features (du nouveau à construire)
- [ ] [tâche]

## Améliorations (optimisations, refactoring)
- [ ] [tâche]

## Fait récemment
- [x] [tâche] — [date]
```

**SESSIONS.md** — historique structuré :
```markdown
# Sessions de travail — [Nom du Projet]

## Session N — [date]
**Objectif** : [ce qu'on voulait faire]
**Durée** : [estimation]
**Réalisé** :
- [ce qui a été fait]
- [ce qui a été fait]
**Problèmes rencontrés** : [si applicable]
**Prochaine session** : [ce qui reste à faire]
```

**DECISIONS.md** — décisions définitives :
```markdown
# Décisions techniques — [Nom du Projet]

Chaque décision est définitive sauf justification forte. Ne pas re-débattre.

## D001 — [Titre de la décision]
**Date** : [date]
**Contexte** : [pourquoi cette décision était nécessaire]
**Décision** : [ce qui a été décidé]
**Raison** : [pourquoi ce choix]
**Alternative écartée** : [autre option et pourquoi elle a été rejetée]
```

Pour les dettes techniques acceptées, utiliser le format DETTE: décrit
dans rules-templates.md section no-workarounds.md.

**PROJECT_STATE.md** — photo instantanée :
```markdown
# État du projet — [Nom du Projet]

> Dernière mise à jour : [date]

## Phase actuelle
[ex: MVP en cours, Beta, Production]

## Métriques du code
| Métrique | Valeur |
|---|---|
| Écrans / Pages | X |
| Composants | X |
| Hooks / Services | X |
| Migrations SQL | X |
| Tables BDD | X |

## Blockers actuels
1. [blocker]

## Prochaines étapes prioritaires
1. [étape]

## Bugs connus
- [bug]
```

**CHANGELOG.md** — journal des changements :
```markdown
# Changelog — [Nom du Projet]

## [date] — [titre du changement]
- [description de ce qui a changé]
- [description de ce qui a changé]
```

## Adaptation par type de projet

### App mobile / SaaS complet
→ Tout créer. Toutes les phases, tous les agents, toutes les rules.

### Site web / Landing page
→ Simplifier : pas besoin de 04-legal/ complet ni de database-schema.md.
  Garder rules/security.md et rules/code-style.md minimum.

### API / Backend
→ Renforcer 05-architecture/ (api-design.md crucial). Ajouter des rules
  spécifiques aux endpoints et à la validation des inputs.

### CLI / Outil développeur
→ Simplifier 03-business/ et 04-legal/. Renforcer 05-architecture/ et
  la documentation technique.

### Extension navigateur / Plugin
→ Ajouter des rules spécifiques aux permissions et à la sécurité du navigateur.
  Simplifier 03-business/.
