/*
 * Purpose: execute raw SQL instructions while making use of the Giraffeql schema
 */

import {
  GiraffeqlBaseError,
  ObjectTypeDefinitionField,
  objectTypeDefs,
} from "giraffeql";
import Knex = require("knex");
import { isDev } from "../../../config";
import { executeDBQuery, knex } from "../../../utils/knex";
import { linkDefs } from "../../links";

type FieldInfo = {
  alias: string;
  tableAlias: string;
  finalField: string;
  fieldDef: ObjectTypeDefinitionField;
};

function isSqlWhereObject(
  obj: SqlWhereFieldObject | SqlWhereObject
): obj is SqlWhereObject {
  return (obj as SqlWhereObject).fields !== undefined;
}

// technically this could fail if there happens to be a simple object with "fields" as an array, but this seems unlikely
function isSqlSimpleWhereObject(
  ele: SqlWhereInput
): ele is SqlSimpleWhereObject {
  return !Array.isArray(ele);
}

export type SqlWhereObject = {
  connective?: string;
  fields: (SqlWhereObject | SqlWhereFieldObject)[];
};

export type SqlSimpleWhereObject = {
  [x: string]: unknown;
};

export type SqlWhereInput =
  | SqlSimpleWhereObject
  | (SqlWhereObject | SqlWhereFieldObject)[];

export type SqlOrderByObject = {
  field: string;
  desc?: boolean;
};

export type SqlWhereFieldObject = {
  field: string;
  value: unknown;
  operator?: SqlWhereFieldOperator;
};

export type SqlSelectQueryObject = {
  field: string;
  as?: string;
};

export type SqlWhereFieldOperator =
  | "eq"
  | "neq"
  | "in"
  | "nin"
  | "regex"
  | "like"
  | "gt"
  | "gtornull"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "containsAll";

export type SqlSelectQuery = {
  select: (SqlSelectQueryObject | string)[];
  table: string;
  where: SqlWhereInput;
  groupBy?: string[];
  orderBy?: SqlOrderByObject[];
  offset?: number;
  limit?: number;
  // distinct?: boolean;
  distinctOn?: string[];
  specialParams?: any;
};

export type SqlCountQuery = {
  field?: string; // defaults to "id"
  table: string;
  where: SqlWhereInput;
  limit?: number;
  distinct?: boolean;
  specialParams?: any;
};

export type SqlSumQuery = {
  field: string;
  table: string;
  where: SqlWhereInput;
  limit?: number;
  distinct?: boolean;
  specialParams?: any;
};

export type SqlInsertQuery = {
  table: string;
  fields: {
    [x: string]: any;
  };
  extendFn?: KnexExtendFunction;
};

export type KnexExtendFunction = (knexObject: Knex.QueryBuilder) => void;

export type SqlUpdateQuery = {
  table: string;
  fields: {
    [x: string]: any;
  };
  where: SqlWhereInput;
  extendFn?: KnexExtendFunction;
};

export type SqlDeleteQuery = {
  table: string;
  where: SqlWhereInput;
  extendFn?: KnexExtendFunction;
};

function generateError(err: unknown, fieldPath?: string[]) {
  console.log(err);

  // double check if err is type Error
  let errMessage: string;
  if (err instanceof Error) {
    errMessage = isDev ? err.message : "A SQL error has occurred";
  } else {
    console.log("Invalid error was thrown");
    errMessage = "A SQL error has occurred";
  }

  return new GiraffeqlBaseError({
    message: errMessage,
    fieldPath,
  });
}

function extractFields(whereObject: SqlWhereObject): string[] {
  const fields: string[] = [];
  whereObject.fields.forEach((whereSubObject) => {
    if (isSqlWhereObject(whereSubObject)) {
      fields.push(...extractFields(whereSubObject));
    } else {
      fields.push(whereSubObject.field);
    }
  });

  return fields;
}

type JoinObject = {
  normalJoin?: {
    table: string;
    alias: string;
    field: string; // field from the originating table
    joinField: string; // field to be joined from joinedTable
  };
  specialJoin?: {
    table: string;
    alias: string;
    joinFunction: Function;
  };
  nested: {
    [x: string]: JoinObject;
  };
};

