# Pre-Deploiement Stores — Checklist
**Document operationnel | Tout ce qu'il faut faire AVANT de soumettre aux stores**
**Derniere mise a jour : 17 mars 2026**

---

## Statut global

| Etape | Statut | Bloquant ? |
|---|---|---|
| Code V2 complet | FAIT | - |
| Build preview (f174732b) | FAIT | - |
| Migration 003 executee | FAIT | - |
| Test APK sur device reel | A FAIRE | Oui |
| Corrections bugs | A FAIRE | Oui |
| Nom de domaine | A FAIRE | Oui |
| Email de contact | A FAIRE | Oui |
| Heberger politique de confidentialite | A FAIRE | Oui |
| Heberger CGU | A FAIRE | Oui |
| Branding (logo, icone) | A FAIRE | Oui |
| Compte Google Play | A FAIRE | Oui |
| Compte Apple Developer | A FAIRE | Oui (si iOS) |
| RevenueCat configure | A FAIRE | Non (beta mode) |
| Build production | A FAIRE | Oui |
| Soumission stores | A FAIRE | - |

---

## 1. Nom de domaine

### Pourquoi c'est obligatoire
Les stores (Apple + Google) **exigent** une URL publique pour :
- La politique de confidentialite
- Les conditions generales d'utilisation

Sans ca, l'app est **rejetee** a la soumission.

### Ce qu'il faut faire
1. **Acheter le domaine** `randonnee-reunion.re` (~12 EUR/an)
   - Alternatives si pris : `randonnee-reunion.fr`, `rando-reunion.re`
   - Registrar recommande : OVH, LWS, ou un registrar local .re
2. **Configurer le DNS** pour pointer vers l'hebergement (voir section 3)

### Impact dans le code
Le domaine est utilise dans `app/src/screens/SettingsScreen.tsx` :
- `https://randonnee-reunion.re/confidentialite` (ligne 89)
- `https://randonnee-reunion.re/cgu` (ligne 100)

**Si le domaine final est different**, mettre a jour ces 2 URLs dans SettingsScreen.tsx et refaire un build.

---

## 2. Email de contact

### Pourquoi c'est obligatoire
- Requis dans la politique de confidentialite (RGPD)
- Requis par les stores (email de support)
- Requis pour les demandes d'exercice de droits RGPD

### Ce qu'il faut faire
1. **Creer une adresse email** sur le domaine : `contact@randonnee-reunion.re`
   - Alternative temporaire : une adresse Gmail dediee (ex: `randonnee.reunion.app@gmail.com`)
2. **Mettre a jour** l'email dans :
   - `private/legal/politique-confidentialite.html` (remplacer `contact@randonnee-reunion.re` si different)
   - `private/legal/cgu.html` (idem)
   - Formulaire de soumission App Store (Support URL + email)
   - Formulaire de soumission Google Play (Developer email)

### Email actuel dans les documents legaux
```
contact@randonnee-reunion.re
```
A changer si le domaine ou l'email final est different.

---

## 3. Heberger les pages legales

### Fichiers prets
| Page | Fichier source | URL finale |
|---|---|---|
| Politique de confidentialite | `private/legal/politique-confidentialite.html` | `randonnee-reunion.re/confidentialite` |
| CGU | `private/legal/cgu.html` | `randonnee-reunion.re/cgu` |

### Options d'hebergement (du plus simple au plus complet)

**Option A — GitHub Pages (gratuit, recommande MVP)**
1. Creer un repo `Nicolas97450/randonnee-reunion-legal` (ou utiliser le repo existant)
2. Activer GitHub Pages (Settings → Pages → Source: main branch)
3. Y mettre les 2 fichiers HTML
4. Configurer le domaine custom `randonnee-reunion.re` dans GitHub Pages
5. Ajouter un CNAME dans le DNS du domaine

**Option B — Hebergement simple (OVH, LWS)**
1. Acheter un hebergement web basique (~2 EUR/mois)
2. Uploader les 2 fichiers HTML
3. Configurer le domaine

