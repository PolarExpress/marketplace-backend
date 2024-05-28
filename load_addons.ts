/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

require("dotenv/config");
import environment from "./src/environment";

const { promisify } = require("node:util");
const { resolve } = require("node:path");
const { exec } = require("node:child_process");
const { mkdir, readFile, readdir, rm } = require("node:fs/promises");

const { MongoClient, ObjectId } = require("mongodb");
const Minio = require("minio");

(async () => {
  const visAddons = ["rawjsonvis"];
  const mlAddons = [
    {
      id: "ffff00000000000000000000",
      name: "Centrality"
    },
    {
      id: "ffff00000000000000000001",
      name: "Community Detection"
    },
    {
      id: "ffff00000000000000000002",
      name: "Link Prediction"
    },
    {
      id: "ffff00000000000000000003",
      name: "Shortest Path"
    }
  ];

  const pexec = promisify(exec);

  const mongo = await MongoClient.connect(environment.MONGO_URI);
  const database = mongo.db(environment.MP_DATABASE_NAME);
  const collection = database.collection("addons");

  const author = await database.collection("authors").insertOne({
    userId: ""
  });

  const minio = new Minio.Client({
    accessKey: environment.MINIO_ACCESSKEY,
    endPoint: environment.MINIO_ENDPOINT,
    port: environment.MINIO_PORT,
    secretKey: environment.MINIO_SECRETKEY,
    useSSL: false
  });

  const addons_dir = resolve(__dirname, "addons");
  try {
    await rm(addons_dir, { recursive: true });
  } catch {
  } finally {
    await mkdir(addons_dir);
  }

  await collection.deleteMany();

  if (!(await promisify(minio.bucketExists.bind(minio))("addons")))
    await promisify(minio.makeBucket.bind(minio))("addons");

  for (const addon of visAddons) {
    const document = await collection.insertOne({
      authorId: author.insertedId,
      category: "VISUALISATION",
      default: true,
      icon: "icon.png",
      name: addon,
      summary: ""
    });

    const id = document.insertedId.toString();

    const destination = resolve(__dirname, "addons", id);
    console.log(`Cloning and building ${addon}`);
    const url = `git@github.com:PolarExpress/${addon}.git`;
    await pexec(`git clone ${url} ${destination}`);

    const iconPath = resolve(__dirname, "icon.png");
    await pexec(`cd ${destination} && pnpm i && pnpm build`);

    minio.putObject(
      "addons",
      `${id}/README.md`,
      await readFile(resolve(destination, "README.md"))
    );

    const distribution_path = resolve(destination, "dist");
    for (const file of await readdir(distribution_path, { recursive: true })) {
      if (/\.\w+$/.test(file)) {
        console.log(`Uploading ${id}/${file}`);
        const buffer = await readFile(resolve(distribution_path, file));
        minio.putObject("addons", `${id}/${file}`, buffer);
      }
    }
  }

  for (const addon of mlAddons) {
    const document = await collection.insertOne({
      _id: new ObjectId(addon.id),
      authorId: author.insertedId,
      category: "MACHINE_LEARNING",
      icon: "icon.png",
      name: addon.name,
      summary: ""
    });
    console.log("Inserted document:", document.insertedId);
    minio.putObject(
      "addons",
      `${addon.id}/README.md`,
      "This is a placeholder README.md file."
    );
  }

  await mongo.close();
})();
