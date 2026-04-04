# Plan de session — 4 avril 2026
## Objectif : Amener le projet au stade "prêt pour soumission stores"

---

## Les 3 acteurs

| Acteur | Environnement | Capacités |
|---|---|---|
| **Cowork** (moi) | VM Linux, accès fichiers projet + Supabase MCP + web | Écrire/modifier du code, créer des fichiers, rechercher sur le web, interagir avec Supabase directement, analyser, documenter |
| **Claude Code** | Terminal local de Nicolas, accès complet au repo git | Exécuter npm/git/eas, lancer les tests, build l'APK, push sur GitHub, installer des packages |
| **Nicolas** | Navigateur + téléphone Android | Créer des comptes en ligne (stores, Sentry, domaine), tester l'app sur device réel, configurer des services externes |

---

## Phase 1 — EN PARALLÈLE (maintenant)

### COWORK fait :

| # | Tâche | Détail | Durée |
|---|---|---|---|
| C1 | Implémenter le cache offline React Query | Cache persistant pour que les sentiers, météo et favoris soient disponibles sans réseau | 2h |
| C2 | Préparer le code notifications push FCM | Configurer le code côté React Native (expo-notifications), hooks, listeners — tout sauf la config Firebase elle-même | 1.5h |
| C3 | Vérifier la base Supabase via MCP | Confirmer les 25 tables, 90 RLS policies, 5 RPCs directement en base | 15min |
| C4 | Mettre à jour deployment.md | Synchroniser la checklist de déploiement avec l'état réel du code post-refactoring | 15min |

### CLAUDE CODE fait (commandes à copier-coller) :

| # | Tâche | Commande exacte | Durée |
|---|---|---|---|
| CC1 | Installer Jest + lancer les tests | `cd app && npm install --save-dev jest ts-jest @types/jest && npx jest --verbose` | 5min |
| CC2 | Supprimer l'APK 167MB | `rm -f app/android/app/build/outputs/apk/release/app-release.apk` | 1min |
| CC3 | Vérifier si .env a été commité | `git log --all --full-history -- app/.env` | 2min |
| CC4 | Commiter les changements de cette session | Créer une branche `refactor/session-5-cleanup` + commiter le refactoring, les tests, le .gitignore, le legal-pages, le CLAUDE.md | 5min |
| CC5 | Pusher le dossier legal-pages/ | `git push origin refactor/session-5-cleanup` | 2min |
| CC6 | Activer GitHub Pages | `gh api repos/Nicolas97450/randonnee-reunion/pages -X POST -f source[branch]=main -f source[path]=/legal-pages` (après merge sur main) | 2min |

### NICOLAS fait (seulement si tu veux avancer pendant qu'on travaille) :

| # | Tâche | Où | Coût |
|---|---|---|---|
| N1 | Créer projet Sentry | sentry.io → New Project → React Native → copier le DSN | Gratuit |
| N2 | Ajouter DSN dans app/.env | Ligne `SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz` | — |

> **Pourquoi maintenant ?** C'est la seule action Nicolas qui débloque du code (Sentry). Le reste peut attendre la fin de la phase 2.

---

## Phase 2 — EN PARALLÈLE (après Phase 1)

### COWORK fait :

| # | Tâche | Détail | Durée |
|---|---|---|---|
| C5 | Écrire tests supplémentaires pour hooks critiques | useWeather, useOffTrailAlert, useTrailStatus — fonctions pures testables | 1h |
| C6 | Review de sécurité finale | Audit des secrets, des RLS, des inputs non validés | 30min |
| C7 | Mettre à jour TOUTE la documentation projet | TASKS.md, PROJECT_STATE.md, CHANGELOG.md, SESSIONS.md, deployment.md | 30min |

### CLAUDE CODE fait :

| # | Tâche | Commande | Durée |
|---|---|---|---|
| CC7 | Build debug pour test | `cd app && npx expo run:android` (si émulateur dispo) ou build APK debug | 15min |
| CC8 | npm audit détaillé | `cd app && npm audit --json > ../audit-report.json` | 2min |
| CC9 | Vérifier le TypeScript | `cd app && npx tsc --noEmit` | 3min |

