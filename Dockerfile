FROM node:21-alpine AS base

# install pnpm in the base image
RUN npm i -g pnpm

# ------------------------------------------------------------------------------

FROM base AS deps

# For the dependencies, we only need the package.json and pnpm-lock.yaml
# we copy these to the container and run pnpm install
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# ------------------------------------------------------------------------------

FROM base AS build

# For the build step, we copy the entire project to the container and run
# pnpm build. See package.json for the build script.
WORKDIR /app
COPY . . 
# we also need the node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build

# ------------------------------------------------------------------------------

FROM base AS prod

# For the deploy step, we copy the build and node_modules to the container
# and run the app using node.
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules

CMD ["node", "build/index.js"]

FROM base as dev

# For the dev step, we copy the entire project to the container and run
# pnpm dev. See package.json for the dev script.

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

CMD ["pnpm", "start:dev"]

