# Markap Frontend

Aplicación Vue 3, TypeScript, Vite, Pinia y TanStack Vue Query. Organizada por módulos de negocio con contratos tipados y adaptadores registrados en el arranque.

- [Arquitectura y patrones](docs/ARCHITECTURE.md)
- [Agregar funcionalidades](docs/ADDING_FEATURES.md)
- [Mapa de módulos](docs/CLEAN_MODULES.md)
- [Despliegue](DEPLOYMENT.md)

## Desarrollo

Requiere Node.js 20.19+ o 22.12+ y pnpm 11. Se recomienda usar una versión LTS compatible.

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Configurar `VITE_API_BASE_URL` en `.env` con la URL de la API, incluyendo su prefijo `/api`. Vite muestra la dirección local al iniciar.

```sh
pnpm verify  # Arquitectura, tipos, regresión y compilación
pnpm build  # Artefactos en dist/
pnpm preview
```

`template/` contiene material local de referencia y permanece ignorado por Git.
