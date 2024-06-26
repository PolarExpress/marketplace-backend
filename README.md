# PolarExpress Backend

This is the backend and infrastructure for the GraphPolaris marketplace.

## Requirements

- A running instance of the GraphPolaris infrastructure, specifically:
  - RabbitMQ
  - MongoDB
  - Redis
  - MinIO
- Node.js 21 or later
- pnpm

## Installation

Before starting the application, ensure the following services are running:

1. RabbitMQ
2. MongoDB
3. Redis
4. MinIO

Next, follow these steps:

1. Create a `.env` file and set the required environment variables to match your setup. For an example, see the `sample.env` file.
2. Install the dependencies using `pnpm install`.
3. Start the backend by running `pnpm dev`.

## Seeding the Database

To seed the database, run:

```sh
pnpm seed
```

This will populate the database with randomly generated data.

If you want to set the seed of the generated data to get deterministic results, run:

```sh
pnpm seed -- <your seed here>
```

## Scripts

To manage the application, use `pnpm <script>`, where `<script>` is one of the following:

- `build` - Compile the TypeScript code to JavaScript.
- `dev` - Start the development server with TypeScript and dotenv configuration.
- `start` - Start the production server using the compiled JavaScript code.
- `seed` - Seed the database with initial data.
- `test` - Run the test suite using Jest.
- `load` - Load additional modules using `ts-node`.
- `lint` - Run ESLint to lint the code.
- `lint:fix` - Automatically fix ESLint issues.
- `format` - Format the code using Prettier.
- `prepare` - Prepare the environment for Husky Git hooks (skipped in production).

## API

The marketplace backend has two APIs: one for AMQP messages and one for HTTP requests. The HTTP API exists because a client has to be logged in to use the AMQP network.

### HTTP Endpoints

#### `/addons/get`

```ts
POST /addons/get {
    category: "VISUALISATION" | "MACHINE_LEARNING" | undefined,
    page: number | undefined,
    searchTerm: string | undefined
}
=> { addons: [...], totalPages: number }
```

Get a list of addons.

- `category`: Filter by category.
- `page`: Page number of the page to get (default = 0).
- `searchTerm`: Optional search term to filter addons by name.

#### `/addons/get-by-id`

```ts
POST /addons/get-by-id {
    id: string
}
=> { addon: {...} }
```

Get an addon with the specified ID.

- `id`: the `_id` of the addon. This ID has been automatically generated by MongoDB when the addon was first loaded into the database.

#### `/addons/get-readme`

```ts
POST /addons/get-readme {
    id: string
}
=> { readme: "..." }
```
Get the contents of the README.md file belonging to the given addon.

- `id`: the `_id` of the addon. This ID has been automatically generated by MongoDB when the addon was first loaded into the database.

#### `/store/...`

This endpoint provides access to the MinIO data store.

### AMQP Endpoints

Because AMQP is a publish-and-subscribe protocol, the concept of "endpoints" does not exist and is merely an abstraction on top of the AMQP routing. The *client-updater-service* provides one half of this abstraction, while the *ts-amqp-socket* package provides the other half. Communication with the *client-updater-service* is handled by `broker.tsx` in both the marketplace frontend and the GraphPolaris frontend.

Unlike other microservices, *marketplace-backend* does not use the `subKey` field to denote different endpoints. This is due to the limited expandability of this system, which requires modifications to the `go-common` repository. Instead, an `action` field is assumed to exist in the `body` object of the message. This field corresponds with the handler keys specified in the `AmqpSocket.handle()` calls. See the `ts-amqp-socket` package for more information.
