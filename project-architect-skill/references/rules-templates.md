# Templates pour .claude/rules/

Chaque fichier dans .claude/rules/ est chargé automatiquement à chaque session.
Adapte ces templates au projet — ne les copie pas tel quel, personnalise-les
en fonction de la stack, du type de projet et des contraintes spécifiques.

---

## security.md — Sécurité du code

```markdown
# Règles de sécurité

## Secrets et credentials
- Ne JAMAIS inclure de clés API, tokens, mots de passe ou secrets dans le code source
- Utiliser exclusivement des variables d'environnement via .env (non commité)
- Référencer .env.example pour documenter les variables nécessaires sans leurs valeurs
- Avant chaque commit, vérifier qu'aucun secret n'est présent dans le diff

## Validation des entrées
- Toute donnée provenant de l'utilisateur doit être validée et assainie
- Utiliser des schémas de validation (Zod, Joi, Pydantic selon la stack)
- Ne jamais construire de requêtes SQL par concaténation de chaînes
- Échapper les sorties HTML pour prévenir les attaques XSS

## Dépendances
- Ne pas installer de packages sans vérifier leur popularité et maintenance
- Préférer les packages largement adoptés et activement maintenus
- Vérifier les vulnérabilités connues avant d'ajouter une dépendance

## Authentification
- Utiliser des bibliothèques éprouvées (bcrypt, argon2 pour le hashing)
- Implémenter des tokens JWT avec expiration courte
- Ne jamais stocker de mots de passe en clair

## Spécifique mobile (si app mobile)
- Stocker les tokens/secrets dans SecureStore (iOS Keychain / Android Keystore)
- Ne jamais stocker de données sensibles dans AsyncStorage (non chiffré)
- Activer ProGuard/R8 pour l'obfuscation Android
- Vérifier les permissions demandées — ne demander que le strict nécessaire
- Les données GPS/localisation sont des données sensibles RGPD

## Contournements
- Ne JAMAIS désactiver la sécurité pour "faire marcher" quelque chose
- Si un problème de sécurité bloque, le documenter dans TASKS.md et chercher
  une solution propre plutôt qu'un contournement
```

---

## compliance.md — RGPD et conformité

```markdown
# Règles de conformité

## Données personnelles (RGPD / CCPA)
- Toute collecte de donnée personnelle nécessite un consentement explicite
- Documenter chaque type de donnée collectée dans docs/04-legal/data-processing.md
- Implémenter le droit à la suppression (droit à l'oubli)
- Implémenter le droit à l'export (portabilité des données)
- Les données personnelles doivent être chiffrées au repos et en transit

## Cookies et tracking
- Afficher une bannière de consentement AVANT tout cookie non-essentiel
- Les cookies techniques (session, authentification) ne nécessitent pas de consentement
- Documenter chaque cookie dans la politique de confidentialité

## Features sociales
- Tout ajout de feature sociale (profils, messages, partage, commentaires) déclenche
  obligatoirement une revue de docs/04-legal/privacy-policy.md
- Les données de profil utilisateur sont des données personnelles → RGPD s'applique

## Mises à jour
- Après chaque feature touchant aux données utilisateur, mettre à jour :
  - docs/04-legal/privacy-policy.md
  - docs/04-legal/compliance-log.md (ajouter une entrée datée)
  - docs/04-legal/data-processing.md si nouveau type de donnée
```

---

## code-style.md — Conventions de code

Ce template est un point de départ. Adapte-le à la stack du projet.

