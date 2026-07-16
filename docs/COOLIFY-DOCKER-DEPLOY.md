# Playbook: despliegue Coolify + imagen Docker (Markap front)

Detalle completo (API + DB + checklist): `markap_backend/docs/COOLIFY-DOCKER-DEPLOY.md`.

**Dominios:** API en `https://api-admin.markaphomes.com` y frontend en `https://admin.markaphomes.com`.

---

## Build + push

```bash
cd "/Users/santosjesusbernuiacevedo/Documents/PROYECTOS/Markap Homes/markap_frontend"

docker buildx build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=https://api-admin.markaphomes.com/api \
  --build-arg VITE_APP_ENV=production \
  --build-arg VITE_ENABLE_DEV_TOOLS=false \
  -t santossjba/front-markap:latest \
  --push .
```

Coolify: **MARKAP HOMES** → Docker Image → `santossjba/front-markap:latest` → puerto `80` → dominio `https://admin.markaphomes.com` → healthcheck `GET /`.

Si cambia la URL de la API, **rebuild** del front (las `VITE_*` no son runtime).
