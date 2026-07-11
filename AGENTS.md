# Instructions pour les agents IA — GeneaIA

## Règle n°1 : la mémoire projet

**Avant toute tâche**, lis [docs/MEMOIRE.md](docs/MEMOIRE.md) — c'est la source de vérité sur l'état du projet (fonctionnalités livrées, décisions, environnements, prochaines étapes).

**Après toute tâche significative**, mets à jour `docs/MEMOIRE.md` :
- Ajoute une entrée dans le journal (date + résumé).
- Mets à jour les sections concernées (fonctionnalités, décisions, à faire).

## Conventions

- **Langue** : toujours répondre en français ; code et commits en anglais ou français cohérent avec l'existant.
- **Branches Git** : `dev` (développement local) → `staging` (tests VPS) → `main` (production). Jamais de push direct sur `main`.
- **Ports locaux Docker** : frontend `5173`, API `3001`, Postgres `5436`, MinIO `9000/9001`, Mailpit `1025/8025` (configurables via `.env` racine si ports occupés).
- **Stockage** : MinIO en local, Cloudflare R2 sur le VPS (voir [docs/CLOUDFLARE_R2.md](docs/CLOUDFLARE_R2.md)).
- **Déploiement VPS** : VPS Contabo géré par l'agent Souley (skill `souley`) — Traefik + Let's Encrypt, domaine `geneamap.com`.

## Comptes de test (seed local)

| Téléphone | Email | Mot de passe | Rôle |
|---|---|---|---|
| 0700000001 | test@example.com | password123 | Utilisateur test |
| 0700000002 | demo@geneaia.app | password123 | Propriétaire arbre démo |
| 0700000003 | famille40@geneaia.app | password123 | Famille Traoré (40 personnes, 5 générations) |
| 0700000004 | testeur@geneaia.app | password123 | Testeur paiement |
| 0700000010 | admin@geneamap.com | admin123 | Admin |

## Commandes utiles

```bash
docker compose up -d          # stack locale complète
npm run db:seed               # (re)seed la base
npm run test:frontend         # tests layout engine
npm run test:e2e              # Playwright E2E (stack locale requise)
bash scripts/test-storage.sh  # smoke test stockage
```
