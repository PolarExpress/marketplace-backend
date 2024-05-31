/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import * as minio from "minio";
import { Db, MongoClient } from "mongodb";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

import environment from "../src/environment";
import { AddonCategory } from "../src/types";

interface LocalArgv {
  path: string;
}

const pexec = promisify(exec);

async function createAuthor(database: Db) {
  const authors = database.collection("authors");
  const author = await authors.findOne();
  if (author === null) {
    const insertedDocument = await authors.insertOne({
      userId: ""
    });
    return { _id: insertedDocument.insertedId, userId: "" };
  }
  return author;
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
    name: manifest.name,
    summary: manifest.summary
  });
  const id = insertedDocument.insertedId;

  const nodePath =
    manifest.category === AddonCategory.MACHINE_LEARNING
      ? path.join(argv.path, "settings")
      : argv.path;

  if (existsSync(nodePath)) {
    console.log("Installing dependencies and building project");
    await pexec(`cd ${nodePath} && pnpm i && pnpm build`);

    const buildPath = path.join(argv.path, "dist");
    for (const file of await readdir(buildPath, { recursive: true })) {
      if (/\.\w+$/.test(file)) {
        console.log(`Uploading ${id}/${file}`);
        const buffer = await readFile(path.join(buildPath, file));
        await minioClient.putObject("addons", `${id}/${file}`, buffer);
      }
    }
  } else {
    if (manifest.category === AddonCategory.VISUALISATION) {
      throw new Error("node directory not found in visualization addon");
    }
    console.log("No node project directory found, skipping build");
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

    await pexec(
      `cd ${path.join(argv.path, "addon")} && docker build -t ml-${id}-service .`
    );
    await pexec(
      `docker run -d --name ml-${id}-service --network=${network} ml-${id}-service --prod true`
    );

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
