# Business Plan — Randonnee Reunion
**Document strategique | V1.0 | 17 mars 2026**

---

## 1. Resume executif

Randonnee Reunion est une application mobile (iOS/Android) qui cible un marche de niche a fort potentiel : **les 800 000+ randonnees realisees chaque annee a La Reunion** (source : IRT/ONF). L'app monetise via un modele freemium (cartes offline) dans un marche ou aucun acteur local ne propose une experience moderne, et ou les acteurs globaux (AllTrails, Komoot) ne couvrent pas le territoire.

**Objectif a 12 mois** : 10 000 utilisateurs actifs, 800 abonnes premium, 25 000 EUR d'ARR.

---

## 2. Marche cible

### Taille du marche

| Segment | Volume | Source |
|---|---|---|
| Randonnees/an a La Reunion | 800 000+ | IRT, ONF |
| Touristes/an a La Reunion | 530 000 | IRT 2024 |
| Dont randonneurs (estimee 40%) | ~210 000 | Estimation |
| Population locale pratiquant la rando | ~80 000 | DRJSCS |
| Smartphones 16+ a La Reunion | ~650 000 | INSEE/ARCEP |

### TAM / SAM / SOM

| Metrique | Calcul | Valeur |
|---|---|---|
| **TAM** (Total Addressable Market) | 290 000 randonneurs x 20 EUR/an moyen | **5.8M EUR/an** |
| **SAM** (Serviceable) | 150 000 avec smartphone + interet app | **3.0M EUR/an** |
| **SOM** (Obtainable a M12) | 800 premium x 30 EUR/an | **24 000 EUR/an** |
| **SOM** (Obtainable a M24) | 3 000 premium x 30 EUR/an | **90 000 EUR/an** |

### Segments utilisateurs

| Segment | % du marche | Comportement | Valeur |
|---|---|---|---|
| **Reunionnais passionnes** | 30% | Rando hebdo, connait les sentiers, veut progresser | Haute (gamification) |
| **Reunionnais occasionnels** | 25% | 1-2 randos/mois, cherche inspiration | Moyenne (decouverte) |
| **Touristes FR metropolitaine** | 30% | 2 semaines, 4-6 randos, besoin de guidage | Haute (offline + meteo) |
| **Touristes internationaux** | 15% | Meme profil touriste, besoin anglais (V2) | Haute (offline) |

---

## 3. Modele economique

### 3.1 Freemium — Le coeur du modele

| Feature | Gratuit | Premium |
|---|---|---|
| Fiches 20+ sentiers | Illimite | Illimite |
| Carte interactive | Oui | Oui |
| GPS temps reel | Oui | Oui |
| Meteo + etat OMF | Oui | Oui |
| Gamification (carte ile) | Oui | Oui |
| **Cartes offline** | **3 max** | **Illimite** |
| Creer une Sortie | 1 active | Illimite |
| Stats avancees | Non | Oui |
| Export GPX | Non | Oui |
| Historique complet | 10 dernieres | Illimite |

**Prix** : 2.99 EUR/mois ou 19.99 EUR/an (economie 44%)

### 3.2 Pourquoi ce prix fonctionne

- **AllTrails Plus** : 35.99 USD/an — on est 44% moins cher
- **Visorando Premium** : 25 EUR/an — on est 20% moins cher
- **Komoot Monde** : 29.99 EUR (achat unique) — modele different
- **Randopitons** : Gratuit — mais UX obsolete, pas de gamification

Le prix de 19.99 EUR/an est le **sweet spot** :
- Assez bas pour ne pas etre un frein (< 2 EUR/mois)
- Assez haut pour generer du revenu a echelle
- Aligne avec le pouvoir d'achat local (La Reunion est plus sensible au prix que la metropole)

### 3.3 Pourquoi la limite offline est le bon levier

1. **La Reunion = 0 reseau dans les cirques** → les cartes offline sont critiques
2. **3 sentiers gratuits** = assez pour tester, pas assez pour un randonneur regulier
3. Les features de securite (meteo, OMF) restent **gratuites** → pas de friction ethique
4. Le randonneur qui a teste 3 sentiers offline est deja engage → conversion naturelle

### 3.4 Projections financieres

| Mois | Utilisateurs actifs | Premium (8% conv.) | MRR | ARR |
|---|---|---|---|---|
| M3 | 2 000 | 160 | 360 EUR | 4 300 EUR |
| M6 | 5 000 | 400 | 900 EUR | 10 800 EUR |
| M12 | 10 000 | 800 | 1 800 EUR | 21 600 EUR |
| M18 | 15 000 | 1 500 | 3 375 EUR | 40 500 EUR |
| M24 | 20 000 | 3 000 | 6 750 EUR | 81 000 EUR |

