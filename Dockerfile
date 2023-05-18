FROM node:16-alpine AS builder

WORKDIR /@app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . ./

CMD npm run build

FROM node:16-alpine AS bcrypt

WORKDIR /@app

RUN apk add --no-cache python3 make g++
RUN npm install bcrypt

FROM node:16-alpine AS app

WORKDIR /@app

COPY --from=bcrypt /@app/node_modules/bcrypt ./node_modules/bcrypt
COPY --from=builder /@app/dist ./

COPY package*.json ./

RUN npm ci --only=production --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

CMD node server.js
