# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

# Sadece production dependencies yüklemiyoruz, çünkü TypeScript build için dev dependencies gerekli
RUN npm ci

COPY src/ ./src/

RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

# Güvenlik: Container'ı root olmayan bir kullanıcı ile çalıştır
USER node

WORKDIR /usr/src/app

# Sadece production bağımlılıklarını kur (TypeScript vs. olmadan)
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

# Builder aşamasından sadece derlenmiş kodları al
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node scripts ./scripts

EXPOSE 3000

CMD ["npm", "start"]