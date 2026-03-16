# Plan de Lancement — Randonnee Reunion
**Go-to-Market Strategy | V1.0 | 17 mars 2026**

---

## 1. Calendrier de lancement

```
MARS 2026          AVRIL 2026         MAI 2026           JUIN 2026
Sem 3  Sem 4       Sem 1  Sem 2       Sem 1  Sem 2       Sem 1  Sem 2
├──────┼──────┤    ├──────┼──────┤    ├──────┼──────┤    ├──────┼──────┤
[DEV DONE]         [ALPHA]             [BETA FERMEE]      [LANCEMENT]
Code   Tests       Fix    Preview      10-50 testeurs     Stores live
Build  Bugs        APK    Recrutement  Corrections        Marketing
                                       Partenariats       PR
```

---

## 2. Phase ALPHA — Semaines 4-5 (fin mars / debut avril)

### Objectif : app stable, bugs critiques corriges

| Tache | Responsable | Critere de succes |
|---|---|---|
| Tester APK dev sur Android | Nicolas | App se lance, navigation fonctionne |
| Lister tous les bugs | Nicolas | Liste exhaustive |
| Corriger bugs critiques | Claude Code | 0 crash, 0 ecran blanc |
| Deployer Edge Functions Supabase | Nicolas + Claude | Meteo + OMF fonctionnels |
| Executer migration Sorties SQL | Nicolas | Chat fonctionne |
| Verifier auth (inscription/connexion) | Nicolas | Flow complet OK |
| Verifier GPS sur device reel | Nicolas | Position affichee sur carte |
| Build preview APK (sans debug) | Nicolas | APK propre, partageable |

### Definition of Done Alpha :
- [ ] L'app se lance sans crash
- [ ] On peut s'inscrire, se connecter, se deconnecter
- [ ] La liste des 20 sentiers s'affiche
- [ ] La carte affiche les markers
- [ ] Le GPS fonctionne sur le terrain
- [ ] L'onboarding s'affiche au premier lancement

---

## 3. Phase BETA FERMEE — Semaines 6-8 (mai 2026)

### Objectif : valider le produit avec de vrais randonneurs

### 3.1 Recrutement des beta testeurs

**Cible : 10-50 testeurs** repartis ainsi :

| Profil | Nombre | Ou les trouver |
|---|---|---|
| Reunionnais randonneurs reguliers | 5-10 | Amis, famille, clubs rando |
| Reunionnais occasionnels | 5-10 | Reseaux sociaux locaux |
| Touristes prevoyant un voyage | 3-5 | Groupes Facebook "Voyage Reunion" |
| Membres clubs de rando | 5-10 | FFRP Reunion, clubs locaux |
| Guides de montagne | 2-3 | Reseau OMF/ONF |

### 3.2 Comment recruter

1. **Message type a poster** (groupes Facebook, forums) :

> Je developpe une app de randonnee 100% dediee a La Reunion (cartes offline, GPS, meteo, etat OMF, gamification). Je cherche 20 beta testeurs pour la tester avant le lancement. Gratuit + premium offert 1 an. Interesse ? MP ou commentaire.

2. **Groupes cibles** :
   - Facebook : "Randonnee ile de la Reunion", "Les randonneurs de la Reunion 974"
   - Forum : Randopitons.re (forum communautaire)
   - Instagram : hashtags #randonnee974 #reunion #mafate
   - Clubs : FFRP section Reunion, Club Multisports du Port

3. **Incentive beta testeurs** :
   - Premium gratuit 1 an
   - Nom dans les credits de l'app
   - Badge "Beta Testeur" sur le profil (gamification)

### 3.3 Collecte de feedback

| Canal | Usage |
|---|---|
| Formulaire Google Forms | Feedback structure apres chaque sortie |
| Groupe WhatsApp beta | Feedback spontane, screenshots bugs |
| Analytics PostHog | Comportement reel (ecrans visites, actions) |
| Entretien 1:1 (5 min) | 3-5 testeurs cles, insights qualitatifs |

### 3.4 Questions cles a valider en beta

| Question | Metrique de validation |
|---|---|
| L'app est-elle utile sur le terrain ? | > 80% utilisent l'app en rando |
| La gamification motive-t-elle ? | > 50% valident 2+ sentiers |
| Le prix premium est-il acceptable ? | > 60% disent "oui" au survey |
| L'offline fonctionne-t-il dans les cirques ? | 0 rapport de dysfonctionnement GPS/carte |
| Les touristes comprennent-ils l'app ? | Taux completion onboarding > 90% |

