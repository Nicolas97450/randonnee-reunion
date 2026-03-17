# Securite & RGPD — Randonnee Reunion
**Document de conformite | V1.0 | 18 mars 2026**

---

## 1. Donnees collectees

### Donnees personnelles
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Email | Oui | Authentification | Supabase Auth (EU) | Jusqu'a suppression compte |
| Mot de passe | Oui | Authentification | Hash bcrypt (Supabase) | Jusqu'a suppression compte |
| Username | Optionnel | Affichage profil | Supabase (EU) | Jusqu'a suppression compte |
| Google ID | Si OAuth | Authentification | Supabase Auth (EU) | Jusqu'a suppression compte |

### Donnees d'usage
| Donnee | Obligatoire | Usage | Stockage | Duree |
|---|---|---|---|---|
| Sentiers valides | Non | Gamification | Supabase (EU) | Jusqu'a suppression compte |
| Traces GPS | Non | Navigation | Locale (device) | Geree par l'utilisateur |
| Signalements terrain | Non | Communaute | Supabase (EU) | 48h (expiration auto) |
| Messages chat (Sorties) | Non | Social | Supabase (EU) | Jusqu'a fin de sortie + 24h |
| Position GPS | Non | Navigation | Jamais stockee sur serveur | Temps reel uniquement |

### Donnees NON collectees
- Pas de tracking publicitaire
- Pas de vente de donnees a des tiers
- Pas de cookies (app mobile)
- Pas d'analytics pour l'instant (PostHog prevu avec opt-in)
- Pas de donnees de sante

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
- **Cle meteo** : a migrer vers un proxy serveur (actuellement dans le bundle JS)
- **Pas de cles sensibles** dans le code source

### GPS
- Position GPS traitee localement sur le device
- Jamais envoyee a un serveur sauf :
  - Signalement terrain (position du signalement, consentement explicite)
  - SMS SOS (envoi volontaire par l'utilisateur)
- Pas de tracking en arriere-plan par defaut

---

## 3. Conformite RGPD

### Droits des utilisateurs (Articles 15-22)

| Droit | Implementation | Statut |
|---|---|---|
| **Droit d'acces** (Art. 15) | Page "Mes donnees" dans Settings | A coder |
| **Droit de rectification** (Art. 16) | Modifier profil dans Settings | Code |
| **Droit a l'effacement** (Art. 17) | Bouton "Supprimer mon compte" | A coder |
| **Droit a la portabilite** (Art. 20) | Export JSON de toutes ses donnees | A coder |
| **Droit d'opposition** (Art. 21) | Desactiver le tracking GPS | Code (permission native) |
| **Droit de retrait du consentement** | Se deconnecter / supprimer compte | A coder |

### Base legale du traitement
- **Execution du contrat** (Art. 6.1.b) : les donnees sont necessaires au fonctionnement de l'app (auth, sentiers valides, sorties)
- **Consentement** (Art. 6.1.a) : GPS, signalements terrain, analytics (opt-in)
- **Interet legitime** (Art. 6.1.f) : securite, prevention des abus

### Responsable du traitement
- Nicolas [Nom de famille]
- Contact : [email a definir]
- Hebergeur des donnees : Supabase Inc. (serveurs EU - aws-eu-west-1)

---

## 4. Politique de confidentialite (pour les stores)

### Version courte (affichee dans l'app)

Randonnee Reunion collecte uniquement les donnees necessaires a ton experience de randonnee : email pour la connexion, sentiers valides pour la gamification, et position GPS uniquement pendant la navigation (jamais stockee sur nos serveurs). Tu peux supprimer ton compte et toutes tes donnees a tout moment depuis les parametres. Aucune donnee n'est vendue a des tiers.

### Version complete (URL requise pour les stores)

[A heberger sur randonnee-reunion.re/confidentialite]

---

## 5. Actions a implementer

### Priorite haute (avant deploiement stores)
1. Bouton "Supprimer mon compte" dans Settings
2. Export des donnees personnelles (JSON)
3. Page "Politique de confidentialite" accessible dans l'app
4. Consentement GPS explicite (deja gere par les permissions natives)
5. Migrer la cle meteo hors du bundle JS

### Priorite moyenne (avant scale)
6. Opt-in analytics (PostHog)
7. Page "Mes donnees" (visualiser ce qu'on stocke)
8. Notification en cas de breach (Art. 33/34)
9. Registre des traitements (Art. 30)
10. DPO designé si > 10 000 utilisateurs

---

*Document cree le 18 mars 2026*
