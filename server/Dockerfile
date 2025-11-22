FROM node:18-alpine

WORKDIR /app

# Install cloudflared
RUN apk add --no-cache curl libc6-compat && \
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

COPY package*.json ./
RUN yarn install

COPY . .

RUN yarn build

EXPOSE 50000

CMD ["yarn", "start"]