```markdown
# Conventions de code

## Formatage
- Indentation : [2 espaces / 4 espaces / tabs] selon la stack
- Longueur de ligne max : 100 caractères
- Point-virgules : [oui / non] selon la convention du projet
- Guillemets : [simples / doubles] selon la convention du projet

## Nommage
- Variables et fonctions : camelCase
- Composants / Classes : PascalCase
- Constantes : UPPER_SNAKE_CASE
- Fichiers : kebab-case pour les utilitaires, PascalCase pour les composants
- Tables BDD : snake_case au pluriel (users, user_profiles)

## Structure des fichiers
- Un composant/module par fichier
- Imports groupés : d'abord les libs externes, puis les imports internes
- Exports nommés préférés aux exports par défaut (sauf composants React)

## Commentaires
- Commenter le "pourquoi", pas le "quoi"
- Les fonctions publiques ont un JSDoc/docstring avec description et paramètres
- Les TODO incluent un identifiant : TODO(nom): description

## Gestion d'erreurs
- Toujours typer les erreurs catch, ne pas ignorer silencieusement
- Les erreurs utilisateur retournent des messages clairs et actionnables
- Les erreurs système sont loggées avec contexte suffisant pour le debug
```

---

## documentation.md — Maintien de la documentation

```markdown
# Règles de documentation

## Règle d'or : VÉRIFIER AVANT DE MARQUER FAIT
Avant de marquer une feature comme [x] FAIT dans le PRD ou TASKS.md, vérifier
dans le code que le fichier existe et que la feature fonctionne réellement.
Ne JAMAIS se fier aux audits précédents ou aux déclarations — vérifier le code source.

## Compteurs vérifiables
Le CLAUDE.md et PROJECT_STATE.md contiennent des compteurs (écrans, composants,
hooks, stores, migrations, tables, etc.). Ces compteurs DOIVENT être vérifiés et
mis à jour à chaque session où ils changent.

## Après chaque ajout de feature
1. Mettre à jour docs/02-product/PRD.md — section features
2. Mettre à jour docs/02-product/user-stories.md si nouvelles stories
3. Vérifier que les pages d'aide/tuto dans l'app reflètent la feature
4. Ajouter une entrée dans project/CHANGELOG.md
5. Mettre à jour les compteurs dans CLAUDE.md et PROJECT_STATE.md

## Après chaque modification d'architecture
1. Mettre à jour docs/05-architecture/system-design.md
2. Si changement de BDD : docs/05-architecture/database-schema.md
3. Si changement d'API : docs/05-architecture/api-design.md
4. Créer un ADR dans docs/05-architecture/adr/ pour documenter le pourquoi
5. Mettre à jour les compteurs (migrations, tables) dans CLAUDE.md

## Après chaque session de travail
1. Mettre à jour project/TASKS.md — marquer les tâches complétées
2. Ajouter une entrée dans project/SESSIONS.md (format : Objectif, Durée, Réalisé)
3. Mettre à jour project/PROJECT_STATE.md si changement significatif
4. Vérifier les dettes techniques dans DECISIONS.md — signaler si une date de
   résolution est dépassée

## Avant de commencer une session (procédure de reprise)
1. Lire CLAUDE.md — pour le contexte global et les conventions
2. Lire project/TASKS.md — pour savoir ce qui est en cours (respecter la priorisation)
3. Lire project/DECISIONS.md — pour ne pas re-débattre des choix déjà faits
4. Lire project/SESSIONS.md — pour voir la dernière session et ce qui a été fait
5. Lire project/PROJECT_STATE.md — pour les blockers et l'état actuel
6. Résumer en 2-3 phrases ce qu'on a compris de l'état du projet
7. Identifier la tâche prioritaire selon l'ordre : Blockers > Bugs > Features > Améliorations
8. Demander confirmation à l'utilisateur : "Je reprends sur [tâche X], ça te va ?"

## Audit périodique
Lancer /health-check toutes les 5-10 sessions pour détecter les dérives de
documentation. Si le score d'une catégorie passe sous 6/10, traiter les
corrections comme des Bugs (priorité haute dans TASKS.md).
```

---

## git.md — Bonnes pratiques Git

```markdown
# Règles Git

## Branches
- Ne JAMAIS push directement sur main/master
- Une branche par feature : feature/nom-de-la-feature
- Une branche par fix : fix/description-du-bug
- Nommer les branches en kebab-case

## Commits
- Messages de commit en anglais, format conventionnel :
  feat: add user authentication
  fix: resolve cart total calculation
  docs: update API documentation
  refactor: simplify payment flow
- Un commit = un changement logique, pas un gros commit avec tout dedans

## Avant chaque commit
- Vérifier qu'aucun secret n'est dans le diff (clés API, tokens, .env)
- Lancer les tests : tous doivent passer
- Lancer le linter : aucune erreur
- Vérifier le .gitignore : .env, node_modules, dist, __pycache__, etc.

## Pull Requests
- Chaque PR a une description claire de ce qui change et pourquoi
- Les PR doivent être review avant merge (même en solo → utiliser l'agent code-reviewer)
```

