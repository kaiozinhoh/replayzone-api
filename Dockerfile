# ============================================
# replayzone-api - Dockerfile para EasyPanel
# ============================================
# Build stage (opcional - dependências de produção)
FROM node:20-alpine AS base

WORKDIR /app

# Copia apenas arquivos de dependências primeiro (melhor cache)
COPY package.json package-lock.json* ./

# Instala dependências (sem devDependencies em produção)
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Stage final
FROM node:20-alpine

# Para healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Usuário não-root por segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copia node_modules e código do stage base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY . .

# Cria diretório para uploads/logos se necessário (pode ser montado como volume)
RUN mkdir -p /app/uploads/logos && chown -R nodejs:nodejs /app

USER nodejs

# Porta exposta (EasyPanel usa PORT do ambiente)
EXPOSE 3000

# Healthcheck (usa PORT do ambiente; EasyPanel define em runtime)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c 'wget -q -O /dev/null "http://127.0.0.1:${PORT:-3000}/health" || exit 1'

# Inicia a aplicação
CMD ["node", "src/server.js"]
