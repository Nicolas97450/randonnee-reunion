# Audit Complet — 18 mars 2026
> Verdict : AMELIORATION (pas de refonte). Base solide, trous fonctionnels a combler.

---

## Donnees Supabase (testees en live)

| Table | Lignes | Etat |
|---|---|---|
| trails | 710 | COMPLET — 0 nulls, toutes colonnes remplies |
| user_profiles | 5 | OK — pas de bio/display_name, avatars null |
| posts | 1 | MINIMAL — 1 post auto |
| post_likes | 1 | MINIMAL |
| friendships | 0 | VIDE — feature non testee |
| sorties | 3 | FAIBLE — pas de nettoyage auto des passees |
| sortie_messages | 9 | FAIBLE — messages de test |
| trail_reports | 2 | FAIBLE |
| user_activities | 0 | CRITIQUE — gamification morte |
| tiles_url | 0/710 | NULL — offline mort |

---

## Problemes CRITIQUES

1. **Gamification morte** — user_activities vide, validateTrail() jamais appele, trace GPS perdue a l'arret
2. **Pas de carte topo** — Positron = carte urbaine, pas de courbes de niveau
3. **Pas de profil d'elevation** — feature #1 attendue par les randonneurs
4. **Mode offline mort** — tiles_url null, bouton toujours grise
5. **Bucket reports inexistant** — upload photo signalement echoue silencieusement
6. **Suppression compte incomplete** — ne supprime pas auth.users
7. **RLS trop permissives** — messages prives lisibles par tous
8. **Liens CGU/Confidentialite** — domaine inexistant
9. **Sorties passees** — jamais fermees automatiquement

## Problemes techniques (MapLibre Android)

- `onPress` sur ShapeSource cluster ne remonte pas sur Android — utiliser MapView.onPress + queryRenderedFeaturesAtPoint
- `UserLocation` renderMode="native" ne s'affiche pas sur certains devices
- Point bleu custom code mais depend des permissions GPS

---

## Comparaison vs AllTrails/Komoot

| Feature | Concurrence | Nous | Ecart |
|---|---|---|---|
| Carte topo (courbes de niveau) | OUI | NON | CRITIQUE |
| Profil d'elevation | OUI | NON | CRITIQUE |
| Sauvegarde trace + export GPX | OUI | NON | CRITIQUE |
| Mode offline | OUI | NON | CRITIQUE |
| Photos sentier | OUI | NON | MAJEUR |
| Avis/commentaires | OUI | NON | MAJEUR |
| Favoris | OUI | NON | MOYEN |
| Recherche proximite | OUI | NON | MOYEN |
| Notifications push | OUI | NON | MAJEUR |

---

## Plan d'action

### Sprint 1 — URGENT (1-2 semaines)
1. Sauvegarde trace GPS + validation sentier + export GPX
2. Corriger securite (RLS, bucket reports, suppression auth)
3. Carte topo (OpenTopoMap — 1 ligne a changer)
4. Profil d'elevation (SVG dans TrailDetailScreen)

### Sprint 2 — IMPORTANT (2-3 semaines)
5. Mode offline reel
6. Reset mot de passe
7. Nettoyage sorties passees
8. Filtrage avance (tri, proximite, favoris)
9. Galerie photos sentier

### Sprint 3 — AMELIORATIONS (3-4 semaines)
10. Notifications push
11. Avis/commentaires sentiers
12. Posts texte/photo libres
13. Deep links
14. Profil public autres users
15. Heberger docs legales
16. Filtrer signalements expires

---

## Ce qui est BON
- 710 sentiers avec traces GPS reelles — asset rare et precieux
- Stack technique solide (Expo, Supabase, MapLibre, Zustand, React Query)
- Code propre, TypeScript strict
- Design system coherent (COLORS, SPACING, FONT_SIZE)
- Features sociales implementees (amis, feed, sorties, chat)
- Architecture hooks bien structuree

---

*Document genere le 18 mars 2026 a 01h00*
