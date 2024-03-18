# PolarExpress backend

Backend and infrastructure for the GraphPolaris marketplace.

## Dependencies

- Docker and Docker Compose

For development or running bare metal, the following are also required:

- Node.js 21 or above

## How to run

### Using docker

The easiest way to run the backend is using docker. To run the backend, use
the following compose command:

```sh
docker compose up backend-dev
```

This will automatically start the database container if it wasn't running
already, and build the `dev` stage of the backend Dockerfile, which will run
the backend using `ts-node`.

When deploying, run

```sh
docker compose up backend-prod
```

which will build the backend using `tsc` before running with node.

In case you only need the database (and nothing else), run

```sh
docker compose up db
```

### Run locally

If you prefer to run the backend locally instead, follow these instructions:

```sh
cp sample.env .env

# Install dependencies
npm i

# Compile the schema and run migrations
npm run gen-schema
npm run prisma-migrate

# Prepopulate the database with some sample data
# Add "-- <seed>" to set a fixed seed for the random generator
npm run prisma-seed

# Start the dev server
npm run start:dev
```

### Testing

To run the tests, simply run `npm test`. Jest will run all of the tests and generate a coverage report in the `coverage` folder.

### Prisma Studio

To edit the contents for the database, we recommend you use Prisma Studio. To
open prisma studio, run:

```sh
npx prisma studio
```