---

## quality.md — Qualité du code

```markdown
# Règles de qualité

## Tests (voir aussi testing.md pour les règles détaillées)
- Chaque nouvelle feature a au minimum un test (1 happy path + 1 erreur)
- Les tests couvrent les cas normaux ET les cas d'erreur
- Ne pas commiter du code avec des tests qui échouent
- On ne passe PAS à la feature suivante tant que les tests ne passent pas

## Performance
- Les requêtes BDD sont optimisées (index, pagination, pas de N+1)
- Les assets sont optimisés (images compressées, lazy loading)
- Les appels API sont mis en cache quand pertinent

## Accessibilité
- Les images ont un attribut alt
- Les formulaires ont des labels associés
- La navigation au clavier fonctionne
- Les contrastes de couleur respectent les standards WCAG AA
```

---

## no-workarounds.md — Zéro bricolage (RÈGLE FONDAMENTALE)

Cette règle est la plus importante de toutes. Elle doit être générée pour CHAQUE projet,
sans exception. Le bricolage (workarounds, hacks, quick fixes) est la cause n°1 de la dette
technique dans les projets assistés par IA. Quand un problème survient, l'IA a naturellement
tendance à trouver un contournement rapide plutôt que de résoudre la cause racine — c'est
exactement ce comportement que cette règle interdit.

```markdown
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

## Dette technique acceptée

Parfois, un compromis technique est nécessaire pour avancer. C'est différent du
bricolage : un compromis est une décision consciente, documentée et planifiée.

La différence fondamentale : **seul l'utilisateur peut accepter une dette technique.**
Claude peut proposer un compromis, expliquer les risques et les alternatives, mais
la décision appartient toujours à l'utilisateur.

### Processus
1. Claude identifie qu'une solution propre prendrait beaucoup plus de temps
2. Claude propose le compromis à l'utilisateur en expliquant :
   - Ce qu'il propose de faire (la solution rapide)
   - Ce que serait la solution idéale
   - Les risques du compromis
   - Le temps estimé pour résoudre proprement plus tard
3. L'utilisateur décide : solution propre ou compromis accepté
4. Si compromis accepté, Claude le documente dans project/DECISIONS.md avec ce format :

   ## DETTE: [description courte]
   **Date** : [date]
   **Type** : Dette technique acceptée
   **Compromis** : [ce qui a été fait]
   **Solution idéale** : [ce qui aurait dû être fait]
   **Risques** : [conséquences si non résolu]
   **Résolution prévue** : [quand et comment résoudre — ex: "Sprint 3" ou "Avant lancement"]
   **Décidé par** : Utilisateur

5. Claude ajoute une tâche dans project/TASKS.md section "Améliorations" avec un
   rappel de la date de résolution prévue
```

---

## code-comments.md — Commentaires systématiques dans le code

Cette règle est particulièrement importante pour les projets en vibe coding, où
l'utilisateur n'écrit pas le code lui-même et a besoin de comprendre ce que fait
chaque partie du projet en lisant les commentaires.

