import { credential, storage } from "firebase-admin";
import * as allModels from "../../src/schema/services";
import { initializeApp } from "firebase-admin/app";
import { serveImageBucket } from "../../src/config";
import { PaginatedService } from "../../src/schema/core/services";
const serviceAccount = require("../../key/service-account.json");
import * as Scalars from "../../src/schema/scalars";
import { writeFile } from "fs";

initializeApp({
  credential: credential.cert(serviceAccount),
  storageBucket: serveImageBucket.value(),
});

// reviews files (type File) and compares this against all references to files (avatarUrl, etc), and determines which ones are unused
(async function auditFiles(isLiveRun = false) {
  // build the set of all known files
  const knownFiles = await allModels.File.getAllSqlRecord({
    select: ["id", "location", "size"],
    where: [],
  });

  const allLocationsSet: Map<string, any> = new Map();

  knownFiles.forEach((knownFile) => {
    allLocationsSet.set(`${knownFile.location}`, {
      size: Number(knownFile.size),
      id: knownFile.id,
    });
  });

  const locationsReferenced: Set<string> = new Set();

  const fileIdsSet = new Set();

  for (const model of Object.values(allModels)) {
    if (model instanceof PaginatedService) {
      for (const [key, typeDef] of Object.entries(
        model.typeDef.definition.fields
      )) {
        if (typeDef.type === allModels.File.typeDefLookup) {
          const results = await model.getAllSqlRecord({
            select: [key],
            where: [],
          });

          results.forEach((ele) => {
            if (Array.isArray(ele[key])) {
              ele[key].forEach((subEle) => {
                fileIdsSet.add(subEle);
              });
            } else if (ele[key]) {
              fileIdsSet.add(ele[key]);
            }
          });

          // console.log(`${model.typename}-${key}`);
        } else if (
          !typeDef.resolver &&
          (typeDef.type === Scalars.imageUrl || typeDef.type === Scalars.url)
        ) {
          const results = await model.getAllSqlRecord({
            select: [key],
            where: [],
          });

          results.forEach((ele) => {
            const url = ele[key];
            if (url) {
              // if key is videoUrl, need to do special processing (for cubing.gg project only)
              if (key === "videoUrl") {
                const urlParts = url.match(/source%2F(.*)\?alt=media(.*)/);
                if (urlParts) {
                  locationsReferenced.add(`${decodeURIComponent(urlParts[1])}`);
                }
              } else {
                const urlParts = url.match(/https\:\/\/cdn\.cubing\.gg\/(.*)/);

                if (urlParts) {
                  locationsReferenced.add(`${decodeURIComponent(urlParts[1])}`);
                }
              }
            }
          });
        }
      }
    }
  }

  if (fileIdsSet.size > 0) {
    const files = await allModels.File.getAllSqlRecord({
      select: ["location"],
      where: [
        {
          field: "id",
          operator: "in",
          value: [...fileIdsSet],
        },
      ],
    });

    files.forEach((file) => {
      locationsReferenced.add(`${file.location}`);
    });
  }

  const filesDeleted: string[] = [];
  const fileIdsToDelete: string[] = [];

  let bytesDeleted = 0;

  // if files is not in files referenced, add to delete queue
  for (const [location, file] of allLocationsSet) {
    if (!locationsReferenced.has(location)) {
      // filesDeleted.push(location);
      fileIdsToDelete.push(file.id);
      bytesDeleted += file.size;
    }
  }

  // get the list of all files in the source bucket
  const bucket = storage().bucket();

  bucket.getFiles({
    autoPaginate: true,
  });

  const [files] = await bucket.getFiles({
    autoPaginate: true,
    // matchGlob: "source/**",
  });

  for (const file of files) {
    const filename = file.metadata.name;
    // check if it is not a directory, and doesn't exist in the knownFiles directory.
    // also make sure it is not in the permanent or source/dev folder
    if (
      !filename.match(/\/$/) &&
      !locationsReferenced.has(filename.replace(/^source\//, ""))
    ) {
      if (filename.match(/^source\/(dev|permanent)\//)) {
        continue;
      }

      if (isLiveRun) await file.delete();
      filesDeleted.push(filename);
    }
  }

  if (isLiveRun && fileIdsToDelete.length > 0) {
    await allModels.File.deleteSqlRecord({
      where: [
        {
          field: "id",
          operator: "in",
          value: fileIdsToDelete,
        },
      ],
    });
  }

  console.log(
    `File Ids Count (system): ${fileIdsSet.size}\nLocationsReferenced: ${locationsReferenced.size}\nFiles deleted (Firebase Storage): ${filesDeleted.length}\nFiles deleted (system): ${fileIdsToDelete.length}\nBytes Deleted: ${bytesDeleted}`
  );

  /*
  // for troubleshooting
  writeFile(
    "scripts/output/out.txt",
    JSON.stringify(
      filesDeleted.map(
        (ele) => `https://cdn.cubing.gg/${encodeURIComponent(ele)}`
      ),
      null,
      2
    ),
    function (err) {
      if (err) console.log(err);
      console.log("Output file written");
    }
  );
  */
})();