*Hypotheses : ARPU 2.25 EUR/mois (mix mensuel/annuel), churn 5%/mois, conversion 8%*

**Seuil de rentabilite** : ~200 EUR/mois de couts fixes → atteint des M3.

### 3.5 Sources de revenus complementaires (V2+)

| Source | Timing | Potentiel |
|---|---|---|
| **Partenariats locaux** (gites, guides, transports) | M6+ | Commission affiliation 5-10% |
| **Contenus premium** (topos detailles, audioguides) | M12+ | 4.99 EUR/topo |
| **API B2B** (offices de tourisme, hotels) | M12+ | Licence annuelle |
| **Sponsoring events** (trail, ultra-trail Grand Raid) | M6+ | Forfait evenement |

---

## 4. Avantage concurrentiel durable (moats)

### Moat #1 — Donnees locales exclusives
L'integration OMF (etat des sentiers) et meteo micro-locale est un avantage de premier entrant. Si on signe un partenariat officiel avec l'OMF, ca devient un **moat contractuel**.

### Moat #2 — Gamification territoriale
La carte qui se colorie cree un **investissement emotionnel** (sunk cost). Plus l'utilisateur a colorie, moins il veut quitter l'app. Effet compound sur la retention.

### Moat #3 — Effets de reseau (Sorties)
La feature Sorties cree un **effet de reseau local** : plus il y a de randonneurs, plus il y a de sorties, plus l'app est utile. Difficile a repliquer pour un acteur global.

### Moat #4 — Connaissance terrain
Construire une app de rando pour La Reunion depuis La Reunion donne un avantage culturel et operationnel qu'AllTrails ou Komoot n'ont pas (langue creole, micro-meteo, connaissance des sentiers, reseau local).

---

## 5. Couts et investissements

### Couts de lancement (one-time)

| Poste | Cout | Obligatoire |
|---|---|---|
| Apple Developer Program | 99 USD (~90 EUR)/an | Oui (iOS) |
| Google Play Developer | 25 USD (~23 EUR) une fois | Oui (Android) |
| Nom de domaine (randonnee-reunion.re) | ~12 EUR/an | Oui (URL politique confidentialite + CGU requise par les stores) |
| **Total lancement** | **~125 EUR** | |

### Couts mensuels (MVP, < 5000 users)

| Poste | Cout/mois |
|---|---|
| Supabase (free tier) | 0 EUR |
| MapLibre (open-source, gratuit) | 0 EUR |
| CDN tuiles (Cloudflare R2) | < 1 EUR |
| API meteo-concept (500 appels/jour gratuits) | 0 EUR |
| Expo/EAS (free tier, 30 builds/mois) | 0 EUR |
| Nom de domaine (annualise) | ~1 EUR |
| **Total mensuel** | **~1-2 EUR** |

### Couts mensuels (scale, 5000-20000 users)

| Poste | Cout/mois |
|---|---|
| Supabase Pro | 25 USD |
| CDN tuiles | 5 USD |
| RevenueCat | 0 (< 2500 USD MRR) |
| Expo/EAS Pro | 0-99 USD |
| **Total mensuel** | **~50-130 USD** |

### Marge brute estimee

A M12 (800 premium, 1800 EUR MRR) :
- Revenus : 1 800 EUR
- Couts infra : ~100 EUR
- Commission stores (30%) : ~540 EUR
- **Marge brute : ~1 160 EUR/mois (64%)**

---

## 6. Risques et mitigations

| Risque | Probabilite | Impact | Mitigation |
|---|---|---|---|
| AllTrails investit La Reunion | Moyenne | Fort | Etre premier, signer partenariat OMF |
| Randopitons se modernise | Faible | Fort | Avancer vite sur gamification + social |
| Scraping OMF bloque juridiquement | Moyenne | Moyen | Negocier partenariat officiel en parallele |
| Faible conversion freemium | Moyenne | Moyen | A/B test paywall, ajuster prix |
| Pas assez de sentiers au lancement | Faible | Moyen | 20 sentiers pilotes + ajout progressif |
| App Store rejection | Faible | Faible | Suivre guidelines, pas de contenu sensible |

---

## 7. Equipe et ressources

| Role | Qui | Engagement |
|---|---|---|
| Fondateur / Product | Nicolas | Temps partiel (evenings + weekends) |
| Developpement | Claude Code (IA) | A la demande |
| Design | A recruter ou IA (Midjourney/Figma AI) | Ponctuel |
| Marketing | Nicolas + communaute | Organique au debut |

**Pas besoin de lever des fonds au depart.** Les couts sont quasi nuls, le dev est fait par IA, et le revenu premium arrive tot. Si le product-market fit est confirme (> 5000 users a M6), envisager un micro-financement (BPI, French Tech Reunion) pour accelerer.

---

*Document cree le 17 mars 2026*
