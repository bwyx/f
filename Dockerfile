FROM node:16-alpine AS builder

WORKDIR /@app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . ./

CMD npm run build

FROM node:16-alpine AS dependencies

ENV NODE_ENV=production

WORKDIR /@app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm pkg delete scripts.prepare
RUN npm ci

FROM node:16-alpine AS app

WORKDIR /@app

COPY package*.json ./

COPY --from=dependencies /@app/node_modules ./node_modules
COPY --from=builder /@app/dist ./

COPY prisma ./prisma
RUN npx prisma generate

CMD node server.js
