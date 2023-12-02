import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { BaseService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { storage } from "firebase-admin";
import { File } from "../../services";

export class AdminService extends BaseService {
  accessControl: AccessControlMap = {};

  @permissionsCheck("admin")
  async executeAdminFunction({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    return "done";
  }

  /**
   * Should be run on prod database
   */
  async syncFiles() {
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
    const [files] = await bucket.getFiles({
      autoPaginate: true,
      matchGlob: "source/**",
    });

    const filesDeleted: string[] = [];

    for (const file of files) {
      const filename = file.metadata.name;
      // check if it is not a directory, and doesn't exist in the knownFiles directory.
      // also make sure it is not in the permanent or source/dev folder
      if (!filename.match(/\/$/) && !locationsSet.has(filename)) {
        if (filename.match(/^source\/(dev|permanent)\//)) {
          continue;
        }

        // await file.delete();
        filesDeleted.push(filename);
      }
    }

    console.log(filesDeleted);
  }
}
