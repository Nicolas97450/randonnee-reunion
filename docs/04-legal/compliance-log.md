# Journal de conformité RGPD — Randonnée Réunion

Chaque modification touchant aux données utilisateur est documentée ici.

---

## 27 mars 2026 — Restructuration documentation

- Politique de confidentialité et CGU centralisées dans docs/04-legal/
- Versions HTML servies aux utilisateurs dans private/legal/
- Aucune nouvelle collecte de données

## 21 mars 2026 — Sprint H : RGPD complet

- Politique de confidentialité mise à jour : live tracking, DMs, transferts EU
- Suppression compte enrichie : 19 tables nettoyées
- Export de données complet via useAccountActions
- POST_NOTIFICATIONS permission ajoutée (Android 13+)

## 21 mars 2026 — Sprint D : Social security

- blocked_users : possibilité de bloquer des utilisateurs
- Rate limiting sur DMs et demandes d'amis
- Modération par mots-clés (filtrage FR)
- Permissions de conversation vérifiées

## 20 mars 2026 — Sprint 4 : Features sociales

- DMs (messages directs) ajoutés → données personnelles
- Notifications in-app (6 types) → préférences utilisateur
- Live tracking GPS → données de géolocalisation temps réel
- Contacts urgence → données sensibles

## 18 mars 2026 — Documents légaux initiaux

- Politique de confidentialité rédigée (private/legal/politique-confidentialite.html)
- CGU rédigées (private/legal/cgu.html)
- Checkbox consentement CGU obligatoire à l'inscription
- Disclaimer SOS première utilisation
