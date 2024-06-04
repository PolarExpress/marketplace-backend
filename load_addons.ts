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
      name: "Centrality",
      repo: "https://github.com/PolarExpress/centrality"
    },
    {
      name: "Community Detection",
      repo: "https://github.com/PolarExpress/community-detection"
    },
    {
      name: "Link Prediction",
      repo: "https://github.com/PolarExpress/link-prediction"
    },
    {
      name: "Shortest Path",
      repo: "https://github.com/PolarExpress/shortest-path"
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

    const dist_path = resolve(destination, "dist");
    for (const file_path of await readdir(dist_path, { recursive: true })) {
      const normalised_file_path = file_path.replace("\\", "/");
      if (normalised_file_path.match(/\.\w+$/)) {
        console.log(`Uploading ${id}/${normalised_file_path}`);
        const buffer = await readFile(resolve(dist_path, file_path));
        minio.putObject("addons", `${id}/${normalised_file_path}`, buffer);
      }
    }
  }

  for (const addon of mlAddons) {
    const document = await collection.insertOne({
      authorId: author.insertedId,
      category: "MACHINE_LEARNING",
      icon: "icon.png",
      name: addon.name,
      summary: ""
    });

    console.log("Inserted document:", document.insertedId);

    const id = document.insertedId.toString();
    const adapterDest = "../ml-addon-adapter";
    const envFilePath = "../../deployment/dockercompose/.env";
    const network = "graphpolaris_network"; //Dit kan beter in een .env file waarschijnlijk

    const serviceDest = resolve(__dirname, "addons", `${id}-service`);
    console.log(`Cloning and building ${addon.name}`);
    await pexec(`git clone ${addon.repo} ${serviceDest}`);
    await pexec(`cd ${serviceDest} && docker build -t ${id}-service .`);
    await pexec(
      `docker run -d --name ${id}-service --network=${network} ${id}-service --prod true`
    );

    await pexec(`cd ${adapterDest} && docker build -t ${id}-adapter .`);
    await pexec(
      `docker run -d --name ${id}-adapter --env-file ${envFilePath} --network=${network} -e ADDON_ID=${id} ${id}-adapter`
    );

    minio.putObject(
      "addons",
      `${id}/README.md`,
      "This is a placeholder README.md file."
    );
  }

  await mongo.close();
})();
