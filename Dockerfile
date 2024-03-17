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

# We need package.json and .env here, because prisma generate will
# expand the DATABASE_URL in schema.prisma during the generation.
COPY package.json .env ./

COPY ./prisma ./prisma
RUN npx prisma generate

# ------------------------------------------------------------------------------

FROM base AS build

WORKDIR /app
COPY . .
COPY --from=gen-schema /app/node_modules ./node_modules

RUN npm run build

# ------------------------------------------------------------------------------

FROM node:21-alpine AS prod

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=gen-schema /app/node_modules/ ./node_modules/
COPY --from=gen-schema /app/prisma ./prisma

# We need .env and package.json for prisma to run the migrations
COPY .env package.json ./

ENV NODE_ENV=production

# We need to run npx prisma as part of the CMD because we require
# the database to be running when running this command. We cannot
# use RUN npx prisma because the db is only guaranteed to be started
# at the CMD.
CMD npx prisma migrate deploy && npm start

# ------------------------------------------------------------------------------

FROM base AS dev

WORKDIR /app
COPY . .
COPY --from=gen-schema /app/node_modules ./node_modules

ENV NODE_ENV=dev
CMD npx prisma migrate dev && npm run start:dev
