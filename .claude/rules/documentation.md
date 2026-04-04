# Règles de documentation — Randonnée Réunion

## Après chaque ajout de feature
1. Mettre à jour docs/02-product/PRD.md — section features
2. Ajouter une entrée dans project/CHANGELOG.md
3. Mettre à jour project/TASKS.md
4. Si la feature touche aux données utilisateur :
   - Mettre à jour docs/04-legal/privacy-policy.md
   - Ajouter une entrée dans docs/04-legal/compliance-log.md

## Après chaque modification d'architecture
1. Mettre à jour docs/05-architecture/system-design.md
2. Si changement de BDD : docs/05-architecture/database-schema.md
3. Si nouvelle migration SQL : documenter dans database-schema.md
4. Ajouter une entrée dans project/DECISIONS.md pour le "pourquoi"

## Après chaque session de travail
1. Mettre à jour project/TASKS.md — marquer les tâches complétées
2. Ajouter une entrée dans project/SESSIONS.md
3. Mettre à jour project/PROJECT_STATE.md si changement significatif

## Avant de commencer une session
1. Lire project/TASKS.md pour savoir ce qui est en cours
2. Lire project/DECISIONS.md pour ne pas refaire des débats déjà tranchés
3. Vérifier project/SESSIONS.md pour la dernière session

## Migrations Supabase
- Chaque migration est numérotée séquentiellement (001, 002, ...)
- Documenter le contenu de chaque migration dans database-schema.md
- Les 19 migrations existantes (001→019) sont documentées
