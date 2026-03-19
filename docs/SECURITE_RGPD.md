# Securite & RGPD — Randonnee Reunion
**Document de conformite | V1.1 | 18 mars 2026**

---

## 1. Donnees collectees

### Donnees personnelles
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Email | Oui | Authentification | Supabase Auth (EU) | Jusqu'a suppression compte |
| Mot de passe | Oui | Authentification | Hash bcrypt (Supabase) | Jusqu'a suppression compte |
| Username | Optionnel | Affichage profil | Supabase (EU) | Jusqu'a suppression compte |
| Google ID | Si OAuth | Authentification | Supabase Auth (EU) | Jusqu'a suppression compte |

### Donnees de profil
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Photo de profil (avatar) | Non | Affichage profil | Supabase Storage bucket `avatars` (EU) | Jusqu'a suppression compte |

### Donnees d'usage
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Sentiers valides | Non | Gamification | Supabase (EU) | Jusqu'a suppression compte |
| Traces GPS | Non | Navigation | Locale (device) | Geree par l'utilisateur |
| Signalements terrain | Non | Communaute | Supabase (EU) | 48h (expiration auto) |
| Photos de signalement | Non | Illustrer un signalement | Supabase (EU) | 48h (liee au signalement) |
| Messages chat (Sorties) | Non | Social | Supabase (EU) | Jusqu'a fin de sortie + 24h |
| Position GPS | Non | Navigation | Jamais stockee sur serveur | Temps reel uniquement |

### Donnees sociales
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Relations d'amitie | Non | Reseau social (demandes, acceptations) | Supabase (EU) | Jusqu'a suppression par l'utilisateur ou du compte |
| Posts (contenu texte, image_url, stats likes) | Non | Feed communautaire | Supabase (EU) table `posts` | Jusqu'a suppression par l'utilisateur ou du compte |
| Likes sur posts | Non | Interaction sociale | Supabase (EU) table `post_likes` | Jusqu'a suppression du like ou du compte |

### Donnees de sorties de groupe
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Sorties creees (sentier, date, heure, places, description) | Non | Organisation groupe | Supabase (EU) table `sorties` | Jusqu'a suppression par l'organisateur ou du compte |
| Participation aux sorties (statut : en_attente/accepte/refuse) | Non | Social | Supabase (EU) table `sortie_participants` | Jusqu'a retrait ou suppression du compte |
| Messages chat de sortie (contenu, horodatage) | Non | Coordination groupe | Supabase (EU) table `sortie_messages` | Jusqu'a fin de sortie |

### Contacts d'urgence
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Nom du contact d'urgence | Non | SOS — envoi SMS position GPS | Supabase (EU) | Jusqu'a suppression par l'utilisateur ou du compte |
| Telephone du contact d'urgence | Non | SOS — envoi SMS position GPS | Supabase (EU) | Jusqu'a suppression par l'utilisateur ou du compte |

### Donnees NON collectees
- Pas de tracking publicitaire
- Pas de vente de donnees a des tiers
- Pas de cookies (app mobile)
- Pas d'analytics pour l'instant (PostHog prevu avec opt-in)
- Pas de donnees de sante
- Pas de position live partagee (fonctionnalite non codee)
- Pas de cle API meteo stockee (Open-Meteo est gratuit et sans cle)

---

## 2. Securite technique

### Authentification
- **Supabase Auth** : JWT tokens, refresh automatique
- **Mots de passe** : hash bcrypt (gere par Supabase, jamais stocke en clair)
- **Session** : stockee dans SecureStore (iOS Keychain / Android Keystore)
- **OAuth Google** : flux OAuth 2.0 standard via Supabase

### Base de donnees
- **Row Level Security (RLS)** : chaque utilisateur ne peut voir/modifier que ses propres donnees
- **PostgreSQL** heberge par Supabase (serveurs EU)
- **Chiffrement en transit** : HTTPS/TLS obligatoire
- **Chiffrement au repos** : gere par Supabase (AES-256)

### API
- **Cle anon Supabase** : publique par design (les RLS protegent les donnees)
- **API meteo** : Open-Meteo, gratuit et sans cle (pas de secret a proteger)
- **Pas de cles sensibles** dans le code source

