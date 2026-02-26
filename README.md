# Markap Frontend

El proyecto usa **Arquitectura por Features (Clean + Modular)**. El código se organiza en capas: `app`, `applications`, `features`, `widgets`, `shared`.

- **[Arquitectura](docs/ARCHITECTURE.md)** — Capas, dependencias y convenciones.
- **[Cómo agregar funcionalidades](docs/ADDING_FEATURES.md)** — Pasos para nuevas aplicaciones, funciones o features.

## Pasos de ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Copiar variables de entorno
cp .env.example .env
# Configurar VITE_API_BASE_URL si la API no está en localhost:3000

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`
