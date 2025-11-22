FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .

# Build the app
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN yarn build

# Serve stage
FROM node:18-alpine

WORKDIR /app

RUN yarn global add serve

COPY --from=builder /app/dist ./dist

EXPOSE 10000

CMD ["serve", "-s", "dist", "-l", "10000"]
