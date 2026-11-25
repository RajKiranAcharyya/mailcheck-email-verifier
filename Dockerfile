# ---- Stage 1: Build Next.js Frontend (Static Export) ----
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN rm -f .env .env.local .env.production

ENV STATIC_EXPORT=true
ENV NEXT_PUBLIC_API_URL=
RUN npm run build

# ---- Stage 2: Build Express + TypeScript Backend ----
FROM node:20-slim AS backend-build
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ---- Stage 3: Unified Production Runner ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV DATABASE_FILE=./prod.sqlite3
ENV CORS_ORIGIN=*
ENV JOB_CONCURRENCY=5

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./
COPY backend/data ./data
COPY --from=frontend-build /app/frontend/out ./public

EXPOSE 10000

CMD ["node", "dist/server.js"]
