/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import "dotenv/config";
import * as minio from "minio";
import { MongoClient } from "mongodb";

import environment from "../src/environment";
import { publish } from "./publish";

const addons = [
  "rawjsonvis",
  "matrixvis",
  "semanticsubstratesvis",
  "nodelinkvis",
  "paohvis",
  "tablevis",
  "link-prediction"
];

export async function reset() {
  const mongo = await MongoClient.connect(environment.MONGO_URI);
  const database = mongo.db(environment.MP_DATABASE_NAME);
  const collection = database.collection("addons");

  console.log(`Deleting documents from ${environment.MP_DATABASE_NAME}/addons`);
  await collection.deleteMany();

  const minioClient = new minio.Client({
    accessKey: environment.MINIO_ACCESSKEY,
    endPoint: environment.MINIO_ENDPOINT,
    port: environment.MINIO_PORT,
    secretKey: environment.MINIO_SECRETKEY,
    useSSL: false
  });

  minioClient.listObjects("addons").on("data", async object => {
    console.log(`Deleting addons/${object.prefix}`);
    await minioClient.removeObject("addons", object.prefix!);
  });

  for (const addon of addons) {
    await publish({
      isDefault: true,
      url: `git@github.com:PolarExpress/${addon}.git`
    });
  }

  await mongo.close();
}
