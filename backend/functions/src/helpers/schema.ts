import { TsSchemaGenerator } from "giraffeql";
import { readFileSync } from "fs";

// parses templateString and replaces with any params
function processTemplate(
  templateString: string,
  params: { [x in string]: string | null } | null | undefined
) {
  let templateStringModified = templateString;

  // if params is provided, attempt to replace the template variables
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // need to escape any quotes, so they don't mess up the JSON
      // const escapedValue = value ? value.replace(/"/g, '\\"') : "";

      const currentRegex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      templateStringModified = templateStringModified.replace(
        currentRegex,
        value ?? ""
      );
    });
  }

  // replace any remaining template variables with "undefined"
  templateStringModified = templateStringModified.replace(
    /{{\s*([^}]*)\s*}}/g,
    "undefined"
  );

  return templateStringModified;
}

export function generateQueryPage(giraffeqlOptions: any) {
  const tsSchemaGenerator = new CustomSchemaGenerator({
    lookupValue: giraffeqlOptions.lookupValue,
    addQueryBuilder: false,
  });
  tsSchemaGenerator.buildSchema();
  tsSchemaGenerator.processSchema();

  const templateFile = readFileSync("src/helpers/templates/query.html", {
    encoding: "utf-8",
  });
  return processTemplate(templateFile, {
    schemaString: `// Start typing here to get hints. Ctrl + space for suggestions.
executeGiraffeql<keyof Root>({
  /* QUERY START */
  getUserPaginator: {
    edges: {
      node: {
        id: true,
        name: true,
      }
    },
    __args: {
      first: 10,
      filterBy: [
        {
          isPublic: {
            eq: true
          }
        }
      ]
    }
  }
  /* QUERY END */  
}).then(data => console.log(data));

/* --------- Do not edit anything below this line --------- */

/* Request Info */
export function executeGiraffeql<Key extends keyof Root>(
  query: GetQuery<Key>
): Promise<GetResponse<Key>> {
  /* REQUEST START */
  // run query to populate this
  return fetch("", {
    method: "post",
    headers: {},
    body: JSON.stringify(query)
  }).then(res => res.json()).then(json => json.data)
  /* REQUEST END */
}

${tsSchemaGenerator.outputSchema()}`,
  });
}

export class CustomSchemaGenerator extends TsSchemaGenerator {
  constructor(giraffeqlOptions) {
    super(giraffeqlOptions);
    this.scaffoldStr += `
type Edge<T> = {
  __typename: Field<string, undefined>;
  node: Field<T, undefined>;
  cursor: Field<string, undefined>;
};

export type FilterByField<T> = {
  eq?: T
  neq?: T
  gt?: T
  lt?: T
  in?: T[]
  nin?: T[]
  regex?: Scalars['regex']
}

export type SortByField<T> = {
  field: T
  desc: boolean
}\n\n`;
  }

  // additional post-processing of the schema
  processSchema() {
    // loop through this.inputTypeTsTypeFields and find places to simplify
    this.inputTypeTsTypeFields.value.forEach((value, key) => {
      // if inputDefName contains FilterByField/, transform it into a FilterByField<T>
      if (key.match(/FilterByField\//)) {
        if (typeof value.value !== "string") {
          const filterByType = value.value.get("eq")?.value;
          if (filterByType) {
            this.inputTypeTsTypeFields.value.set(key, {
              value: `FilterByField<${filterByType}>`,
              isNullable: false,
              isOptional: false,
            });
          }
        }
      }

      // if inputDefName ends with SortByObject, transform it into a SortByField<T>
      if (key.match(/SortByObject$/)) {
        if (typeof value.value !== "string") {
          const sortByType = value.value.get("field")?.value;
          if (sortByType) {
            this.inputTypeTsTypeFields.value.set(key, {
              value: `SortByField<${sortByType}>`,
              isNullable: false,
              isOptional: false,
            });
          }
        }
      }
    });

    // loop through types and find places to simplify
    this.typeDocumentRoot.value.forEach((value, key) => {
      // if typeDefKey ends in Edge, simplify to generic to save space
      if (key.match(/Edge$/)) {
        this.typeDocumentRoot.value.set(key, {
          value: `Edge<${key.replace(/Edge$/, "")}>`,
          isNullable: false,
          isOptional: false,
        });
      }
    });
  }
}