---

## Phase 3 — SÉQUENTIEL (après Phases 1-2)

### NICOLAS fait (checklist à cocher, pas urgent) :

Ces tâches ne bloquent ni Cowork ni Claude Code. Tu les fais quand tu veux, dans cet ordre :

| # | Tâche | Où | Coût | Délai |
|---|---|---|---|---|
| N3 | Commander domaine randonnee-reunion.re | OVH, LWS ou Gandi | ~12€/an | Propagation DNS 24-48h |
| N4 | Créer email contact@ | Dashboard du registrar | Gratuit | Immédiat |
| N5 | Créer compte Google Play | play.google.com/console | 25$ (1 fois) | Vérification 24-48h |
| N6 | Créer compte Apple Developer | developer.apple.com | 99$/an | Vérification 24h-2 sem |
| N7 | Configurer DNS → GitHub Pages | Dashboard registrar, ajouter CNAME | — | 24h propagation |
| N8 | Remplir eas.json iOS | Copier ascAppId + appleTeamId depuis Apple Developer | — | 5min |
| N9 | Tester l'APK sur Android réel | Installer l'APK debug + parcours complet | — | 30min |
| N10 | Prendre screenshots stores | Sur device réel pendant le test | — | 30min |
| N11 | Créer feature graphic Google Play | Canva (1024x500 px) | Gratuit | 30min |
| N12 | Configurer RevenueCat | revenuecat.com (quand tu veux activer les paiements) | Gratuit | 1h |

---

## Phase 4 — FINAL (quand tout est prêt)

### ENSEMBLE :

| # | Tâche | Qui | Détail |
|---|---|---|---|
| F1 | Build production Android | Claude Code | `cd app && eas build --profile production --platform android --local` |
| F2 | Build production iOS | Claude Code | `cd app && eas build --profile production --platform ios` (après config eas.json) |
| F3 | Test du build production | Nicolas | Installer sur device, parcours complet |
| F4 | Soumission Google Play | Nicolas | Google Play Console : upload AAB + fiche store |
| F5 | Soumission App Store | Nicolas | App Store Connect : upload IPA + fiche store |
| F6 | Review croisée finale | Cowork | Vérification que toute la doc est à jour |

---

## Résumé visuel

```
                    MAINTENANT              APRÈS PHASE 1          QUAND TU VEUX         BUILD FINAL
                    ──────────              ──────────────          ─────────────         ───────────
COWORK          [C1 Cache offline   ]   [C5 Tests hooks   ]                           [F6 Review doc ]
                [C2 Push notifs code]   [C6 Security review]
                [C3 Check Supabase  ]   [C7 Update docs    ]
                [C4 Update deploy   ]

CLAUDE CODE     [CC1 Install Jest   ]   [CC7 Build debug   ]                          [F1 Build prod ]
                [CC2 Delete APK     ]   [CC8 npm audit     ]                          [F2 Build iOS  ]
                [CC3 Check .env git ]   [CC9 TypeScript    ]
                [CC4 Commit changes ]
                [CC5 Push legal     ]
                [CC6 GitHub Pages   ]

NICOLAS         [N1 Sentry (optionnel)]                      [N3 Domaine       ]     [F3 Test build ]
                [N2 DSN .env          ]                      [N4 Email         ]     [F4 Submit Play]
                                                             [N5 Google Play   ]     [F5 Submit App ]
                                                             [N6 Apple Dev     ]
                                                             [N7-N12 Config... ]
```

---

## Règles de la session

1. **Zéro bricolage** — Règle no-workarounds.md appliquée par tous
2. **Chaque modification documentée** — CHANGELOG + TASKS mis à jour en temps réel
3. **Pas de commit sur main** — Branches feature/ puis merge
4. **Secrets jamais dans le code** — .env uniquement
5. **Si bloqué → documenter** — Pas de hack, on note le problème dans TASKS.md

---

*Plan créé le 4 avril 2026*
