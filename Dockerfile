FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm ci --production=false

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image — only what's needed to run
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build output and node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
