# EduMaster 2.0 — Installation Windows hors ligne

## Architecture
- Application de bureau Electron.
- Base SQLite stockée dans le dossier utilisateur Windows, séparément du dossier d'installation.
- Le fichier SQLite contient l'état applicatif sérialisé dans une table `app_state`.
- Aucun serveur MySQL ni connexion Internet n'est requis pour l'utilisation courante.

## Compilation
Prérequis : Windows 10/11, Node.js 22 et npm.

```powershell
npm install
npm run build
npm run dist:win
```

Les installateurs sont produits dans `release/`. L'installateur NSIS est le format recommandé.

## Données et sauvegardes
La base se trouve dans le dossier renvoyé par `app.getPath('userData')`, sous `data/edumaster.sqlite`. Ne pas supprimer ce fichier lors d'une mise à jour. Fermer l'application avant de copier le fichier pour effectuer une sauvegarde.

## Important
Cette première intégration conserve les données applicatives dans une table SQLite unique. Les écrans métier existants continuent d'utiliser leur modèle `AppDatabase`. Une migration vers des tables relationnelles dédiées devra être menée séparément si l'on veut exploiter directement chaque entité depuis SQLite.
