# Build client
FROM node:22-alpine as client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN yarn install
COPY client/ .
RUN yarn build

# Build server
FROM node:22-alpine as server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN yarn install
COPY server/ .
RUN yarn build

# Final stage
FROM node:22-alpine
WORKDIR /app

# Install cloudflared
RUN apk add --no-cache curl libc6-compat && \
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

# Copy server build
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/package.json ./
COPY --from=server-builder /app/server/node_modules ./node_modules

# Copy client build
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 50000

CMD ["node", "dist/index.js"]
