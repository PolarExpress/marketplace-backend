/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import * as minio from "minio";
import { MongoClient } from "mongodb";
import { exec } from "node:child_process";
import { readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

import environment from "../src/environment";
import { AddonCategory } from "../src/types";

type PublishArguments = {
  url: string;
};

const pexec = promisify(exec);

export async function publish(argv: PublishArguments) {
  const cloneDestination = path.join(tmpdir(), "addon");
  try {
    await rm(cloneDestination, { recursive: true });
  } catch {
    /* empty */
  } finally {
    console.log(`Cloning ${argv.url} to ${cloneDestination}`);
    await pexec(`git clone ${argv.url} ${cloneDestination}`);
  }

  const manifestPath = path.join(cloneDestination, "manifest.json");
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

  const insertedDocument = await collection.insertOne({
    category: manifest.category,
    name: manifest.name,
    summary: manifest.summary
  });
  const id = insertedDocument.insertedId;

  await pexec(`cd ${cloneDestination} && pnpm i && pnpm build`);

  const readmePath = path.join(cloneDestination, "README.md");
  await minioClient.putObject(
    "addons",
    `${id}/README.md`,
    await readFile(readmePath)
  );

  const buildPath = path.join(cloneDestination, "dist");
  for (const file of await readdir(buildPath, { recursive: true })) {
    if (/\.\w+$/.test(file)) {
      console.log(`Uploading ${id}/${file}`);
      const buffer = await readFile(path.join(buildPath, file));
      await minioClient.putObject("addons", `${id}/${file}`, buffer);
    }
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
