# Commande /status — État du projet Randonnée Réunion

Quand l'utilisateur tape /status, effectue ces étapes :

1. Lis project/PROJECT_STATE.md et affiche un résumé de l'état actuel
2. Lis project/TASKS.md et affiche :
   - Nombre de tâches à faire / en cours / fait
   - Les 3 tâches prioritaires
3. Lis project/SESSIONS.md et affiche la dernière session
4. Vérifie les incohérences évidentes :
   - Tâche marquée "fait" mais le code n'existe pas
   - Feature dans le code mais pas dans le PRD
5. Propose les prochaines actions recommandées

Contexte du projet : app mobile React Native/Expo de randonnée pour La Réunion.
710 sentiers, 26 écrans, Supabase backend, Mapbox cartographie.
