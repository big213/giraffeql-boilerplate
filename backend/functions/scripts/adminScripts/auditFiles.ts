import { credential, storage } from "firebase-admin";
import { File } from "../../src/schema/services";
import { initializeApp } from "firebase-admin/app";
import { serveImageBucket } from "../../src/config";
const serviceAccount = require("../../key/service-account.json");

initializeApp({
  credential: credential.cert(serviceAccount),
  storageBucket: serveImageBucket.value(),
});

// reviews all files in the storage bucket and compares against files in the SQL database, determining which ones have been "orphaned"
(async function auditFiles(isLiveRun = false) {
  // build the set of all known files
  const knownFiles = await File.getAllSqlRecord({
    select: ["location"],
    where: [],
  });

  const locationsSet: Set<string> = new Set();

  knownFiles.forEach((knownFile) => {
    locationsSet.add(`source/${knownFile.location}`);
  });

  // get the list of all files in the source bucket
  const bucket = storage().bucket();
  bucket.getFiles({
    autoPaginate: true,
  });

  const [files] = await bucket.getFiles({
    autoPaginate: true,
    // matchGlob: "source/**",
  });

  const filesDeleted: string[] = [];

  for (const file of files) {
    const filename = file.metadata.name;

    if (!filename) continue;

    // check if it is not a directory, and doesn't exist in the knownFiles directory.
    // also make sure it is not in the permanent or source/dev folder
    if (!filename.match(/\/$/) && !locationsSet.has(filename)) {
      if (filename.match(/^source\/(dev|permanent)\//)) {
        continue;
      }

      if (isLiveRun) await file.delete();
      filesDeleted.push(filename);
    }
  }

  console.log(filesDeleted);
})();
