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

### Run locally

If you prefer to run the backend locally instead, follow these instructions:

```sh
# Install dependencies
npm i

# Prepopulate the database with some sample data
# Add "-- <seed>" to set a fixed seed for the random generator
npm run seed

# Start the dev server
npm run dev
```