### Definition of Done Beta :
- [ ] 20+ testeurs ont utilise l'app en conditions reelles
- [ ] 0 bug critique remonte
- [ ] Note satisfaction > 4/5 (survey)
- [ ] La gamification est comprise et appreciee
- [ ] Les cartes offline fonctionnent a Mafate (0 reseau)

---

## 4. Phase LANCEMENT — Semaines 9-10 (juin 2026)

### 4.1 Pre-lancement (J-14 a J-1)

| Tache | Timing | Detail |
|---|---|---|
| Screenshots stores | J-14 | 6 screenshots iPhone + 3 Android, beaux sentiers |
| Video preview (optionnel) | J-14 | 30s de l'app en action sur un sentier |
| Description ASO finale | J-14 | Keywords : randonnee reunion, sentier, GPS, offline, mafate |
| Soumission App Store | J-10 | Review Apple prend 1-3 jours |
| Soumission Play Store | J-10 | Review Google prend 1-2 jours |
| Page Instagram @randonnee.reunion | J-7 | 9 posts pre-lancement (sentiers, teasing features) |
| Teasing beta testeurs | J-7 | "L'app sort dans 1 semaine, partagez !" |
| Communique de presse local | J-3 | Envoyer a Clicanoo, Zinfos974, Imaz Press |
| Post LinkedIn Nicolas | J-1 | Story perso "J'ai code une app pour mon ile" |

### 4.2 Jour J — Lancement

| Action | Timing | Canal |
|---|---|---|
| App live sur les stores | J | App Store + Play Store |
| Post Instagram lancement | J | @randonnee.reunion |
| Post Facebook groupes rando | J | 5-10 groupes identifies |
| Message beta testeurs | J | WhatsApp : "C'est live ! Laissez un avis 5 etoiles" |
| Post Clicanoo / Zinfos974 | J | Article presse locale |
| Email beta testeurs | J | Lien store + demande avis |

### 4.3 Post-lancement (J+1 a J+30)

| Action | Frequence | Objectif |
|---|---|---|
| Repondre a TOUS les avis stores | Quotidien | Engagement, note > 4.5 |
| Post Instagram (sentier du jour) | 3x/semaine | Acquisition organique |
| Fix bugs remontes | Continue | Stabilite |
| Monitor analytics PostHog | Hebdo | Comprendre les comportements |
| Outreach clubs de rando | Semaines 2-3 | Distribution B2B2C |
| Contact offices de tourisme | Semaines 3-4 | Partenariats distribution |

---

## 5. Strategie d'acquisition utilisateurs

### 5.1 Canaux organiques (gratuits) — Phase 1

| Canal | Action | Cout | Impact attendu |
|---|---|---|---|
| **ASO** (App Store Optimization) | Keywords "randonnee reunion", "sentier mafate", "carte offline rando" | 0 EUR | 30-40% des downloads |
| **Groupes Facebook** | Posts reguliers dans 10+ groupes rando Reunion | 0 EUR | 20-30% des downloads |
| **Instagram** | @randonnee.reunion, 3 posts/semaine, Reels sentiers | 0 EUR | 10-15% des downloads |
| **Bouche a oreille** | Beta testeurs + feature Sorties (viral loop) | 0 EUR | 15-20% des downloads |
| **Presse locale** | Clicanoo, Zinfos974, JIR, Imaz Press | 0 EUR | Spike au lancement |

### 5.2 Viral loops integres au produit

| Mecanisme | Comment ca marche |
|---|---|
| **Carte colorisee partageable** | Bouton "Partager ma progression" → image de la carte colorisee avec texte "J'ai explore X% de La Reunion" → Instagram/WhatsApp |
| **Feature Sorties** | Creer une sortie = inviter des amis = chaque ami installe l'app |
| **Integration Strava (V2)** | Chaque rando validee peut etre partagee sur Strava → visibilite aupres des contacts sportifs |
| **Challenge communautaire** | "Defi : colorie Mafate en 1 mois" → partage du challenge |

### 5.3 Canaux payants (si budget) — Phase 2 (M3+)

| Canal | Budget/mois | CPA cible | ROI attendu |
|---|---|---|---|
| Facebook/Instagram Ads (geo-cible 974) | 100-300 EUR | < 1 EUR | Payant si conv > 5% |
| Google Ads (keywords "rando reunion") | 50-150 EUR | < 0.80 EUR | Tres cible |
| Partenariat influenceurs locaux | 50-200 EUR | Variable | Authentique si bien choisi |

