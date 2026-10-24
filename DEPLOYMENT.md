# Despliegue del panel Markap

Coolify compila el Dockerfile de `SantosSjba/markap_frontend`, rama `main`, en la aplicación existente `front-markap`.

Al subir cambios a `main`, la integración GitHub notifica a Coolify para reconstruir y publicar el panel en https://admin.markaphomes.com.

Antes de subir, ejecutar `pnpm build` y `pnpm test`. Revisar el resultado en Deployments de `front-markap`.

Vite incorpora `VITE_*` al compilar. El Dockerfile mantiene la API de producción en `https://api-admin.markaphomes.com/api`.
La base de datos y MinIO se configuran exclusivamente en el backend; el panel usa su API.
