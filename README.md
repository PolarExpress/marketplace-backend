# PolarExpress backend

Backend and infrastructure for the GraphPolaris marketplace.

## How to run

### Requirements

- A running instance of the GraphPolaris infrastructure, specifically:
    - RabbitMQ
    - MongoDB
    - Redis
    - MinIO
- Node.js 21 or later
- pnpm

### Steps

1. Make sure all the required services listed in the Requirements section are
running
2. Create a `.env` file and set the required environment variables to match
your setup. For an example, see the `sample.env` file.
3. Run `pnpm install` to install the needed modules.
4. Run `pnpm dev` to start the backend.

### Seeding the database
To seed the database, simply run
```pnpm seed```
This will populate the database with randomly generated data.

In case you want to set the seed of the generated data to get deterministic
results, run
```pnpm seed -- <your seed here>```

## API
marketplace-backend has two APIs: one for AMQP messages and one for HTTP 
requests. The HTTP API exists because a client has to be logged in in order to
make use of the AMQP network.

### HTTP endpoints
#### `/addons/get`
```ts
POST /addons/get {
    category: "VISUALISATION" | "MACHINE_LEARNING" | undefined
    page: number | undefined
}
=> { addons: [...] }
```
Get a list of addons. 
- `category`: filter by category
- `page`: page number of the page to get (default = 0)

#### `/addons/get-by-id`
```ts
POST /addons/get-by-id {
    addonId: string
}
=> { addon: {...} }
```
Get an addon with the specified ID.
- `addonId`: the `_id` of the addon

#### `/addons/get-readme`
```ts
POST /addons/get-readme {
    addonId: string
}
=> { readme: "..." }
```
Get the contents of the README.md file belonging to the given addon.
- `addonId`: the `_id` of the addon

#### `/store/...`
This endpoint provides access to the MinIO data store.

### AMQP endpoints
Because AMQP is a publish-and-subscribe protocol, the concept of "endpoints"
does not exist and is merely an abstraction on top of the AMQP routing. 
*client-updater-service* provides the one half of this abstraction, while the
*ts-amqp-socket* package provides the other half. Communication with 
*client-updater-service* is dealt with by `broker.tsx` in both the marketplace
frontend and the GraphPolaris frontend. 

In contrast to other microservices, *marketplace-backend* does not make use of
the subKey field to denote different endpoints. This has to do with the limited
expandability of this system, requiring modifications to the `go-common`
repository. Instead, an `action` field is assumed to exist in the `body` object
of the message. This field corresponds with the handler keys specified in the
`AmqpSocket.handle()` calls. See the `ts-amqp-socket` package for more info.

