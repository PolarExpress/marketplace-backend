/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
import * as minio from "minio";
import { Db, MongoClient } from "mongodb";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import environment from "../src/environment";
import { AddonCategory } from "../src/types";
import { pexec } from "./utils";

interface LocalArgv {
  isDefault: boolean;
  path: string;
}

async function createAuthor(database: Db) {
  const authors = database.collection("authors");
  const author = await authors.findOne();
  if (author === null) {
    const insertedDocument = await authors.insertOne({
      userId: ""
    });
    return { _id: insertedDocument.insertedId, userId: "" };
  } else {
    return author;
  }
}

async function* getFiles(directory: string): AsyncGenerator<string> {
  const dirents = await readdir(directory, { withFileTypes: true });
  for (const dirent of dirents) {
    const resource = path.resolve(directory, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(resource);
    } else {
      yield resource;
    }
  }
}

export async function local(argv: LocalArgv) {
  const manifestPath = path.join(argv.path, "manifest.json");
  const manifestContents = await readFile(manifestPath).then(data =>
    data.toString()
  );
  const unparsedManifest = JSON.parse(manifestContents) as unknown;
  const manifest = parseManifest(unparsedManifest);

  if (manifest === null) throw new Error("Invalid manifest file");

  const minioClient = new minio.Client({
    accessKey: environment.MINIO_ACCESSKEY,
    endPoint: environment.MINIO_ENDPOINT,
    port: environment.MINIO_PORT,
    secretKey: environment.MINIO_SECRETKEY,
    useSSL: false
  });

  if (!(await minioClient.bucketExists("addons")))
    await minioClient.makeBucket("addons");

  const mongo = await MongoClient.connect(environment.MONGO_URI);
  const database = mongo.db(environment.MP_DATABASE_NAME);
  const collection = database.collection("addons");

  const author = await createAuthor(database);

  const insertedDocument = await collection.insertOne({
    authorId: author!._id,
    category: manifest.category,
    installCount: 0,
    isDefault: argv.isDefault,
    name: manifest.name,
    summary: manifest.summary
  });
  const id = insertedDocument.insertedId;

  if (!existsSync(argv.path)) {
    throw new Error("Could not clone repository");
  }
  console.log("Installing dependencies and building project");

  if (existsSync(path.join(argv.path, "pnpm-lock.yaml"))) {
    await pexec(`cd ${argv.path} && pnpm i && pnpm build`);

    const buildPath = path.join(argv.path, "dist");
    for await (const file of getFiles(buildPath)) {
      if (/\.\w+$/.test(file)) {
        const relativePath = path.relative(buildPath, file);
        const minioPath = path
          .join(id.toString(), relativePath)
          // eslint-disable-next-line unicorn/prefer-string-replace-all
          .replace(/\\/g, "/");
        console.log(`Uploading ${minioPath}`);
        const buffer = await readFile(file);
        await minioClient.putObject("addons", minioPath, buffer);
      }
    }
  } else {
    if (manifest.category === AddonCategory.MACHINE_LEARNING) {
      console.warn("No settings found, skipping");
    } else {
      throw new Error("Node project missing (no pnpm-lock.yaml found)");
    }
  }

  const readmePath = path.join(argv.path, "README.md");
  await minioClient.putObject(
    "addons",
    `${id}/README.md`,
    await readFile(readmePath)
  );

  if (manifest.category === AddonCategory.MACHINE_LEARNING) {
    // eslint-disable-next-line unicorn/prefer-module
    const deploymentRoot = path.resolve(__dirname, "../../../");
    const adapterDestination = path.resolve(
      deploymentRoot,
      "microservices/ml-addon-adapter"
    );
    const environmentFilePath = path.resolve(
      deploymentRoot,
      "deployment/dockercompose/.env"
    );
    const network = "graphpolaris_network"; //Dit kan beter in een .env file waarschijnlijk

    console.log(`Building and deploying ml-${id}-service...`);
    await pexec(
      `cd ${path.join(argv.path, "addon")} && docker build -t ml-${id}-service .`
    );
    await pexec(
      `docker run -d --name ml-${id}-service --network=${network} ml-${id}-service --prod true`
    );

    console.log(`Building and deploying ml-${id}-adapter...`);
    await pexec(
      `cd ${adapterDestination} && docker build -t ml-addon-adapter .`
    );
    await pexec(
      `docker run -d --name ml-${id}-adapter --env-file ${environmentFilePath} --network=${network} -e ADDON_ID=${id} ml-addon-adapter`
    );
  }

  await mongo.close();
}

interface Manifest {
  category: AddonCategory;
  name: string;
  summary: string;
}

const categories = z.nativeEnum(AddonCategory);

const manifestSchema = z.object({
  category: categories,
  name: z.string(),
  summary: z.string()
});

const parseManifest: (data: unknown) => Manifest | null = manifestSchema.parse;
