# Sprint 4 — En attente (actions manuelles requises)
> Ces taches necessitent des comptes/domaines que Nicolas doit creer.
> A faire APRES avoir teste le build Sprint 1+2+3.

---

## Prerequis a acheter/creer

| Action | Cout | Ou | Temps |
|--------|------|-----|-------|
| Domaine randonnee-reunion.re | ~12 EUR/an | OVH ou LWS | 10 min + 24h DNS |
| Email contact@randonnee-reunion.re | Inclus domaine | Meme registrar | 10 min |
| Compte Google Play | 25 USD (une fois) | play.google.com/console | 10 min + 48h verif |
| Compte Apple Developer (si iOS) | 99 USD/an | developer.apple.com | 10 min + 48h verif |
| Compte Firebase (gratuit) | 0 EUR | console.firebase.google.com | 10 min |
| Config Google OAuth SHA-1 | 0 EUR | console.cloud.google.com | 15 min |

---

## Tache 1 : Mode offline cartes

**Prerequis** : Serveur pour heberger les tuiles (~5 EUR/mois VPS ou Cloudflare R2 gratuit)

**Ce qu'il faut faire** :
1. Generer les PMTiles de La Reunion (OpenTopoMap + Satellite)
2. Heberger sur un serveur accessible
3. Remplir tiles_url dans Supabase pour les 710 sentiers
4. Le bouton "Telecharger" dans TrailDetailScreen fonctionnera alors
5. Utiliser MapLibre offlineManager pour stocker les tuiles localement

---

## Tache 2 : Reset mot de passe

**Prerequis** : Domaine + email configures dans Supabase Auth

**Ce qu'il faut faire** :
1. Configurer le domaine email dans Supabase Dashboard > Auth > Email Templates
2. Implementer `supabase.auth.resetPasswordForEmail(email)` dans LoginScreen
3. Remplacer le message "Contacte le support" par un vrai flux

---

## Tache 3 : Notifications push

**Prerequis** : Compte Firebase + FCM configure

**Ce qu'il faut faire** :
1. Creer un projet Firebase
2. Ajouter google-services.json dans android/app/
3. Configurer expo-notifications avec le projectId
4. Connecter useNotifications.ts (hook deja code mais pas connecte)
5. Envoyer des notifs : nouveau message chat, rappel sortie J-1, signalement sur un sentier favori

---

## Tache 4 : Deep links

**Prerequis** : Domaine configure + scheme URL dans app.json

**Ce qu'il faut faire** :
1. Configurer le scheme dans app.json (ex: randoreunion://)
2. Configurer les Universal Links (domaine)
3. Ajouter les routes deep link dans la navigation
4. Bouton "Partager" sur chaque sentier et sortie qui genere un lien

---

## Tache 5 : Heberger docs legales

**Prerequis** : Domaine achete et DNS configure

**Ce qu'il faut faire** :
1. Heberger politique-confidentialite.html et cgu.html (GitHub Pages, Netlify ou Vercel gratuit)
2. Configurer randonnee-reunion.re/confidentialite et /cgu
3. Mettre a jour les URLs dans SettingsScreen.tsx
4. Verifier que les liens fonctionnent avant soumission stores

---

## Ordre recommande

```
1. Acheter domaine + creer email (lancer en premier, 24h de propagation)
2. Creer comptes stores (en parallele, 48h de verif)
3. Creer compte Firebase (5 min)
4. Heberger docs legales (quand DNS propage)
5. Configurer reset MDP (quand email fonctionne)
6. Configurer notifications push (quand Firebase pret)
7. Deep links (quand domaine valide)
8. Mode offline (quand serveur tuiles disponible)
9. Build production final
10. Soumettre aux stores
```

---

*Document cree le 19 mars 2026*
