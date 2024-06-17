FROM node:21-bookworm AS base

RUN apt update && apt install -y git
RUN corepack enable

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

RUN pnpm build

# ------------------------------------------------------------------------------

FROM node:21-alpine AS prod

# Needed for healthcheck
RUN apk update && apk add --no-cache curl

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=dependencies /deps/prod/node_modules ./node_modules

ENV NODE_ENV=production
ENTRYPOINT ["node", "./build/src/index.js"]
