FROM node:21-bookworm AS base

RUN npm install -g pnpm
# ------------------------------------------------------------------------------

FROM base AS dependencies

WORKDIR /deps/dev
COPY pnpm-lock.yaml package.json ./
RUN pnpm i

WORKDIR /deps/prod
COPY pnpm-lock.yaml package.json ./
RUN pnpm i --prod

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

ENV NODE_ENV=production
ENTRYPOINT ["node", "./build/src/index.js"]