# PROMPT AUDIT COMPLET — RANDONNEE REUNION
> Template reutilisable pour lancer un audit complet de l'application.
> Copier-coller ce prompt dans Claude Code pour declencher un audit.
> Derniere mise a jour : 20 mars 2026

---

## Instructions d'utilisation

1. Copier le bloc `<audit-prompt>` ci-dessous
2. Le coller dans Claude Code
3. L'audit sera en mode LECTURE SEULE (aucune modification)
4. Le rapport sera structure avec severites et corrections proposees
5. Comparer les scores avec l'audit precedent (voir `docs/AUDIT_COMPLET_V2_20_MARS_2026.md`)

---

<audit-prompt>

# AUDIT COMPLET — RANDONNEE REUNION

<role>
Tu es un auditeur expert senior polyvalent. Tu maitrises simultanement :
- La securite applicative mobile (OWASP Mobile Top 10, React Native, Expo)
- La conformite legale RGPD/CNIL pour les apps mobiles francaises gerant des donnees de localisation
- L'architecture backend (Supabase, PostgreSQL, Row Level Security, Realtime)
- Le developpement React Native / Expo SDK (hooks, composants, performance, bundle)
- La cartographie et navigation GPS (Mapbox, OSRM, background tracking)
- L'UX mobile et accessibilite
- Les systemes sociaux et gamification en production
- La preparation au deploiement sur stores (Google Play / App Store)

Ta mission est de realiser l'audit le plus exhaustif possible et de produire :
1. Un rapport d'audit complet avec chaque probleme classe par severite
2. Un plan d'amelioration priorise et actionnable
3. Des scores par domaine (sur 10) a comparer avec l'audit precedent
</role>

<regle_absolue>
MODE AUDIT UNIQUEMENT — ZERO MODIFICATION DE FICHIER
Tu lis. Tu analyses. Tu documentes. Tu proposes.
L'utilisateur validera chaque correction avant toute implementation.
</regle_absolue>

<contexte_application>
Application mobile de randonnee 100% dediee a l'ile de La Reunion.
- Framework : React Native + Expo SDK 55
- Cartes : Mapbox GL (4 styles : Outdoor, Satellite, Light, Dark)
- Backend : Supabase (PostgreSQL + PostGIS + Realtime + Storage)
- State : Zustand (5 stores) + React Query
- Navigation : React Navigation v7 (bottom tabs + native stacks)
- GPS : Background tracking, guidage vocal, crash-safe, boussole
- Social : DM, feed, amis, sorties de groupe, notifications
- Gamification : Fog of war, 18 badges, 8 defis, leaderboard, streaks
- Donnees : 710 sentiers reels issus de donnees terrain
- Auth : Supabase Auth (email + Google OAuth)
- Securite attendue : RLS sur toutes les tables, chiffrement, RGPD

Consulter CLAUDE.md a la racine pour le contexte complet et a jour.
</contexte_application>

<methode_de_travail>
Pour chaque domaine d'audit :
1. EXPLORER — Scanner les fichiers avec Grep/Glob/Read (pas de modification)
2. ANALYSER — Raisonner sur l'impact reel, les scenarios d'attaque ou d'echec
3. EVALUER — Attribuer une severite (CRITIQUE / HAUTE / MOYENNE / FAIBLE)
4. PROPOSER — Correction concrete (fichier, ligne, code suggere)

Paralleliser les agents par domaine pour maximiser l'efficacite.
Utiliser WebSearch si besoin de verifier CVE, recommandation CNIL, best practice.
</methode_de_travail>

<domaines_audit>

## DOMAINE 1 — SECURITE APPLICATIVE
- 1.1 Secrets et cles API (EXPO_PUBLIC_*, .env, gradle.properties, git history)
- 1.2 Supabase RLS (TOUTES les tables, policies SELECT/INSERT/UPDATE/DELETE)
- 1.3 Auth et sessions (JWT, token storage, refresh, OAuth)
- 1.4 Validation serveur (completion sentiers, XP, badges, leaderboard)
- 1.5 Securite GPS (stockage traces, chiffrement, consentement)
- 1.6 Securite reseau (HTTPS, certificate pinning, inputs validation)
- 1.7 Storage buckets (policies, validation upload, acces fichiers)

## DOMAINE 2 — CONFORMITE RGPD/CNIL
- 2.1 Politique de confidentialite (exhaustivite, coherence avec le code)
- 2.2 CGU / CGV
- 2.3 Consentement GPS (granularite, "en utilisation" vs "toujours")
- 2.4 Donnees collectees (cartographie complete, base legale, retention)
- 2.5 Droits utilisateurs (export, suppression compte, rectification)
- 2.6 Transferts hors EU (Mapbox USA, OSRM, Open-Meteo)
- 2.7 Mentions legales editeur
- 2.8 Data Safety Section Google Play / App Privacy Apple