### GPS
- Position GPS traitee localement sur le device
- Jamais envoyee a un serveur sauf :
  - Signalement terrain (position du signalement, consentement explicite)
  - SMS SOS (envoi volontaire par l'utilisateur)
- Pas de tracking en arriere-plan par defaut

### Bouton SOS — Disclaimer
- **Popup disclaimer** affichee a la premiere utilisation du bouton SOS (SOSButton.tsx)
- L'utilisateur doit accepter que l'app ne garantit pas le secours et que le PGHM reste le seul responsable de l'intervention
- Le disclaimer n'est affiche qu'une seule fois (stockage local)

### Consentement CGU a l'inscription
- **Checkbox CGU obligatoire** dans RegisterScreen.tsx
- L'utilisateur doit cocher "J'accepte les CGU et la politique de confidentialite" avant de pouvoir creer un compte
- Liens cliquables vers les documents legaux (politique-confidentialite.html + cgu.html)

---

## 3. Conformite RGPD

### Droits des utilisateurs (Articles 15-22)

| Droit | Implementation | Statut |
|---|---|---|
| **Droit d'acces** (Art. 15) | Page "Mes donnees" dans Settings | A coder |
| **Droit de rectification** (Art. 16) | Modifier profil dans Settings | Code |
| **Droit a l'effacement** (Art. 17) | Bouton "Supprimer mon compte" dans Settings > Zone dangereuse | Code (18/03/2026) |
| **Droit a la portabilite** (Art. 20) | Export JSON via useAccountActions hook | Code (18/03/2026) |
| **Droit d'opposition** (Art. 21) | Desactiver le tracking GPS | Code (permission native) |
| **Droit de retrait du consentement** | Se deconnecter / supprimer compte | Code (18/03/2026) |

### Base legale du traitement
- **Execution du contrat** (Art. 6.1.b) : les donnees sont necessaires au fonctionnement de l'app (auth, sentiers valides, sorties, profil utilisateur)
- **Consentement** (Art. 6.1.a) : GPS, signalements terrain, photo de profil, publications sociales (posts, likes), contacts d'urgence, analytics (opt-in)
- **Interet legitime** (Art. 6.1.f) : securite, prevention des abus

### Responsable du traitement
- Nicolas [Nom de famille]
- Contact : contact@randonnee-reunion.re
- Hebergeur des donnees : Supabase Inc. (serveurs EU - aws-eu-west-1)

---

## 4. Politique de confidentialite (pour les stores)

### Version courte (affichee dans l'app)

Randonnee Reunion collecte uniquement les donnees necessaires a ton experience de randonnee : email pour la connexion, sentiers valides pour la gamification, position GPS uniquement pendant la navigation (jamais stockee sur nos serveurs), photo de profil, posts et interactions sociales (amis, likes). Tu peux supprimer ton compte et toutes tes donnees a tout moment depuis les parametres. Aucune donnee n'est vendue a des tiers.

### Version complete (URL requise pour les stores)

**REDIGE** — Fichiers prets a heberger :
- Politique de confidentialite : `private/legal/politique-confidentialite.html` → `randonnee-reunion.re/confidentialite`
- CGU : `private/legal/cgu.html` → `randonnee-reunion.re/cgu`

Les deux documents couvrent : RGPD complet (Art. 6, 15-22), sous-traitants, transferts hors UE, mineurs, SOS, limitation de responsabilite, droit francais (tribunal Saint-Denis).

---

## 5. Actions a implementer

### Priorite haute (avant deploiement stores)
1. ~~Bouton "Supprimer mon compte" dans Settings~~ — **FAIT** (18/03/2026)
2. ~~Export des donnees personnelles (JSON)~~ — **FAIT** (18/03/2026)
3. ~~Page "Politique de confidentialite" accessible dans l'app~~ — **FAIT** (lien dans Settings)
4. ~~Consentement GPS explicite~~ — **FAIT** (permissions natives)
5. ~~Disclaimer SOS (popup premiere utilisation)~~ — **FAIT** (17/03/2026)
6. ~~Checkbox CGU obligatoire a l'inscription~~ — **FAIT** (17/03/2026)
7. ~~Documents legaux rediges (politique confidentialite + CGU)~~ — **FAIT** (17/03/2026)
8. ~~Migrer la cle meteo hors du bundle JS~~ — **N/A** (Open-Meteo est gratuit et sans cle)

### Priorite moyenne (avant scale)
6. Opt-in analytics (PostHog) — A FAIRE
7. Page "Mes donnees" (visualiser ce qu'on stocke) — A FAIRE
8. Notification en cas de breach (Art. 33/34) — A FAIRE
9. Registre des traitements (Art. 30) — A FAIRE
10. DPO designe si > 10 000 utilisateurs — A FAIRE

---

*Document cree le 18 mars 2026 — Mis a jour le 18 mars 2026 (V1.1 : ajout donnees sorties de groupe, precision tables posts/post_likes, API meteo corrigee Open-Meteo sans cle, position live non collectee)*