```markdown
# Règles de commentaires

## Pourquoi cette règle est critique
Dans un projet assisté par IA, l'utilisateur ne lit pas chaque ligne de code.
Les commentaires sont son seul moyen de comprendre ce que fait son propre projet.
Un code sans commentaires est un code opaque — l'utilisateur perd le contrôle.

## En-tête de fichier (obligatoire)
Chaque fichier source doit commencer par un commentaire qui explique :
- Ce que fait ce fichier (son rôle dans le projet)
- De quoi il dépend (les modules/services principaux qu'il utilise)

Exemple :
/**
 * TrailCard.tsx — Carte de présentation d'un sentier dans les listes.
 * Affiche nom, difficulté, distance, dénivelé et photo miniature.
 * Utilisé dans TrailListScreen et FavoritesScreen.
 */

## Fonctions et hooks (obligatoire)
Chaque fonction exportée et chaque hook doit avoir un commentaire qui explique :
- Ce que fait la fonction
- Ses paramètres importants
- Ce qu'elle retourne

Exemple :
/**
 * Calcule la distance Haversine entre deux points GPS.
 * @param lat1, lon1 - Coordonnées du point de départ
 * @param lat2, lon2 - Coordonnées du point d'arrivée
 * @returns Distance en kilomètres
 */

## Logique complexe (obligatoire)
Tout bloc de code dont la logique n'est pas évidente en 5 secondes doit être
commenté. Le commentaire explique le POURQUOI, pas le QUOI :
- Pourquoi ce calcul ? Pourquoi ce seuil ? Pourquoi ce fallback ?
- Pas de commentaires qui paraphrasent le code ("incrémente i de 1")

## Ce qui ne nécessite PAS de commentaire
- Les getters/setters triviaux
- Les fonctions dont le nom suffit à comprendre le rôle
- Les imports
```

---

## testing.md — Tests bloquants

```markdown
# Règles de tests

## Principe fondamental
On ne passe PAS à la feature suivante tant que les tests de la feature actuelle
ne passent pas. Empiler du code non testé crée un château de cartes qui s'effondre
au premier changement.

## Quand écrire les tests
- PENDANT le développement de la feature, pas après
- Chaque feature a au minimum :
  - 1 test du cas normal (happy path)
  - 1 test d'un cas d'erreur (input invalide, réseau down, etc.)
- Les fonctions utilitaires (calculs, formatage, validation) ont des tests unitaires

## Quand les tests bloquent
- Si un test existant échoue après un changement → corriger AVANT de continuer
- Si une feature est terminée mais ses tests ne passent pas → elle n'est PAS terminée
- Ne JAMAIS désactiver, commenter ou skip un test pour "avancer"
- Ne JAMAIS marquer une tâche comme faite dans TASKS.md si les tests ne passent pas

## Structure d'un fichier test (exemple)
Voici la structure minimale attendue pour un test. Adapter au framework du projet
(Jest, Vitest, Pytest, etc.) :

// geo.test.ts — Tests des fonctions géographiques
describe('calculateDistance', () => {
  // Cas normal (happy path)
  it('should return correct distance between two known points', () => {
    const result = calculateDistance(48.8566, 2.3522, 43.2965, 5.3698);
    expect(result).toBeCloseTo(660, 0); // Paris → Marseille ~660km
  });

  // Cas d'erreur
  it('should return 0 when both points are identical', () => {
    const result = calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
    expect(result).toBe(0);
  });

  // Edge case
  it('should handle negative coordinates', () => {
    const result = calculateDistance(-21.1151, 55.5364, -21.3419, 55.4778);
    expect(result).toBeGreaterThan(0);
  });
});

## Exceptions (avec validation utilisateur)
Si l'environnement ne permet pas de lancer les tests (ex: pas de test runner
installé, dépendance manquante), documenter dans project/TASKS.md :
- Quels tests ont été écrits mais pas exécutés
- Quelle commande l'utilisateur doit lancer pour les exécuter
- Ce qui est attendu comme résultat
```

---

## scalability.md — Scalabilité et performance

