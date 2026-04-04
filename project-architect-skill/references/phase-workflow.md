# Workflow par phases — Quel skill pour quel document

Ce guide détaille, pour chaque phase du projet, quels documents produire et
quel skill spécialisé utiliser pour garantir la qualité professionnelle.

## Comment utiliser les skills

Quand tu crées un document dans docs/, fais appel au skill approprié pour
qu'il soit rédigé avec l'expertise d'un spécialiste. Par exemple, pour le PRD,
invoque le skill `product-management:write-spec` en lui donnant le contexte
du projet — il produira un document de qualité product manager.

---

## Phase 1 — Discovery (docs/01-discovery/)

Cette phase répond à : "Est-ce que le projet a du sens ?"

| Document | Skill | Ce que le skill apporte |
|----------|-------|------------------------|
| brainstorm.md | Aucun — conversation libre | Notes brutes, idées, pistes |
| problem-statement.md | `product-management:write-spec` | Structuration problème/solution/valeur |
| market-analysis.md | `marketing:competitive-brief` + recherche web | Taille du marché, tendances, segments |
| competitive-analysis.md | `product-management:competitive-analysis` | Matrice concurrentielle, positionnement, gaps |
| user-personas.md | `design:user-research` | Personas structurés avec besoins, frustrations, objectifs |
| validation-notes.md | Créé vide (template) | À remplir lors des tests utilisateurs |

### Ordre recommandé
1. brainstorm.md → 2. problem-statement.md → 3. user-personas.md →
4. market-analysis.md → 5. competitive-analysis.md → 6. validation-notes.md

---

## Phase 2 — Product (docs/02-product/)

Cette phase répond à : "Qu'est-ce qu'on construit exactement ?"

| Document | Skill | Ce que le skill apporte |
|----------|-------|------------------------|
| PRD.md | `product-management:write-spec` | PRD structuré : problème, scope, requirements, métriques |
| user-stories.md | `product-management:feature-spec` | User stories au format "En tant que... je veux... afin de..." |
| features-roadmap.md | `product-management:roadmap-management` | Priorisation Now/Next/Later ou par trimestre |
| acceptance-criteria.md | `product-management:feature-spec` | Critères vérifiables pour chaque story |

### Ordre recommandé
1. PRD.md → 2. user-stories.md → 3. acceptance-criteria.md → 4. features-roadmap.md

### Le PRD dynamique
Le PRD est le document le plus important et le plus susceptible de devenir obsolète.
Voici comment le garder vivant :

- Chaque section a un statut : [DRAFT] / [VALIDATED] / [IMPLEMENTED] / [DEPRECATED]
- Quand une feature est implémentée, son statut passe à [IMPLEMENTED]
- Quand une feature est abandonnée, son statut passe à [DEPRECATED] avec la raison
- La rule documentation.md oblige Claude à le mettre à jour après chaque feature

---

## Phase 3 — Business (docs/03-business/)

Cette phase répond à : "Comment le projet est viable ?"

| Document | Skill | Ce que le skill apporte |
|----------|-------|------------------------|
| business-model.md | Brainstorm + recherche web | Canvas structuré (proposition valeur, segments, canaux, revenus) |
| monetization.md | Recherche web + analyse | Options de pricing, modèle freemium/abo/one-shot |
| go-to-market.md | `marketing:campaign-plan` | Plan de lancement : canaux, messaging, calendrier |
| financial-projections.md | `data:statistical-analysis` | Projections de revenus, coûts, point mort |

### Ordre recommandé
1. business-model.md → 2. monetization.md → 3. financial-projections.md → 4. go-to-market.md

---

## Phase 4 — Legal (docs/04-legal/)

Cette phase répond à : "Est-ce qu'on est en règle ?"

| Document | Skill | Ce que le skill apporte |
|----------|-------|------------------------|
| legal-checklist.md | `legal:compliance-check` | Checklist complète selon le type de projet et le marché |
| privacy-policy.md | `legal:compliance-check` | Politique RGPD/CCPA structurée selon les données collectées |
| terms-of-service.md | `legal:legal-response` | CGU adaptées au type de service |
| compliance-log.md | Créé avec structure | Journal des revues de conformité (MAJ continue) |
| data-processing.md | `legal:compliance-check` | Registre des traitements de données (RGPD Art. 30) |

### Ordre recommandé
1. legal-checklist.md → 2. privacy-policy.md → 3. terms-of-service.md →
4. data-processing.md → 5. compliance-log.md

### Important
Les documents juridiques sont des modèles de départ, pas des documents définitifs.
Rappeler à l'utilisateur de les faire valider par un professionnel du droit
avant mise en production.

---

## Phase 5 — Architecture (docs/05-architecture/)

Cette phase répond à : "Comment on le construit techniquement ?"

| Document | Skill | Ce que le skill apporte |
|----------|-------|------------------------|
| tech-stack.md | `engineering:architecture` | Choix de stack avec justifications et alternatives écartées |
| system-design.md | `engineering:system-design` | Architecture système, composants, flux de données |
| database-schema.md | `engineering:architecture` | Schéma BDD avec tables, relations, index |
| api-design.md | `engineering:documentation` | Endpoints, méthodes, payloads, codes d'erreur |
| testing-strategy.md | `engineering:testing-strategy` | Pyramide de tests, outils, couverture cible |
| adr/001-*.md | `engineering:architecture` | Architecture Decision Records |

### Ordre recommandé
1. tech-stack.md → 2. system-design.md → 3. database-schema.md →
4. api-design.md → 5. testing-strategy.md → 6. ADRs si nécessaire

---

## Phase 6 — Operations (docs/06-operations/)

Cette phase répond à : "Comment on déploie et on maintient ?"

| Document | Skill | Ce que le skill apporte |
|----------|-------|------------------------|
| deployment.md | `engineering:deploy-checklist` | Guide de déploiement étape par étape |
| environments.md | `engineering:documentation` | Config dev/staging/prod, variables d'env par env |
| monitoring.md | `operations:runbook` | Métriques à surveiller, alertes, procédures |
| security-checklist.md | `operations:risk-assessment` | Checklist sécurité pré-production |

### Ordre recommandé
1. environments.md → 2. deployment.md → 3. monitoring.md → 4. security-checklist.md

---

## Vue d'ensemble des dépendances entre phases

```
Phase 1 (Discovery) ──→ Phase 2 (Product) ──→ Phase 5 (Architecture)
                    ──→ Phase 3 (Business)          ↓
                                              Phase 6 (Operations)
                    ──→ Phase 4 (Legal) ←── MAJ continue selon features
```

Les phases 1, 2, 3 peuvent se faire en parallèle dans une certaine mesure.
La phase 4 (Legal) doit être revue après chaque ajout de feature.
La phase 5 dépend de la phase 2 (il faut savoir quoi construire avant de
décider comment le construire).
La phase 6 vient en dernier mais peut être anticipée.
