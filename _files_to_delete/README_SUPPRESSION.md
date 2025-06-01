# Fichiers Déplacés - À Supprimer

Ce dossier contient tous les fichiers inutiles qui ont été créés pendant le développement et le débogage du projet geneaIA.

## Contenu du dossier :

### Documentation de débogage (fichiers .md)
- Tous les fichiers de corrections et diagnostics
- Documentation temporaire de debugging
- Historique des modifications

### Scripts de démarrage/redémarrage (.sh)
- Tous les scripts de redémarrage automatique
- Scripts de diagnostic
- Scripts de setup temporaires

### Dossiers de développement
- `deploy/` - Configuration de déploiement
- `docs/` - Documentation temporaire
- `scripts/` - Scripts utilitaires
- `tests/` - Tests temporaires

### Fichiers de configuration
- `Makefile` - Configuration make
- `ecosystem.config.js` - Configuration PM2

## Instructions

Vous pouvez supprimer ce dossier entier en toute sécurité :

```bash
rm -rf _files_to_delete
```

Le projet est maintenant propre et ne contient que les fichiers essentiels :
- `backend/` - Code du serveur
- `frontend/` - Code de l'interface
- `README.md` - Documentation principale
- `package.json` - Configuration npm
- `.gitignore` - Configuration git

Tous les fichiers de debugging et scripts temporaires sont maintenant dans ce dossier.