```markdown
# Règles de scalabilité

## Pourquoi cette règle existe
Un MVP fonctionne avec 10 utilisateurs. Mais si l'app décolle, le code doit
pouvoir suivre. Penser à la scalabilité dès le départ coûte peu et évite des
réécritures coûteuses plus tard.

## Base de données
- Chaque requête fréquente doit avoir un index approprié
- Utiliser la pagination pour toutes les listes (jamais de SELECT * sans LIMIT)
- Éviter les requêtes N+1 (utiliser les jointures ou le batching)
- Les compteurs fréquemment lus doivent être pré-calculés, pas calculés à la volée
- Documenter les index et les requêtes critiques dans database-schema.md

## API et réseau
- Implémenter du cache côté client pour les données qui changent peu
- Les réponses API volumineuses sont paginées
- Les appels aux API tierces ont un timeout et un fallback
- Rate limiting sur les endpoints sensibles (auth, upload, etc.)

## Frontend / Mobile
- Les listes longues utilisent la virtualisation (FlatList, pas ScrollView)
- Les images sont optimisées (compression, lazy loading, taille adaptée)
- Le bundle est surveillé — ne pas ajouter de lib lourde sans justification
- Les données locales volumineuses sont chargées de manière incrémentale

## Questions à se poser à chaque feature
- Que se passe-t-il avec 10 000 utilisateurs simultanés ?
- Que se passe-t-il si cette liste a 100 000 éléments ?
- Que se passe-t-il si l'API tierce est en panne pendant 1h ?
- Que se passe-t-il si le stockage local est plein ?

## Métriques de performance à surveiller
Documenter dans PROJECT_STATE.md les métriques clés du projet :
- Taille du bundle (JS/CSS/images) — alerter si > seuil défini
- Temps de chargement initial (cible < 3s)
- Latence API P95 (cible < 300ms)
- Nombre de requêtes par écran (alerter si > 5 par écran)
Ces métriques sont vérifiées lors du /health-check.
```

---

## defensive-coding.md — Codage défensif et edge cases

```markdown
# Règles de codage défensif

## Principe
Chaque input peut être invalide. Chaque réseau peut tomber. Chaque liste peut
être vide. Le code doit gérer ces cas gracieusement, pas crasher silencieusement.

## Entrées utilisateur
- Toute entrée est validée AVANT traitement (longueur, format, caractères)
- Les entrées texte sont assainies (pas de HTML/JS injecté)
- Les valeurs numériques ont des bornes min/max vérifiées
- Les fichiers uploadés sont vérifiés (taille, type MIME, pas juste l'extension)

## Données et listes
- Toujours gérer le cas "liste vide" — afficher un état vide informatif, pas un crash
- Toujours gérer le cas "donnée null/undefined" — valeur par défaut ou message clair
- Les résultats de requêtes BDD peuvent être vides — ne pas supposer qu'il y a des données
- Les champs optionnels de l'API peuvent être absents — utiliser l'optional chaining

## Réseau et services externes
- Chaque appel réseau a un timeout configuré
- Chaque appel réseau a un catch avec message d'erreur clair pour l'utilisateur
- Si un service tiers est en panne, l'app continue de fonctionner en mode dégradé
- Les retries automatiques ont un backoff exponentiel (pas de boucle infinie)

## Concurrence
- Deux utilisateurs qui modifient la même ressource en même temps : utiliser
  des verrous optimistes (version/timestamp) ou des contraintes BDD (UNIQUE)
- Les opérations critiques (paiement, validation) doivent être idempotentes
- Les compteurs partagés (likes, vues) utilisent des opérations atomiques (INCREMENT)

## Erreurs
- Pas de try/catch vides qui avalent les erreurs
- Chaque erreur catch est soit loggée, soit affichée, soit les deux
- Les erreurs utilisateur sont affichées dans un langage compréhensible
- Les erreurs système sont loggées avec assez de contexte pour le debug

## Exemples concrets

BON — gestion d'une liste potentiellement vide :
  const trails = data?.trails ?? [];
  if (trails.length === 0) {
    return <EmptyState message="Aucun sentier trouvé" />;
  }
  return <FlatList data={trails} ... />;

MAUVAIS — crash si data est null :
  return <FlatList data={data.trails} ... />;

BON — appel réseau avec timeout et fallback :
  try {
    const weather = await fetchWithTimeout(weatherAPI, { timeout: 5000 });
    return weather;
  } catch (error) {
    console.error('Météo indisponible:', error.message);
    return { status: 'unavailable', message: 'Météo temporairement indisponible' };
  }

MAUVAIS — appel sans protection :
  const weather = await fetch(weatherAPI);
  return weather.json();
```
