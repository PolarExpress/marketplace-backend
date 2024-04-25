require("dotenv/config");

const { promisify } = require("node:util");
const { resolve } = require("node:path");
const { exec } = require("node:child_process");
const { cp, mkdir } = require("node:fs/promises");

const { MongoClient } = require("mongodb");

(async () => {
  const addons = ["rawjsonvis", "matrixvis"];

  const pexec = promisify(exec);

  const mongo = await MongoClient.connect(process.env.MONGO_URI);
  const db = mongo.db(process.env.MP_DATABASE_NAME);
  const collection = db.collection("addons");

  const author = await db.collection("authors").insertOne({
    userId: ""
  });

  mkdir(resolve(__dirname, "data", "addons"), { recursive: true });

  for (const addon of addons) {
    const document = await collection.insertOne({
      name: addon,
      summary: "",
      icon: "icon.png",
      category: "VISUALISATION",
      authorId: author.insertedId
    });

    const dest = resolve(
      __dirname,
      "data",
      "addons",
      document.insertedId.toString()
    );
    const url = `git@github.com:PolarExpress/${addon}.git`;
    await pexec(`git clone ${url} ${dest}`);

    const icon_path = resolve(__dirname, "icon.png");
    // await cp(icon_path, resolve(dest, "public", "icon.png"));

    await pexec(`cd ${dest} && pnpm i && pnpm build`);
  }

  await mongo.close();
})();
