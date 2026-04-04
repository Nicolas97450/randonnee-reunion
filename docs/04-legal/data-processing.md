# DATA SAFETY — Google Play & Apple App Store
> A remplir lors de la soumission sur les stores.
> Basee sur le code et la politique de confidentialite au 20 mars 2026.

---

## Google Play — Data Safety Section

### Donnees collectees

| Categorie | Type | Collecte | Partage | Obligatoire |
|---|---|---|---|---|
| Localisation | Position approx. | Oui | Non | Non (opt-in GPS) |
| Localisation | Position precise | Oui | Non | Non (opt-in GPS) |
| Informations personnelles | Email | Oui | Non | Oui (auth) |
| Informations personnelles | Nom/pseudo | Oui | Non | Oui (profil) |
| Photos/Videos | Photo de profil | Oui | Non | Non |
| Photos/Videos | Photos sentiers | Oui | Non | Non |
| Messages | Messages prives (DM) | Oui | Non | Non |
| Messages | Chat de groupe (sorties) | Oui | Non | Non |
| Activite dans l'app | Interactions (likes, amis) | Oui | Non | Non |
| Activite dans l'app | Historique randonnees | Oui | Non | Non |

### Pratiques de securite
- [x] Les donnees sont chiffrees en transit (HTTPS/TLS)
- [x] Les donnees sont chiffrees au repos (AES-256 via Supabase)
- [x] Les utilisateurs peuvent demander la suppression de leurs donnees
- [x] Les donnees ne sont pas partagees avec des tiers
- [x] Les donnees ne sont pas utilisees pour la publicite

### Suppression de donnees
- Mecanisme : bouton "Supprimer mon compte" dans Parametres
- Delai : immediat (cascade sur toutes les tables)
- Auth : desactive et supprime sous 30 jours

---

## Apple App Store — App Privacy Report

### Types de donnees collectees

| Categorie | Sous-type | Usage | Lie a l'identite |
|---|---|---|---|
| Location | Precise Location | App Functionality | Oui |
| Contact Info | Email Address | App Functionality | Oui |
| User Content | Photos or Videos | App Functionality | Oui |
| User Content | Other User Content (posts, messages) | App Functionality | Oui |
| Identifiers | User ID | App Functionality | Oui |
| Usage Data | Product Interaction | App Functionality | Non |

### Donnees NON collectees
- Health & Fitness
- Financial Info
- Sensitive Info
- Browsing History
- Search History
- Diagnostics (prevu avec Sentry — opt-in)
- Advertising Data

### Donnees NON utilisees pour le tracking
Aucune donnee n'est utilisee pour tracker l'utilisateur entre apps ou sites.

---

## Notes pour la soumission

### Justification des permissions
| Permission | Justification (texte store) |
|---|---|
| Location (Always) | Permet le suivi GPS en arriere-plan pour enregistrer votre trace complete de randonnee |
| Location (When In Use) | Affiche votre position sur la carte des sentiers de La Reunion |
| Camera/Photos | Permet d'ajouter une photo de profil et des photos de sentiers |
| Notifications | Recevez des alertes pour les demandes d'amis, messages et invitations de sorties |

### Screenshots requis
- [ ] 6.7" (iPhone 15 Pro Max)
- [ ] 6.5" (iPhone 14 Plus)
- [ ] 5.5" (iPhone 8 Plus)
- [ ] iPad Pro 12.9"
- [ ] Android phone
- [ ] Android tablet (optionnel)