**Option C — Netlify / Vercel (gratuit)**
1. Connecter le repo GitHub
2. Deployer les fichiers HTML
3. Configurer le domaine custom

### Verification
Avant de soumettre aux stores, verifier que ces URLs repondent :
- `https://randonnee-reunion.re/confidentialite` → page politique OK
- `https://randonnee-reunion.re/cgu` → page CGU OK

---

## 4. Comptes stores

### Google Play (Android)
1. Aller sur https://play.google.com/console
2. Creer un compte developpeur (25 USD, une fois)
3. **Attention** : la verification d'identite peut prendre **48h**
4. Informations requises :
   - Nom du developpeur : Nicolas
   - Email de contact : `contact@randonnee-reunion.re`
   - URL politique de confidentialite : `https://randonnee-reunion.re/confidentialite`

### Apple Developer (iOS)
1. Aller sur https://developer.apple.com/programs/
2. S'inscrire (99 USD/an)
3. **Attention** : la validation peut prendre **jusqu'a 48h**
4. Informations requises :
   - Memes infos que Google Play
   - Support URL : `https://randonnee-reunion.re`

---

## 5. Branding (a definir)

### Ce qui est requis par les stores

**Icone de l'app :**
- iOS : 1024x1024 px (PNG, pas de transparence, pas de coins arrondis — iOS les arrondit auto)
- Android : 512x512 px (PNG)

**Feature graphic (Google Play uniquement) :**
- 1024x500 px

**Screenshots :**
- iOS : 6 screenshots minimum (formats iPhone 6.7", 6.5", 5.5")
- Android : 2 screenshots minimum (formats phone + tablet recommande)

### Decisions a prendre
- [ ] Nom definitif de l'app (actuel : "Randonnee Reunion — Sentiers & GPS")
- [ ] Palette de couleurs finale (actuel : vert #16a34a)
- [ ] Logo / icone
- [ ] Splash screen

---

## 6. RevenueCat (pas bloquant au lancement)

Le **beta mode est ON** = tout est accessible gratuitement. RevenueCat n'est pas bloquant pour la premiere soumission.

Quand tu voudras activer les paiements :
1. Creer un compte RevenueCat (https://www.revenuecat.com)
2. Configurer les produits in-app dans App Store Connect + Google Play Console
3. Lier RevenueCat aux stores
4. Desactiver le beta mode dans le code (`app/src/stores/premiumStore.ts`)

---

## 7. Build production

Une fois tout le reste fait :
1. Mettre a jour `app/app.json` : version, icone, splash
2. Mettre a jour les URLs si le domaine est different
3. Lancer le build production :
   ```
   cd app
   npx eas build --profile production --platform android
   npx eas build --profile production --platform ios
   ```
4. Tester le build production avant soumission

---

## 8. Soumission

### Google Play
1. Google Play Console → Creer une application
2. Remplir la fiche store (description dans `docs/strategie/STORE_LISTING.md`)
3. Uploader l'AAB (pas APK) genere par EAS Build
4. Remplir le questionnaire de contenu (classification)
5. URL politique de confidentialite
6. Soumettre pour review (1-3 jours)

### App Store
1. App Store Connect → Nouvelle app
2. Remplir la fiche store
3. Uploader le build iOS via EAS
4. Screenshots + video preview (optionnel)
5. URL politique de confidentialite + support
6. Soumettre pour review (1-3 jours)

---

## Ordre recommande des actions

```
1. Acheter le nom de domaine
2. Creer l'email contact@
3. Creer les comptes stores (pendant que le domaine se propage)
4. Branding (logo, icone, screenshots)
5. Heberger les pages legales
6. Tester l'APK + corriger les bugs
7. Build production
8. Soumettre aux stores
```

Les etapes 1-3 ont des **delais de validation** (24-48h). Les lancer en premier.

---

*Document cree le 17 mars 2026*
