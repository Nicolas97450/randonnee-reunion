# Checklist sécurité — Meilleures pratiques

Basé sur l'OWASP Top 10 2025, les secure coding rules de la communauté Claude Code,
et les standards de l'industrie. À adapter selon la stack du projet.

## Secrets et credentials

- [ ] .env dans .gitignore
- [ ] .env.example avec des placeholders (jamais de vraies valeurs)
- [ ] Aucun secret dans le code source (grep pour API_KEY, SECRET, TOKEN, PASSWORD)
- [ ] Aucun secret dans l'historique git
- [ ] Rotation des secrets en production planifiée
- [ ] Variables d'environnement différentes par environnement (dev/staging/prod)

## Authentification

- [ ] Hashing des mots de passe avec bcrypt/argon2 (jamais MD5 ou SHA seul)
- [ ] Tokens JWT avec expiration courte (15-60 min)
- [ ] Refresh tokens avec rotation
- [ ] Rate limiting sur les endpoints d'authentification
- [ ] Protection contre le brute force (lockout après N tentatives)
- [ ] Validation de la complexité des mots de passe

## Autorisation

- [ ] Contrôle d'accès au niveau de chaque endpoint (pas seulement en frontend)
- [ ] Principe du moindre privilège (chaque rôle n'a que les permissions nécessaires)
- [ ] Pas d'IDOR (Insecure Direct Object Reference) — vérifier que l'utilisateur
      a le droit d'accéder à la ressource demandée

## Validation des entrées

- [ ] Toute entrée utilisateur validée côté serveur (jamais faire confiance au client)
- [ ] Schémas de validation (Zod, Joi, Pydantic) pour chaque endpoint
- [ ] Pas de construction de requêtes SQL par concaténation
- [ ] ORM ou requêtes paramétrées pour toutes les requêtes BDD
- [ ] Taille max des uploads définie et vérifiée
- [ ] Types MIME vérifiés pour les uploads de fichiers

## Protection XSS

- [ ] Échappement HTML pour tout contenu affiché
- [ ] Content Security Policy (CSP) configuré
- [ ] HttpOnly + Secure + SameSite sur les cookies
- [ ] Pas de dangerouslySetInnerHTML (React) ou v-html (Vue) sans sanitisation

## Headers de sécurité

- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY (ou SAMEORIGIN si iframes nécessaires)
- [ ] Strict-Transport-Security (HSTS)
- [ ] Content-Security-Policy
- [ ] Referrer-Policy
- [ ] Permissions-Policy

## CORS

- [ ] Origins autorisées explicitement listées (jamais *)
- [ ] Methods autorisées limitées au nécessaire
- [ ] Credentials: true seulement si nécessaire

## Base de données

- [ ] Connexions chiffrées (SSL/TLS)
- [ ] Utilisateur BDD avec permissions limitées (pas root/admin)
- [ ] Sauvegardes régulières et testées
- [ ] Données sensibles chiffrées au repos
- [ ] Index sur les colonnes de recherche
- [ ] Pagination pour éviter les dumps de table complets

## API

- [ ] Rate limiting global et par utilisateur
- [ ] Validation du Content-Type
- [ ] Réponses d'erreur qui n'exposent pas de détails internes en production
- [ ] Versioning d'API
- [ ] Timeouts configurés pour les appels externes

## Dépendances

- [ ] Audit régulier des vulnérabilités (npm audit, pip-audit, etc.)
- [ ] Lock files commitées (package-lock.json, poetry.lock)
- [ ] Pas de dépendances avec des CVE critiques non résolues

## Déploiement

- [ ] Mode debug désactivé en production
- [ ] HTTPS partout (pas de HTTP en production)
- [ ] Variables d'environnement de production séparées
- [ ] Logs de sécurité activés (tentatives de connexion, erreurs 401/403)
- [ ] Monitoring des anomalies