**Regle** : ne pas depenser en acquisition tant que la retention J30 n'est pas > 35%. Sinon on brule de l'argent.

---

## 6. Strategie partenariats

### 6.1 Partenariats prioritaires

| Partenaire | Valeur pour nous | Valeur pour eux | Action |
|---|---|---|---|
| **OMF** (Office Montagne et Forets) | Donnees officielles etat sentiers, legitimite | Visibilite digitale, retour terrain | Proposer une convention data |
| **IRT** (Ile Reunion Tourisme) | Distribution (offices, hotels, brochures) | App a recommander aux touristes | Demo + proposition co-branding |
| **ONF** (Office National des Forets) | Donnees sentiers, signalisation | Remontee terrain digitale | Reunion de presentation |
| **Clubs FFRP Reunion** | Communaute captive, beta testeurs | Outil pour leurs membres | Offre groupe premium |

### 6.2 Partenariats secondaires (M6+)

| Partenaire | Modele |
|---|---|
| Gites de montagne (Mafate, Cilaos) | Recommandation in-app, commission reservation |
| Guides de montagne agreees | Profil guide dans l'app, reservation |
| Magasins sport (Decathlon, Go Sport 974) | Flyers en magasin, QR code |
| Compagnies aeriennes (Air Austral, French Bee) | Recommandation dans le magazine de bord |
| Grand Raid de La Reunion | Partenaire digital de l'evenement |

---

## 7. KPIs de lancement

### Semaine 1

| KPI | Objectif |
|---|---|
| Downloads | > 500 |
| Inscriptions | > 300 (60% des downloads) |
| Sentiers consultes | > 1 000 |
| Note stores | > 4.5 |
| Crashes | 0 |

### Mois 1

| KPI | Objectif |
|---|---|
| Downloads cumules | > 2 000 |
| Utilisateurs actifs (MAU) | > 1 000 |
| Retention J7 | > 50% |
| Retention J30 | > 35% |
| Cartes offline telecharges | > 500 |
| Sentiers valides (gamification) | > 200 |
| Conversions premium | > 50 |

### Mois 3

| KPI | Objectif |
|---|---|
| MAU | > 3 000 |
| Premium actifs | > 200 |
| MRR | > 500 EUR |
| Note stores | > 4.3 |
| Sorties creees | > 50 |

---

## 8. Budget lancement total

| Poste | Montant | Timing |
|---|---|---|
| Apple Developer | 90 EUR | Avant soumission |
| Google Play | 23 EUR | Avant soumission |
| Domaine randonnee-reunion.re | 12 EUR | Pre-lancement |
| Marketing payant (optionnel) | 0-300 EUR | M1-M3 |
| **Total minimum** | **125 EUR** | |
| **Total avec marketing** | **~425 EUR** | |

---

## 9. Timeline recapitulative

| Date | Milestone |
|---|---|
| 17 mars 2026 | Code termine (6 sprints) |
| 20-25 mars | Alpha : tests + corrections bugs |
| 1-15 avril | Beta fermee : 10-50 testeurs terrain |
| 15-30 avril | Corrections beta + screenshots stores |
| 1 mai | Soumission App Store + Play Store |
| 7-15 mai | Review stores + ajustements |
| **15 mai 2026** | **Lancement public** |
| 15 mai - 15 juin | Post-lancement : acquisition, partenariats |
| Juillet 2026 | Analyse M1, decisions V1.1 |
| Septembre 2026 | V1.1 : 100+ sentiers, Strava, badges |

---

## 10. Definition du succes a M6

L'app est un succes si a M6 post-lancement :

- [ ] 5 000+ utilisateurs actifs mensuels
- [ ] 400+ abonnes premium
- [ ] 10 000+ EUR d'ARR
- [ ] Note stores >= 4.3/5
- [ ] 1 partenariat institutionnel signe (OMF ou IRT)
- [ ] Retention J30 >= 35%
- [ ] La gamification est citee dans les avis comme differenciateur

Si ces objectifs sont atteints, envisager :
- Micro-financement BPI/French Tech pour accelerer
- Recrutement d'un community manager mi-temps
- Expansion du catalogue a 200+ sentiers
- Version anglaise pour les touristes internationaux

---

*Document cree le 17 mars 2026 — Nicolas, Fondateur Randonnee Reunion*