function acquireTableAlias(tableIndexMap: Map<string, number>, table) {
  // increment tableIndexMap
  let currentTableIndex = tableIndexMap.get(table) ?? -1;

  tableIndexMap.set(table, ++currentTableIndex);
  return table + currentTableIndex;
}

function processFields(relevantFields: Set<string>, table: string) {
  // get the typeDef
  const typeDef = objectTypeDefs.get(table);
  if (!typeDef) throw new Error(`TypeDef for ${table} not found`);

  const tableAlias = table + "0";

  // track required joins
  const requiredJoins: { [x: string]: JoinObject } = {};

  // map relevantFields to actual fields
  const fieldInfoMap: Map<string, FieldInfo> = new Map();
  // track table aliases
  const tableIndexMap: Map<string, number> = new Map();
  // set main table to index 0
  tableIndexMap.set(table, 0);

  // go through the relevant fields, build join statements
  relevantFields.forEach((field) => {
    // does the field have a "."? if so, must join
    const fieldParts = field.split(/\./);

    let currentTypeDef = typeDef;
    let currentTableAlias = tableAlias;
    let currentJoinObject = requiredJoins;

    fieldParts.forEach((fieldPart, index) => {
      // does the field have a "/"? if so, must handle differently
      let actualFieldPart = fieldPart;
      if (fieldPart.match(/\//)) {
        const subParts = fieldPart.split(/\//);
        const linkJoinType = subParts[0];

        // ensure the type exists
        const linkService = linkDefs.get(linkJoinType);
        if (!linkService)
          throw new Error(`Link type '${linkJoinType}' does not exist`);

        const linkJoinTypeDef = linkService.typeDef;

        // determine how to join this table, based on the definition
        const joinField = currentTypeDef.definition.name;

        // find the field on the typeDef
        const typeDefField = linkJoinTypeDef.definition.fields[joinField];

        if (!typeDefField)
          throw new Error(
            `Field '${joinField}' does not exist on type '${typeDef.definition.name}'`
          );

        if (!typeDefField.sqlOptions)
          throw new Error(
            `Field '${joinField}' on type '${typeDef.definition.name}' is not a SQL field`
          );

        // set the actualFieldPart to the 2nd part
        actualFieldPart = subParts[1];

        // determine actual join field
        const actualJoinField =
          typeDefField.sqlOptions.specialJoin?.field ??
          typeDefField.sqlOptions.field ??
          joinField;

        if (!actualJoinField)
          throw new Error(
            `Joining type '${linkJoinType}' from type '${joinField}' is not configured`
          );

        // advance the currentTypeDef to the link Join Type Def
        currentTypeDef = linkJoinTypeDef;

        // only proceed IF the ${linkJoinType}/* is not already in the joinObject
        const linkJoinTypeStr = linkJoinType + "/*";
        if (!(linkJoinTypeStr in currentJoinObject)) {
          const linkTableAlias = acquireTableAlias(tableIndexMap, linkJoinType);

          // set and advance the join table
          currentJoinObject[linkJoinTypeStr] = {
            normalJoin: {
              table: linkJoinType,
              alias: linkTableAlias,
              field: "id",
              joinField: actualJoinField,
            },
            nested: {},
          };
        }

        // set currentTableAlias
        currentTableAlias =
          currentJoinObject[linkJoinTypeStr].normalJoin!.alias;

        // advance the join object
        currentJoinObject = currentJoinObject[linkJoinTypeStr].nested;
      }

      // find the field on the currentTypeDef
      const typeDefField = currentTypeDef.definition.fields[actualFieldPart];

      if (!typeDefField)
        throw new Error(
          `Field '${actualFieldPart}' does not exist on type '${currentTypeDef.definition.name}'`
        );

      if (!typeDefField.sqlOptions)
        throw new Error(
          `Field '${actualFieldPart}' on type '${currentTypeDef.definition.name}' is not a SQL field`
        );

      const actualSqlField =
        typeDefField.sqlOptions.specialJoin?.field ??
        typeDefField.sqlOptions.field ??
        actualFieldPart;

      // if no more fields, set the alias
      if (fieldParts.length < index + 2) {
        // if there is a special join, need to add it to the currentJoinObject
        if (typeDefField.sqlOptions.specialJoin) {
          const joinType = typeDefField.sqlOptions.specialJoin.foreignTable;
          const joinTableAlias = acquireTableAlias(
            tableIndexMap,
            typeDefField.sqlOptions.specialJoin.foreignTable
          );
          currentJoinObject[actualFieldPart] = {
            normalJoin: undefined,
            specialJoin: {
              table: joinType,
              alias: joinTableAlias,
              joinFunction: typeDefField.sqlOptions.specialJoin.joinFunction,
            },
            nested: {},
          };

          currentTableAlias = joinTableAlias;
        }

        fieldInfoMap.set(field, {
          alias: currentTableAlias + "." + actualSqlField,
          tableAlias: currentTableAlias,
          fieldDef: typeDefField,
          finalField: actualSqlField,
        });
      } else {
        // if more fields, ensure joinInfo is set. need to join this field
        const joinType = typeDefField.sqlOptions.joinType;
        if (!joinType)
          throw new Error(
            `Field '${actualFieldPart}' is not joinable on type '${currentTypeDef.definition.name}'`
          );

        // ensure the type exists
        const nextTypeDef = objectTypeDefs.get(joinType);
        if (!nextTypeDef)
          throw new Error(`Join type '${joinType}' does not exist`);

        // check requiredJoins to see if is already joined
        let joinTableAlias;
        let specialJoinTableAlias;
        if (currentJoinObject[actualFieldPart]) {
          joinTableAlias = currentJoinObject[actualFieldPart].normalJoin!.alias;
        } else {
          joinTableAlias = acquireTableAlias(tableIndexMap, joinType);

          if (typeDefField.sqlOptions.specialJoin) {
            specialJoinTableAlias = acquireTableAlias(
              tableIndexMap,
              typeDefField.sqlOptions.specialJoin.foreignTable
            );
          }

          // set current field as join field
          currentJoinObject[actualFieldPart] = {
            normalJoin: {
              table: joinType,
              alias: joinTableAlias,
              field: actualSqlField,
              joinField: "id",
            },
            specialJoin: typeDefField.sqlOptions.specialJoin
              ? {
                  table: typeDefField.sqlOptions.specialJoin.foreignTable,
                  alias: specialJoinTableAlias,
                  joinFunction:
                    typeDefField.sqlOptions.specialJoin.joinFunction,
                }
              : undefined,
            nested: {},
          };
        }

        // shift these variables
        currentJoinObject = currentJoinObject[actualFieldPart].nested;
        currentTypeDef = nextTypeDef;
        // currentTableAlias = specialJoinTableAlias ?? joinTableAlias;
        currentTableAlias = joinTableAlias;
      }
    });
  });

  return {
    fieldInfoMap,
    requiredJoins,
    tableIndexMap,
  };
}

function applyWhere(
  knexObject: Knex.QueryBuilder,
  whereObject: SqlWhereObject,
  fieldInfoMap: Map<string, FieldInfo>
) {
  whereObject.fields.forEach((whereSubObject) => {
    if (isSqlWhereObject(whereSubObject)) {
      knexObject[whereObject.connective === "OR" ? "orWhere" : "andWhere"](
        (builder) => {
          applyWhere(builder, whereSubObject, fieldInfoMap);
        }
      );
    } else {
      const operator = whereSubObject.operator ?? "eq";
      const fieldInfo = fieldInfoMap.get(whereSubObject.field)!;
      const getter = fieldInfo.fieldDef.sqlOptions?.getter;
      const bindings: any[] = [];

      let whereSubstatement = getter
        ? getter(fieldInfo.tableAlias, fieldInfo.finalField)
        : `"${fieldInfo.tableAlias}".${fieldInfo.finalField}`;
      switch (operator) {
        case "eq":
          if (whereSubObject.value === null) {
            whereSubstatement += " IS NULL";
          } else {
            whereSubstatement += " = ?";
            bindings.push(whereSubObject.value);
          }
          break;
        case "neq":
          if (whereSubObject.value === null) {
            whereSubstatement += " IS NOT NULL";
          } else {
            whereSubstatement += " IS DISTINCT FROM ?";
            bindings.push(whereSubObject.value);
          }
          break;
        case "gt":
          if (whereSubObject.value === null) {
            // convert "> NULL" to IS NOT NULL
            whereSubstatement += " IS NOT NULL";
          } else {
            // being gt a non-null value is generally understood to not include nulls. however, since > does not include nulls in pg anyway, we don't need to include it
            // whereSubstatement = `(${whereSubstatement} > ? AND ${whereSubstatement} IS NOT NULL)`;
            whereSubstatement += " > ?";
            bindings.push(whereSubObject.value);
          }
          break;
        case "gtornull":
          if (whereSubObject.value === null) {
            // gt or null of null is generally understood to always be true
            whereSubstatement = "TRUE";
          } else {
            whereSubstatement = `(${whereSubstatement} > ? OR ${whereSubstatement} IS NULL)`;
            bindings.push(whereSubObject.value);
          }
          break;
        case "gte":
          if (whereSubObject.value === null) {
            // gte null is generally understood to always be true
            whereSubstatement = "TRUE";
          } else {
            whereSubstatement += " >= ?";
            bindings.push(whereSubObject.value);
          }
          break;
        case "lt":
          if (whereSubObject.value === null) {
            // convert "< NULL" to FALSE.
            whereSubstatement = "FALSE";
          } else {
            // being lt a non-null value is generally understood to include nulls
            whereSubstatement = `(${whereSubstatement} < ? OR ${whereSubstatement} IS NULL)`;
            bindings.push(whereSubObject.value);
          }
          break;
        case "lte":
          if (whereSubObject.value === null) {
            whereSubstatement += " IS NULL";
          } else {
            // generally understood that lte a non-null value would include nulls
            whereSubstatement = `(${whereSubstatement} <= ? OR ${whereSubstatement} IS NULL)`;
            bindings.push(whereSubObject.value);
          }
          break;
        case "in":
        case "nin":
          if (Array.isArray(whereSubObject.value)) {
            // if array is empty, is equivalent of FALSE
            if (whereSubObject.value.length < 1) {
              whereSubstatement = "FALSE";
              throw new Error(
                "Must provide non-empty array for (n)in operators"
              );
            } else {
              const operatorPrefix = operator === "nin" ? "NOT " : "";

              if (whereSubObject.value.every((ele) => ele === null)) {
                // if every element is null, handle specially
                whereSubstatement += ` IS ${operatorPrefix}NULL`;
              } else if (whereSubObject.value.some((ele) => ele === null)) {
                // if trying to do IN (null, otherValue), adjust accordingly
                whereSubstatement = `(${whereSubstatement} ${operatorPrefix}IN (${whereSubObject.value
                  .filter((ele) => ele !== null)
                  .map(() => "?")}) ${
                  operator === "nin" ? "AND" : "OR"
                } ${whereSubstatement} IS ${operatorPrefix}NULL)`;
              } else {
                whereSubstatement += ` ${operatorPrefix}IN (${whereSubObject.value.map(
                  () => "?"
                )})`;
              }

              whereSubObject.value
                .filter((ele) => ele !== null)
                .forEach((ele) => {
                  bindings.push(ele);
                });
            }
          } else {
            throw new Error("Must provide array for in/nin operators");
          }
          break;
        case "regex":
          if (whereSubObject.value instanceof RegExp) {
            // for regex, also need to cast the field as TEXT
            whereSubstatement = "CAST(" + whereSubstatement + " AS TEXT)";
            whereSubstatement += ` ~${
              whereSubObject.value.ignoreCase ? "*" : ""
            } ?`;
            bindings.push(
              whereSubObject.value.toString().replace(/(^\/)|(\/[^\/]*$)/g, "")
            );
          } else {
            throw new Error("Invalid Regex value");
          }
          break;
        case "contains":
          whereSubstatement += ` @> ?::jsonb`;
          bindings.push(JSON.stringify(whereSubObject.value));
          break;
        case "containsAll":
          if (Array.isArray(whereSubObject.value)) {
            // if array is empty, is equivalent of TRUE
            if (whereSubObject.value.length < 1) {
              whereSubstatement = "FALSE";
              throw new Error(
                "Must provide non-empty array for contain operator"
              );
            } else {
              whereSubstatement += ` @> ?::jsonb`;
              bindings.push(JSON.stringify(whereSubObject.value));
            }
          } else {
            throw new Error("Must provide array for contain operator");
          }
          break;
        case "like":
          // not currently supported in the boilerplate. use regex instead.
          if (whereSubObject.value === null) {
            throw new Error("Can't use this operator with null");
          } else {
            whereSubstatement += " LIKE ?";
            bindings.push(whereSubObject.value);
          }
          break;
        default:
          throw new Error("Invalid operator");
      }
      knexObject[
        whereObject.connective === "OR" ? "orWhereRaw" : "andWhereRaw"
      ](whereSubstatement, bindings);
    }
  });
}

function applyJoins(
  knexObject: Knex.QueryBuilder,
  currentJoinObject: { [x: string]: JoinObject },
  parentTableAlias: string,
  specialParams?: any
) {
  for (const field in currentJoinObject) {
    let currentParentTableAlias = parentTableAlias;
    // is there a special join?
    if (currentJoinObject[field].specialJoin) {
      // if so, apply it before doing the left join
      currentJoinObject[field].specialJoin!.joinFunction(
        knexObject,
        parentTableAlias,
        currentJoinObject[field].specialJoin!.alias,
        specialParams
      );

      // shift the currentParentTableAlias after doing special join
      currentParentTableAlias = currentJoinObject[field].specialJoin!.alias;
    }

    const normalJoin = currentJoinObject[field].normalJoin;
    if (normalJoin) {
      knexObject.leftJoin(
        { [normalJoin.alias]: normalJoin.table },
        currentParentTableAlias + "." + normalJoin.field,
        normalJoin.alias + "." + normalJoin.joinField
      );

      currentParentTableAlias = normalJoin.alias;
    }

    if (currentJoinObject[field].nested) {
      applyJoins(
        knexObject,
        currentJoinObject[field].nested,
        currentParentTableAlias,
        specialParams
      );
    }
  }
}

function standardizeWhereObject(
  whereObject: SqlSimpleWhereObject | (SqlWhereObject | SqlWhereFieldObject)[]
) {
  return {
    fields: isSqlSimpleWhereObject(whereObject)
      ? Object.entries(whereObject).reduce((total, [field, value]) => {
          total.push({
            field,
            value,
          });
          return total;
        }, <Array<SqlWhereFieldObject>>[])
      : whereObject,
  };
}

export async function fetchTableRows(
  sqlQuery: SqlSelectQuery,
  fieldPath?: string[]
) {
  try {
    const tableAlias = sqlQuery.table + "0";

    const relevantFields: Set<string> = new Set();

    // gather all of the "known fields" in select, where, groupBy,
    sqlQuery.select.forEach((ele) => {
      relevantFields.add(typeof ele === "string" ? ele : ele.field);
    });

    if (sqlQuery.groupBy)
      sqlQuery.groupBy.forEach((field) => relevantFields.add(field));

    if (sqlQuery.orderBy)
      sqlQuery.orderBy.forEach((ele) => relevantFields.add(ele.field));

    const standardizedWhereObject = standardizeWhereObject(sqlQuery.where);

    extractFields(standardizedWhereObject).forEach((field) =>
      relevantFields.add(field)
    );

    const { fieldInfoMap, requiredJoins, tableIndexMap } = processFields(
      relevantFields,
      sqlQuery.table
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, requiredJoins, tableAlias, sqlQuery.specialParams);

    // build and apply select object
    const knexSelectObject = {};

    sqlQuery.select.forEach((ele) => {
      const fieldInfo = fieldInfoMap.get(
        typeof ele === "string" ? ele : ele.field
      )!;
      // does it have a getter?
      const getter = fieldInfo.fieldDef.sqlOptions?.getter;

      knexSelectObject[typeof ele === "string" ? ele : ele.as ?? ele.field] =
        getter
          ? knex.raw(getter(fieldInfo.tableAlias, fieldInfo.finalField))
          : fieldInfo.alias;
    });

    knexObject.select(knexSelectObject);

    // apply groupBy
    if (sqlQuery.groupBy) {
      sqlQuery.groupBy.forEach((field) => {
        const mappedField = fieldInfoMap.get(field);
        // should always exist
        mappedField && knexObject.groupBy(mappedField.alias);
      });
    }

    // apply orderBy
    if (sqlQuery.orderBy) {
      knexObject.orderByRaw(
        sqlQuery.orderBy
          .map((ele) => {
            const fieldInfo = fieldInfoMap.get(ele.field)!;
            return `"${fieldInfo.tableAlias}".${fieldInfo.finalField} ${
              ele.desc ? "desc NULLS LAST" : "asc NULLS FIRST"
            }`;
          })
          .join(", ")
      );
    }

    // apply where
    if (standardizedWhereObject.fields.length > 0) {
      applyWhere(knexObject, standardizedWhereObject, fieldInfoMap);
    }

    // apply limit
    if (sqlQuery.limit) {
      knexObject.limit(sqlQuery.limit);
    }

    // apply offset
    if (sqlQuery.offset) {
      knexObject.offset(sqlQuery.offset);
    }

    // apply distinct
    if (sqlQuery.distinctOn) {
      knexObject.distinctOn(
        sqlQuery.distinctOn.map((field) => fieldInfoMap.get(field)!.alias)
      );
    }

    return await knexObject;
  } catch (err) {
    throw generateError(err, fieldPath);
  }
}

export async function countTableRows(
  sqlQuery: SqlCountQuery,
  fieldPath?: string[]
) {
  try {
    const tableAlias = sqlQuery.table + "0";

    const relevantFields: Set<string> = new Set();

    const standardizedWhereObject = standardizeWhereObject(sqlQuery.where);

    extractFields(standardizedWhereObject).forEach((field) =>
      relevantFields.add(field)
    );

    const { fieldInfoMap, requiredJoins, tableIndexMap } = processFields(
      relevantFields,
      sqlQuery.table
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, requiredJoins, tableAlias, sqlQuery.specialParams);

    // apply where
    if (standardizedWhereObject.fields.length > 0) {
      applyWhere(knexObject, standardizedWhereObject, fieldInfoMap);
    }

    // apply limit
    if (sqlQuery.limit) {
      knexObject.limit(sqlQuery.limit);
    }

    // apply distinct
    knexObject[sqlQuery.distinct ? "countDistinct" : "count"](
      knex.raw(`"${tableAlias}"."${sqlQuery.field ?? "id"}"`)
    );

    const results = await knexObject;
    return Number(results[0].count);
  } catch (err) {
    throw generateError(err, fieldPath);
  }
}

export async function sumTableRows(
  sqlQuery: SqlSumQuery,
  fieldPath?: string[]
) {
  try {
    const tableAlias = sqlQuery.table + "0";

    const relevantFields: Set<string> = new Set();

    const standardizedWhereObject = standardizeWhereObject(sqlQuery.where);

    extractFields(standardizedWhereObject).forEach((field) =>
      relevantFields.add(field)
    );

    // add the field to be summed
    relevantFields.add(sqlQuery.field);

    const { fieldInfoMap, requiredJoins, tableIndexMap } = processFields(
      relevantFields,
      sqlQuery.table
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, requiredJoins, tableAlias, sqlQuery.specialParams);

    // apply where
    if (standardizedWhereObject.fields.length > 0) {
      applyWhere(knexObject, standardizedWhereObject, fieldInfoMap);
    }

    // apply limit
    if (sqlQuery.limit) {
      knexObject.limit(sqlQuery.limit);
    }

    // this shoud always exist
    const sumFieldInfo = fieldInfoMap.get(sqlQuery.field)!;

    // apply distinct
    knexObject[sqlQuery.distinct ? "sumDistinct" : "sum"](
      knex.raw(`"${sumFieldInfo.tableAlias}"."${sumFieldInfo.finalField}"`)
    );

    const results = await knexObject;
    return Number(results[0].sum);
  } catch (err) {
    throw generateError(err, fieldPath);
  }
}

export async function insertTableRow(
  sqlQuery: SqlInsertQuery,
  fieldPath?: string[]
) {
  try {
    // check if there is a sql setter on the field
    const currentTypeDef = objectTypeDefs.get(sqlQuery.table);
    if (!currentTypeDef) {
      throw new Error(`TypeDef for '${sqlQuery.table}' not found`);
    }

    // handle set fields and convert to actual sql fields, if aliased
    const sqlFields = {};
    for (const fieldname in sqlQuery.fields) {
      const sqlOptions =
        currentTypeDef.definition.fields[fieldname]?.sqlOptions;
      if (!sqlOptions) throw new Error(`'${fieldname}' is not a sql field`);

      sqlFields[sqlOptions.field ?? fieldname] = sqlOptions.parseValue
        ? sqlOptions.parseValue(sqlQuery.fields[fieldname])
        : sqlQuery.fields[fieldname];
    }

    const knexObject = knex(sqlQuery.table).insert(sqlFields).returning(["id"]);

    sqlQuery.extendFn && sqlQuery.extendFn(knexObject);

    return await knexObject;
  } catch (err) {
    throw generateError(err, fieldPath);
  }
}

export async function updateTableRow(
  sqlQuery: SqlUpdateQuery,
  fieldPath?: string[]
) {
  try {
    const tableAlias = sqlQuery.table + "0";

    const relevantFields: Set<string> = new Set();

    const standardizedWhereObject = standardizeWhereObject(sqlQuery.where);

    extractFields(standardizedWhereObject).forEach((field) =>
      relevantFields.add(field)
    );

    const { fieldInfoMap, requiredJoins, tableIndexMap } = processFields(
      relevantFields,
      sqlQuery.table
    );

    // check if there is a sql setter on the field
    const currentTypeDef = objectTypeDefs.get(sqlQuery.table);
    if (!currentTypeDef) {
      throw new Error(`TypeDef for '${sqlQuery.table}' not found`);
    }

    // handle set fields and convert to actual sql fields, if aliased
    const sqlFields = {};
    for (const fieldname in sqlQuery.fields) {
      const sqlOptions =
        currentTypeDef.definition.fields[fieldname]?.sqlOptions;
      if (!sqlOptions) throw new Error(`'${fieldname}' is not a sql field`);

      sqlFields[sqlOptions.field ?? fieldname] = sqlOptions.parseValue
        ? sqlOptions.parseValue(sqlQuery.fields[fieldname])
        : sqlQuery.fields[fieldname];
    }

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, requiredJoins, tableAlias);

    // apply where
    if (standardizedWhereObject.fields.length > 0) {
      applyWhere(knexObject, standardizedWhereObject, fieldInfoMap);
    }

    sqlQuery.extendFn && sqlQuery.extendFn(knexObject);

    return await knexObject.update(sqlFields);
  } catch (err) {
    throw generateError(err, fieldPath);
  }
}

export async function deleteTableRow(
  sqlQuery: SqlDeleteQuery,
  fieldPath?: string[]
) {
  try {
    const tableAlias = sqlQuery.table + "0";

    const relevantFields: Set<string> = new Set();

    const standardizedWhereObject = standardizeWhereObject(sqlQuery.where);

    extractFields(standardizedWhereObject).forEach((field) =>
      relevantFields.add(field)
    );

    const { fieldInfoMap, requiredJoins, tableIndexMap } = processFields(
      relevantFields,
      sqlQuery.table
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, requiredJoins, tableAlias);

    // apply where
    if (standardizedWhereObject.fields.length > 0) {
      applyWhere(knexObject, standardizedWhereObject, fieldInfoMap);
    }

    sqlQuery.extendFn && sqlQuery.extendFn(knexObject);

    return await knexObject.delete();
  } catch (err) {
    throw generateError(err, fieldPath);
  }
}

export { executeDBQuery };
