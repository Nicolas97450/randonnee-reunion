# PROJECT_MEMORY.md — Randonnée Réunion
> Mémoire longue du projet. Contient le contexte complet, les décisions, les apprentissages.
> Mis à jour à chaque fin de sprint ou décision importante.

---

## 👤 Porteur du projet

- **Nom** : Nicolas
- **Profil** : Data Analyst junior
- **Approche dev** : Vibe coding avec IA (Claude Code) — cycles très rapides
- **Plateformes cibles** : iOS + Android simultané
- **Date de démarrage** : Mars 2026

---

## 🎯 Vision produit

Créer **la référence numérique pour la randonnée à La Réunion** en réunissant dans une seule app :
- Toutes les infos officielles (sentiers OMF, météo)
- Des cartes qui fonctionnent sans réseau
- Une mécanique de progression qui donne envie de découvrir TOUTE l'île
- Une dimension sociale pour randonner ensemble

**Phrase de positionnement :** *"La première app qui te donne envie de découvrir toute La Réunion — pas juste de t'y retrouver."*

---

## 📚 Décisions produit prises

### Décision #1 — MVP avant gamification complète
**Contexte :** Le scope initial incluait météo + OMF + gamification dès le MVP.
**Décision :** Livrer d'abord les fondations (sentiers + cartes offline + GPS) en 3 semaines, puis ajouter météo/OMF/gamification en semaine 3 également (tout dans le même MVP grâce au vibe coding).
**Raison :** Éviter de complexifier la V1 trop tôt, valider les fondations d'abord.

### Décision #2 — React Native plutôt que Flutter
**Contexte :** Choix de stack mobile cross-platform.
**Décision :** React Native + Expo.
**Raison :** Écosystème MapLibre GL plus mature en React Native, courbe d'apprentissage plus faible avec JS/TS, time to market plus rapide avec Expo managed workflow.

### Décision #3 — MapLibre GL + PMTiles pour les cartes offline
**Contexte :** Choix de la librairie cartographique et du format offline.
**Décision :** MapLibre GL Native (fork open-source de Mapbox) + format .pmtiles.
**Raison :** Pas de licence restrictive Mapbox, 100% offline natif, PMTiles = un fichier unique par sentier (téléchargement atomique, simple à gérer).

### Décision #4 — Supabase comme backend
**Contexte :** Choix du backend pour le MVP.
**Décision :** Supabase (PostgreSQL + PostGIS + Auth + Storage + Realtime).
**Raison :** PostGIS inclus pour les requêtes spatiales, Realtime pour le chat des Sorties, stack unifiée évitant la dépendance à Firebase/Google, gratuit jusqu'à usage significatif.

### Décision #5 — Strava = concurrent indirect, pas direct
**Contexte :** Évaluation de Strava comme concurrent.
**Décision :** Concurrent indirect. Intégration Strava prévue en V2 (export activité post-sortie).
**Raison :** Strava est un outil "après la sortie" (social, performance). Notre app est "avant et pendant" (préparation, navigation, gamification). Complémentaires plutôt que substituables. L'intégration V2 transforme Strava en levier d'acquisition organique.

### Décision #6 — Feature Sorties en P1, pas MVP
**Contexte :** Idée de feature sociale (planifier des randos en groupe avec chat).
**Décision :** P1, développée au Sprint 6 (semaines 7–8), après le lancement stores.
**Raison :** Feature complexe (Realtime, notifications, gestion de groupes). Lancer d'abord le core pour valider le product-market fit, puis enrichir avec le social.

### Décision #7 — Validation sentier : GPS auto + fallback manuel
**Contexte :** Comment valider qu'un utilisateur a bien fait un sentier ?
**Décision :** Algorithme de Hausdorff (distance trace user vs trace GPX référence, seuil 200m, couverture ≥ 70%) + bouton "Valider manuellement" si GPS insuffisant.
**Raison :** Ne pas bloquer l'utilisateur avec un GPS imprécis en zone forestière. La gamification doit rester fun, pas frustrante.

### Décision #8 — Freemium : limite à 3 cartes offline en gratuit
**Contexte :** Définition de la limite entre gratuit et premium.
**Décision :** 3 sentiers offline max en gratuit. Tout le reste (GPS, météo, OMF, gamification) est gratuit.
**Raison :** La valeur principale de l'app terrain = cartes offline. C'est le bon levier de conversion. Ne pas paywaller la météo ou l'OMF qui sont des features de sécurité.

---

