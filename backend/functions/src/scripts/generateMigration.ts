import "../schema";
import { objectTypeDefs } from "giraffeql";
import * as fs from "fs";

export function isKnexNow(ele: unknown) {
  return Object.prototype.toString.call(ele) === "[object object]";
}

const output = generateMigration();

fs.writeFile("migration.ts", output, function (err) {
  if (err) console.log(err);
  console.log("Migration file written > migration.ts");
});

// generates a migration file based on the database schema
function generateMigration(initSubscriptions = true, force = false) {
  const upTablesMap: Map<string, Array<string>> = new Map();

  objectTypeDefs.forEach(async (typeDef, typeKey) => {
    // does every field not have a sql field?
    if (
      Object.values(typeDef.definition.fields).every(
        (typeDefField) => typeDefField.sqlOptions === undefined
      )
    ) {
      // if yes, skip
      return;
    }

    const operationsArray: string[] = [];

    // add to map
    upTablesMap.set(typeDef.definition.name, operationsArray);

    const indicesMap: Map<string, Set<string>> = new Map();

    Object.entries(typeDef.definition.fields).forEach(
      ([fieldName, typeDefField]) => {
        // if has no sqlDefinition, sqlOptions, or if it has specialJoin, skip
        // (special join means it resides on a foreign table)
        if (!typeDefField.sqlOptions || typeDefField.sqlOptions.specialJoin)
          return;

        // set actual field name
        const sqlFieldName = typeDefField.sqlOptions.field ?? fieldName;

        // confirm that the field name has no uppercase, as this won't work with pg
        if (sqlFieldName.match(/[A-Z]/)) {
          throw new Error(
            `SQL fields must not contain uppercase: '${typeDef.definition.name}.${sqlFieldName}'`
          );
        }

        // if ID field and it is an integer, set auto-increment and return
        if (
          sqlFieldName === "id" &&
          typeDefField.sqlOptions.type === "integer"
        ) {
          operationsArray.push("table.increments()");
          return;
        }

        let operationString = `table.${typeDefField.sqlOptions.type}("${sqlFieldName}")`;

        // handle (not) nullable
        operationString += typeDefField.allowNull
          ? `.nullable()`
          : `.notNullable()`;

        // set default value
        if (typeDefField.sqlOptions.defaultValue !== undefined) {
          // add quotes if string, convert any objects to knex.fn.now()
          const defaultValueString = isKnexNow(
            typeDefField.sqlOptions.defaultValue
          )
            ? "knex.fn.now()"
            : JSON.stringify(typeDefField.sqlOptions.defaultValue);

          operationString += `.defaultTo(${defaultValueString})`;
        }

        // assemble unique indices
        if (typeDefField.sqlOptions.unique !== undefined) {
          // if true, apply unique constraint to that column only
          if (typeDefField.sqlOptions.unique === true) {
            operationString += `.unique()`;
          }

          // if string, add to indicesMap
          if (typeof typeDefField.sqlOptions.unique === "string") {
            if (!indicesMap.has(typeDefField.sqlOptions.unique)) {
              indicesMap.set(typeDefField.sqlOptions.unique, new Set());
            }

            const index = indicesMap.get(typeDefField.sqlOptions.unique);
            index!.add(sqlFieldName);
          }
        }

        // if it is "id" field, automatically append the .primary() operator
        if (sqlFieldName === "id") operationString += `.primary()`;

        operationsArray.push(operationString);
      }
    );

    // add indices with names
    indicesMap.forEach((indexFields, indexName) => {
      operationsArray.push(
        `table.unique([${[...indexFields].map((ele) => `"${ele}"`).join(",")}])`
      );
    });
  });

  let upString = "";

  upTablesMap.forEach((value, tablename) => {
    upString += `knex.schema.createTable("${tablename}", function (table) { ${value
      .map((val) => val + ";")
      .join("")} }),\n`;
  });

  return `import * as Knex from "knex";

export async function up(knex: Knex): Promise<void[]> {
  return Promise.all([
    ${upString}
  ])
}

export async function down(knex: Knex): Promise<void[]> {
  return Promise.all([
    ${[...upTablesMap.keys()]
      .map((tablename) => `knex.schema.dropTable("${tablename}")`)
      .join(",")}
  ]);
}
`;
}
