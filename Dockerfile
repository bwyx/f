FROM node:16-alpine AS builder
ENV NODE_ENV=production

WORKDIR /@app

COPY package*.json ./

RUN npm pkg delete scripts.prepare
RUN npm ci

COPY . ./

CMD npm run build

FROM node:16-alpine AS prod

WORKDIR /@app

COPY package*.json ./

RUN npm pkg delete scripts.prepare
RUN npm ci --only=production

COPY --from=builder /@app/dist ./

COPY prisma ./prisma
RUN npx prisma generate

CMD node server.js