## 🏔️ Contexte géographique La Réunion

### Sentiers officiels
- **Source principale** : OMF (Office de la Montagne et des Sentiers) — sentiers.reunion.fr
- **Randopitons.re** : 550+ circuits référencés (concurrent local, aussi source de données potentielle)
- **GR** : GR R1, GR R2 (Tour de l'île), GR R3 — sentiers longue distance
- **Zones clés** : Cirque de Mafate (inaccessible en voiture), Cirque de Cilaos, Cirque de Salazie, Piton de la Fournaise (volcan actif), Piton des Neiges (3071m, point culminant)

### Particularités terrain
- Réseau mobile quasi inexistant dans les cirques (Mafate = 0 réseau) → l'offline est critique
- Météo très changeante selon l'altitude et l'exposition (côté au vent vs sous le vent)
- Sentiers fermés régulièrement : cyclones, éboulements, éruptions volcaniques
- Sentiers GR fermés peuvent l'être des semaines voire des mois

### 18 zones de gamification (proposition)
1. Cirque de Mafate
2. Cirque de Cilaos
3. Cirque de Salazie
4. Piton des Neiges
5. Massif du Volcan (Piton de la Fournaise)
6. Plaine des Cafres
7. Plaine des Palmistes
8. Grand Sud Sauvage
9. Côte Ouest (Saint-Gilles, Saint-Paul)
10. Côte Est (Saint-André, Sainte-Rose)
11. Nord (Saint-Denis, Sainte-Marie)
12. Hauts de l'Ouest (Saint-Leu, Les Avirons)
13. Hauts du Sud (Saint-Pierre, Petite-Île)
14. Hauts du Nord-Est (Bras-Panon, Saint-Benoît)
15. Route des Tamarins (corridor)
16. Forêt de Bébour-Bélouve
17. Grand Bénare
18. Rivière des Remparts

---

## 🥊 Concurrence — points clés à retenir

| Concurrent | Menace | Notre avantage |
|---|---|---|
| **Randopitons** | Seul acteur local, 550 sentiers, gratuit | UX moderne, gamification, météo, OMF, Sorties |
| **AllTrails** | 65M users, brand forte | Zéro donnée Réunion officielle, pas de gamification |
| **Komoot** | Meilleure planification de routes | Pas de focus Réunion, pas de données OMF/météo locales |
| **Strava** | 135M users, habitudes établies | Outil post-sortie, pas de cartes, pas de sentiers — intégration V2 |

**Fenêtre d'opportunité estimée : 12–18 mois** avant qu'AllTrails ou un acteur majeur investisse sérieusement les DOM-TOM.

---

## 💡 Prompts Claude Code qui ont bien marché
> Cette section se remplit au fil du développement

*(Vide — à compléter dès le Sprint 1)*

**Format de log :**
```
[S1-01] Init projet Expo
Prompt : "..."
Résultat : ✅ Parfait / ⚠️ Nécessite ajustement / ❌ Échec
Note : ...
```

---

## 🐛 Bugs connus / Points de vigilance
> Cette section se remplit au fil du développement

*(Vide — à compléter dès le Sprint 1)*

---

## 📊 Métriques cibles (rappel)

| Métrique | Cible | Délai |
|---|---|---|
| Téléchargements actifs | 10 000 | M6 post-lancement |
| Note stores | ≥ 4,5/5 | M3 |
| Rétention J30 | ≥ 40% | M3 |
| Conversion freemium | ≥ 8% | M6 |
| Taux activation J7 | ≥ 3 sentiers consultés + 1 carte téléchargée | M1 |

---

## 🔗 Documents de référence

| Doc | Contenu | Chemin |
|---|---|---|
| PRD | Vision, user stories, exigences P0/P1/P2, modèle freemium | `docs/PRD_Randonner_Reunion.md` |
| Architecture | Stack, schéma BDD complet, APIs, cartes offline, sécurité | `docs/ARCHITECTURE_Randonner_Reunion.md` |
| Concurrence | AllTrails, Komoot, Visorando, Randopitons, Strava | `docs/ANALYSE_CONCURRENTIELLE.md` |
| Roadmap | Now/Next/Later avec critères de passage | `docs/ROADMAP.md` |
| Sprint Planning | 6 sprints, 38 jours, prompts Claude Code prêts | `docs/SPRINT_PLANNING.md` |

---

*Dernière mise à jour : 17 mars 2026 — Sprint 0 (cadrage)*
*Prochaine mise à jour prévue : fin Sprint 1*
