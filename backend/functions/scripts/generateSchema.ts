import "../src/schema";
import * as fs from "fs";
import { generateSchema } from "../src/helpers/schema";
import { giraffeqlOptions } from "../src/config";

// process nextTick, to allow inputType definitions to load
process.nextTick(() => {
  fs.writeFile(
    "../../schema.ts",
    generateSchema(giraffeqlOptions),
    function (err) {
      if (err) console.log(err);
      console.log("Schema Written > schema.ts");
    }
  );
});
