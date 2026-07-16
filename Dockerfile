FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Env de producción embebidos en el build Vite (no hay runtime env en el browser).
ARG VITE_API_BASE_URL=https://api-admin.markaphomes.com/api
ARG VITE_API_TIMEOUT=30000
ARG VITE_APP_NAME=Markap
ARG VITE_APP_VERSION=1.0.0
ARG VITE_APP_ENV=production
ARG VITE_ENABLE_DEV_TOOLS=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_API_TIMEOUT=$VITE_API_TIMEOUT \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_APP_ENV=$VITE_APP_ENV \
    VITE_ENABLE_DEV_TOOLS=$VITE_ENABLE_DEV_TOOLS

RUN NODE_ENV=production pnpm exec vite build

FROM nginx:1.27-alpine AS runner
# curl: Coolify HEALTHCHECK dentro del contenedor
RUN apk add --no-cache curl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
