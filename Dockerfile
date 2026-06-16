FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Declarar build args para que EasyPanel los inyecte en el bundle
ARG VITE_API_BASE_URL
ARG VITE_API_TIMEOUT
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_APP_ENV
ARG VITE_ENABLE_DEV_TOOLS

# Convertirlos en env vars para que Vite los lea durante el build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_ENABLE_DEV_TOOLS=$VITE_ENABLE_DEV_TOOLS

# Compilar SIN verificación de TypeScript (solo vite build)
RUN pnpm exec vite build

# --- Servidor de producción ---
FROM node:20-alpine

WORKDIR /app

RUN corepack enable pnpm && pnpm add -g serve

# Copia solo los archivos de producción
COPY --from=builder /app/dist ./dist

EXPOSE 5173

# Sirve los archivos estáticos
CMD ["serve", "-s", "dist", "-l", "5173"]
