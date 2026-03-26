FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Compilar SIN verificación de TypeScript (solo vite build)
RUN npx vite build

# --- Servidor de producción ---
FROM node:20-alpine

WORKDIR /app

# Instala un servidor HTTP simple
RUN npm install -g serve

# Copia solo los archivos de producción
COPY --from=builder /app/dist ./dist

EXPOSE 5173

# Sirve los archivos estáticos
CMD ["serve", "-s", "dist", "-l", "5173"]