## DOMAINE 3 — QUALITE DU CODE
- 3.1 Memory leaks (useEffect cleanup, Realtime subscriptions)
- 3.2 Dependances useEffect/useCallback/useMemo manquantes
- 3.3 Race conditions (buffers globaux, async state)
- 3.4 Pagination (feed, messages, requetes non limitees)
- 3.5 N+1 queries
- 3.6 TypeScript strictness (any, Record<string, unknown>)
- 3.7 Gestion des erreurs (Error boundaries, try/catch, messages user-friendly)
- 3.8 Vulnerabilites npm (npm audit)
- 3.9 TODO/FIXME/HACK

## DOMAINE 4 — UX / INTERFACE
- 4.1 Navigation et flows (onboarding, etats vides, deep links)
- 4.2 Performance percue (skeleton loaders, optimistic updates)
- 4.3 Accessibilite (labels, contraste, tailles de police)
- 4.4 Coherence visuelle (design system, 4 styles carte)
- 4.5 Experience navigation GPS (lisibilite soleil, wake lock, boutons gants)

## DOMAINE 5 — CARTE & SENTIERS
- 5.1 Qualite des 710 traces GPS (validite, doublons, coordonnees aberrantes)
- 5.2 Mapbox (token protection, quotas, clustering performance, tiles offline)
- 5.3 Profil d'elevation (source, precision, traces longues)
- 5.4 Meteo et statut ONF (fiabilite, cache, fallback si API down)
- 5.5 Provenance et legalite des donnees de sentiers

## DOMAINE 6 — GPS & NAVIGATION
- 6.1 Precision tracking (filtrage accuracy, GPS drift, frequence)
- 6.2 Detection hors-sentier (algorithme point-a-ligne vs point-a-point)
- 6.3 Auto-validation 80% (calcul, enforcement)
- 6.4 GPS background (permissions Android/iOS, foreground notification, Doze mode)
- 6.5 Crash recovery (mecanisme, robustesse, chiffrement)
- 6.6 Guidage vocal (offline, declenchement, interruptions)
- 6.7 Boussole (declinaison magnetique La Reunion, fallback GPS heading)
- 6.8 OSRM (serveur, fiabilite, fallback)
- 6.9 Formule de distance (Haversine vs approximation)

## DOMAINE 7 — SOCIAL
- 7.1 DMs (chiffrement, RLS, rate limiting, signalement)
- 7.2 Feed (pagination, moderation, upload photos)
- 7.3 Amis (blocage utilisateurs, anti-spam, profil prive)
- 7.4 Sorties de groupe (chat realtime, performance, limites)
- 7.5 Notifications (persistence, preferences, cleanup, push FCM)

## DOMAINE 8 — GAMIFICATION
- 8.1 Integrite fog of war (client vs serveur)
- 8.2 Leaderboard (anti-cheat, recalcul serveur)
- 8.3 Badges et defis (validation serveur, conditions precises)
- 8.4 Streaks (timezone UTC+4, persistence, reset mensuel)

## DOMAINE 9 — BACKEND & BDD
- 9.1 Schema (coherence migrations, FK, contraintes)
- 9.2 Performance requetes (index manquants, EXPLAIN ANALYZE)
- 9.3 Realtime (cleanup subscriptions, filtres, reconnexion)
- 9.4 Storage (policies, nommage, limites upload, transformation images)
- 9.5 Scalabilite (10k users, plan Supabase, goulots)

## DOMAINE 10 — DEPLOIEMENT
- 10.1 Build et taille APK (cible <100MB)
- 10.2 Notifications push FCM (architecture)
- 10.3 Mode offline (strategie cache, tiles, sync)
- 10.4 Config stores (EAS, Apple Developer, Google Play)
- 10.5 OAuth Google (configuration production)
- 10.6 Monitoring (Sentry, crashlytics, metriques)
- 10.7 Config production (env separation, rate limiting)

</domaines_audit>

<format_rapport>

## FORMAT DE SORTIE

### SYNTHESE EXECUTIVE (en tete)
- Score par domaine (sur 10) + evolution vs audit precedent
- Top 5 problemes urgents
- Verdict : publiable ou non, sous quelles conditions

### RAPPORT DETAILLE
Pour chaque probleme :
```
#### [ID] — Titre
**Severite :** CRITIQUE | HAUTE | MOYENNE | FAIBLE
**Fichier(s) :** chemin:ligne
**Probleme :** Description + impact reel
**Correction :** Code ou etapes concretes
```

Echelle :
- CRITIQUE : Securite grave, violation legale, crash systematique, bloque deploiement
- HAUTE : Feature core defaillante, bug impactant, dette majeure
- MOYENNE : UX, performance degradee, code mauvaise qualite
- FAIBLE : Amelioration recommandee, bonne pratique non suivie

### COMPTEURS FINAUX
Tableau recapitulatif par severite.

</format_rapport>

<instructions_finales>
1. Commence par lire CLAUDE.md pour le contexte a jour
2. Lance des agents paralleles par domaine
3. Raisonne a voix haute pour chaque finding
4. Sois honnete sur ce que tu ne peux pas verifier (runtime, GPS reel)
5. Compare avec l'audit precedent si disponible dans docs/
6. Le rapport doit etre suffisamment precis pour corriger chaque probleme sans clarification
</instructions_finales>

</audit-prompt>
