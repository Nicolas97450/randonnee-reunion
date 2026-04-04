# Règles de conformité RGPD — Randonnée Réunion

## Données personnelles collectées
- Profil : email, username, avatar (Supabase Auth + user_profiles)
- GPS : traces de randonnée, positions temps réel (live_tracking)
- Social : messages DM, posts feed, commentaires, amitiés
- Contacts urgence : numéros stockés dans user_emergency_contacts
- Activités : sentiers validés, stats de randonnée

## Droits utilisateur (RGPD)
- **Droit à la suppression** : useAccountActions exporte+supprime 19 tables
- **Droit à l'export** : export complet des données via useAccountActions
- **Consentement** : checkbox CGU obligatoire à l'inscription (RegisterScreen)
- **Profil privé** : toggle de visibilité dans ProfileScreen

## Règles obligatoires
- Toute nouvelle collecte de donnée → mettre à jour docs/04-legal/privacy-policy.md
- Toute feature sociale (DM, posts, partage) → revue RGPD obligatoire
- Les données de géolocalisation sont des données sensibles RGPD
- Live tracking = transfert temps réel → mentions dans la politique de confidentialité

## Documents à jour
- docs/04-legal/privacy-policy.md — Politique de confidentialité
- docs/04-legal/terms-of-service.md — CGU
- docs/04-legal/compliance-log.md — Journal des revues de conformité
- private/legal/ — Versions HTML servies aux utilisateurs

## Cookies et tracking
- Pas de cookies tiers dans l'app mobile
- Supabase Auth gère les sessions via tokens JWT
- Sentry collecte des données de crash (mentionné dans la politique)
