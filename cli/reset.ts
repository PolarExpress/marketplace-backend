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
import readline from "node:readline";

import environment from "../src/environment";
import { publish } from "./publish";
import { pexec } from "./utils";

const addons = [
  "rawjsonvis",
  "matrixvis",
  "link-prediction",
  "community-detection"
];

interface ResetArgv {
  all: boolean;
}

export async function reset(argv: ResetArgv) {
  if (argv.all) {
    console.error(
      "WARNING: This will delete ALL DATA from the marketplace database and minio. DO NOT RUN THIS ON THE PRODUCTION DATABASE. THIS CANNOT BE UNDONE. "
    );
  } else {
    console.error(
      "WARNING: This will delete ALL addons from the marketplace database and minio. DO NOT RUN THIS ON THE PRODUCTION DATABASE. THIS CANNOT BE UNDONE. "
    );
  }

  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    input.question("Are you sure you want to continue? (y/N) ", answer => {
      resolve(answer);
      input.close();
    });
  });

  if (answer !== "y") {
    console.info("Aborting...");
    return;
  }

  console.log("Cleaning up docker containers...");
  const { stdout } = await pexec("docker ps --format '{{.Names}}'");
  const containers = stdout.split("\n");
  for (const container of containers) {
    if (/^ml-[\dA-Fa-f]{24}-(adapter|service)$/g.test(container)) {
      await pexec(`docker stop ${container} && docker rm ${container}`);
      console.log(`> Removed ${container}`);
    }
  }

  const mongo = await MongoClient.connect(environment.MONGO_URI);
  const database = mongo.db(environment.MP_DATABASE_NAME);
  const collection = database.collection("addons");

  console.log(`Deleting documents from ${environment.MP_DATABASE_NAME}/addons`);
  await collection.deleteMany();

  if (argv.all) {
    console.log(
      `Deleting documents from ${environment.MP_DATABASE_NAME}/authors`
    );
    await database.collection("authors").deleteMany();

    console.log(
      `Deleting documents from ${environment.MP_DATABASE_NAME}/users`
    );
    await database.collection("users").deleteMany();
  }

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
