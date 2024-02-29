FROM node:21-bookworm AS base

# ------------------------------------------------------------------------------

FROM base AS dependencies

WORKDIR /deps/dev
COPY package.json ./
RUN npm install

WORKDIR /deps/prod
COPY package.json ./
RUN npm install --prod

# ------------------------------------------------------------------------------

FROM base AS gen-schema

WORKDIR /app
COPY --from=dependencies /deps/dev/node_modules ./node_modules
COPY package.json ./
COPY ./schema ./schema
RUN npx zenstack generate

# ------------------------------------------------------------------------------

FROM base AS build

WORKDIR /app
COPY . .
COPY --from=dependencies /deps/dev/node_modules ./node_modules

RUN npm run build

# ------------------------------------------------------------------------------

FROM node:21-alpine AS prod

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=dependencies /deps/prod/node_modules ./node_modules
COPY --from=gen-schema /app/node_modules/.zenstack ./node_modules/.zenstack
COPY --from=gen-schema /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENTRYPOINT ["node", "build/index.js"]

# ------------------------------------------------------------------------------

FROM base AS dev

WORKDIR /app
COPY . .
COPY --from=gen-schema /app/node_modules ./node_modules

ENTRYPOINT [ "npm", "run", "start:dev" ]