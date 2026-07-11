# OpenWA — OTP WhatsApp (GeneaIA)

Service externe [OpenWA](https://github.com/open-wa/wa-automate-nodejs) pour l'envoi des codes OTP par WhatsApp. L'email SMTP reste le secours.

## Local (optionnel)

```bash
docker compose -f docker-compose.openwa.yml up -d
```

Puis dans l'admin GeneaIA → **WhatsApp / OpenWA** :

- URL API : `http://host.docker.internal:2785/api` (Mac/Windows) ou IP du conteneur
- Créer une session et scanner le QR WhatsApp

Variables env backend (alternative à l'admin) :

```env
OPENWA_ENABLED=true
OPENWA_BASE_URL=http://openwa:2785/api
OPENWA_API_KEY=
OPENWA_SESSION_ID=geneaia
```

## Production (VPS)

1. Déployer le stack OpenWA sur le même réseau Docker que le backend :

```bash
docker compose -f docker-compose.openwa.yml --env-file .env up -d
```

2. Scanner le QR une fois (logs du conteneur `geneaia-openwa`).

3. Configurer `/admin/openwa` ou les variables `OPENWA_*` dans `.env` prod.

4. Vérifier : **Tester l'envoi** depuis l'admin avec un numéro `07XXXXXXXX`.

## Dépannage

| Symptôme | Action |
|----------|--------|
| OTP par email seulement | Session OpenWA déconnectée — rescanner QR |
| Timeout 15s | Vérifier réseau Docker backend → openwa |
| 401 API | Vérifier `OPENWA_API_KEY` |

Test rapide :

```bash
bash scripts/test-openwa.sh
```
