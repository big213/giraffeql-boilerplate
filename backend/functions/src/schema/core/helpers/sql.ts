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
import { SpecialJoinFunction } from "../../../types";
import { executeDBQuery, knex } from "../../../utils/knex";
import { linkDefs } from "../../links";
import { generateSqlSingleFieldObject } from "./sqlHelper";

function isSqlWhereObject(
  obj: SqlWhereFieldObject | SqlWhereObject
): obj is SqlWhereObject {
  return (obj as SqlWhereObject).fields !== undefined;
}

export type SqlWhereObject = {
  connective?: string;
  fields: (SqlWhereObject | SqlWhereFieldObject)[];
};

export type SqlOrderByObject = {
  field: SqlSingleFieldObject | string;
  desc?: boolean;
};

export type SqlWhereFieldObject = {
  field: SqlSingleFieldObject | string;
  value: any;
  operator?: SqlWhereFieldOperator;
};

type FieldsObjectMap = {
  fields: {
    [x: string]: FieldsObjectMap & {
      field: string;
      args?: any;
      fieldInfo?: {
        tableAlias: string;
        fieldDef: ObjectTypeDefinitionField;
      };
    };
  };
};

/* export type SqlSelectQueryObject = {
  [x: string]: {
    fields: SqlSelectQueryObject;
    field: string;
    args?: any;
    as?: string;
  };
}; */

export type SqlSelectQueryObject = {
  [x: string]: SqlSingleFieldObject;
};

// for groupBy, orderBy
export type SqlSingleFieldObject = {
  field: string;
  args?: any;
  nested?: SqlSingleFieldObject | null;
};

// for select
export type SqlMultipleFieldObject = {
  fields: {
    [x: string]: SqlMultipleFieldObject | true;
  };
  args?: any;
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

export type SqlSimpleSelectObject = {
  field: string;
  as?: string;
  args?: any;
};

export type SqlSimpleOrderByObject = {
  field: string;
  desc?: boolean;
};

export type SqlSelectQuery = {
  select: SqlSelectQueryObject | (SqlSimpleSelectObject | string)[];
  table: string;
  where: SqlWhereInput;
  groupBy?: (SqlSingleFieldObject | string)[];
  orderBy?: SqlOrderByObject[];
  offset?: number;
  limit?: number;
  distinctOn?: (SqlSingleFieldObject | string)[];
  specialParams?: any;
  transaction?: Knex.Transaction;
};

export type SqlCountQuery = {
  field?: string; // defaults to "id"
  table: string;
  where: SqlWhereInput;
  limit?: number;
  distinct?: boolean;
  specialParams?: any;
  transaction?: Knex.Transaction;
};

export type SqlSumQuery = {
  field: SqlSingleFieldObject | string;
  table: string;
  where: SqlWhereInput;
  limit?: number;
  distinct?: boolean;
  specialParams?: any;
  transaction?: Knex.Transaction;
};

export type SqlRawQuery = {
  table: string;
  where: SqlWhereInput;
  limit?: number;
  distinct?: boolean;
  specialParams?: any;
  transaction?: Knex.Transaction;
};

export type SqlInsertQuery = {
  table: string;
  fields: {
    [x: string]: any;
  };
  extendFn?: KnexExtendFunction;
  transaction?: Knex.Transaction;
};

export type KnexExtendFunction = (knexObject: Knex.QueryBuilder) => void;

export type SqlUpdateQuery = {
  table: string;
  fields: {
    [x: string]: any;
  };
  where: SqlWhereInput;
  extendFn?: KnexExtendFunction;
  transaction?: Knex.Transaction;
};

export type SqlIncrementQuery = {
  table: string;
  fields: {
    [x: string]: number;
  };
  where: SqlWhereInput;
  extendFn?: KnexExtendFunction;
  transaction?: Knex.Transaction;
};

export type SqlDeleteQuery = {
  table: string;
  where: SqlWhereInput;
  extendFn?: KnexExtendFunction;
  transaction?: Knex.Transaction;
};

export type SqlSimpleWhereObject = {
  [x: string]: unknown;
};

export type SqlWhereInput =
  | SqlSimpleWhereObject
  | (SqlWhereObject | SqlWhereFieldObject)[];

function handleSqlError(err: unknown) {
  // double check if err is type Error
  let errMessage: string;
  if (err instanceof Error) {
    errMessage = isDev ? err.message : "A SQL error has occurred";
    // if in dev mode, also log the SQL error
    if (isDev) {
      console.log(err);
    }
  } else {
    console.log("Invalid error was thrown");
    errMessage = "A SQL error has occurred";
  }

  return new GiraffeqlBaseError({
    message: errMessage,
  });
}

type JoinObjectMap = {
  [x: string]: JoinObject;
};

type JoinObject = {
  normalJoin?: {
    table: string; // the table to join
    alias: string; // the alias of the table to join
    parentTableField: string; // field on the previous parent table
    field: string; // field to be joined from joinedTable
  };
  specialJoin?: SpecialJoinDefinition;
  nested: JoinObjectMap;
};

export type SpecialJoinDefinition = {
  table: string;
  alias: string;
  joinFunction: SpecialJoinFunction;
  args: any;
};

// technically this could fail if there happens to be a simple object with "fields" as an array, but this seems unlikely
function isSqlSimpleWhereObject(
  ele: SqlWhereInput
): ele is SqlSimpleWhereObject {
  return !Array.isArray(ele);
}

function standardizeSqlSingleSelectField(input: SqlSingleFieldObject | string) {
  return typeof input === "string"
    ? generateSqlSingleFieldObject(input)
    : input;
}

function standardizeWhereInput(
  whereObject: SqlSimpleWhereObject | (SqlWhereObject | SqlWhereFieldObject)[]
) {
  return {
    fields: isSqlSimpleWhereObject(whereObject)
      ? Object.entries(whereObject).reduce((total, [field, value]) => {
          total.push({
            field: generateSqlSingleFieldObject(field),
            value,
          });
          return total;
        }, <Array<SqlWhereFieldObject>>[])
      : whereObject,
  };
}

export function standardizeSelectInput(
  selectInput: SqlSelectQueryObject | (SqlSimpleSelectObject | string)[]
) {
  if (Array.isArray(selectInput)) {
    // is array, need to process
    // standardize all to SqlSimpleSelectObject
    return selectInput
      .map((ele) => (typeof ele === "string" ? { field: ele } : ele))
      .reduce((selectObject, simpleSelectObject) => {
        selectObject[simpleSelectObject.as ?? simpleSelectObject.field] =
          generateSqlSingleFieldObject(
            simpleSelectObject.field,
            simpleSelectObject.args
          );
        return selectObject;
      }, {});
  } else {
    return selectInput;
  }
}

function acquireTableAlias(
  table: string,
  tableIndexMap: Map<string, number> = new Map()
) {
  // increment tableIndexMap
  let currentTableIndex = tableIndexMap.get(table) ?? -1;

  currentTableIndex += 1;
  tableIndexMap.set(table, currentTableIndex);

  return {
    tableAlias: table + currentTableIndex,
    tableIndexMap,
  };
}

// retrives the field alias from the fieldsObjectMap given the singleFieldObject
function getSingleFieldAlias(
  fieldsObjectMap: FieldsObjectMap,
  singleFieldObject: SqlSingleFieldObject,
  { ignoreGetter = false, wrapTableAlias = true } = {}
) {
  const keyName = generateKeyName(
    singleFieldObject.field,
    singleFieldObject.args
  );

  if (singleFieldObject.nested) {
    // nested, go deeper
    return getSingleFieldAlias(
      fieldsObjectMap.fields[keyName],
      singleFieldObject.nested,
      {
        ignoreGetter,
        wrapTableAlias,
      }
    );
  } else {
    // no nested, return. but check if there is a sql getter
    const fieldInfo = fieldsObjectMap.fields[keyName].fieldInfo!;
    const sqlField = fieldInfo.fieldDef.sqlOptions?.field!;
    const getter = fieldInfo.fieldDef.sqlOptions?.getter;

    const tableAlias = wrapTableAlias
      ? `"${fieldInfo.tableAlias}"`
      : fieldInfo.tableAlias;

    return getter && !ignoreGetter
      ? getter(fieldInfo.tableAlias, sqlField)
      : `${tableAlias}.${sqlField}`;
  }
}

function processJoinFields(
  table: string,
  tableAlias: string,
  fieldsObjectMap: FieldsObjectMap,
  tableIndexMap: Map<string, number>,
  joinObjectMap: JoinObjectMap = {}
) {
  if (Object.keys(fieldsObjectMap.fields).length) {
    // get the typeDef of the table
    const typeDef = objectTypeDefs.get(table);
    if (!typeDef) throw new Error(`TypeDef for ${table} not found`);

    const requiredJoinKeys: Set<string> = new Set();

    // loop through the fieldsObjectMap.fields
    Object.entries(fieldsObjectMap.fields).forEach(([keyName, nestedValue]) => {
      // does the field have a "/"? if so, handle differently
      if (nestedValue.field.match(/\//)) {
        // ensure it matches the pattern `table/field`
        const fieldParts = nestedValue.field.split(/\//).filter((e) => e);

        if (fieldParts.length !== 2) {
          throw new Error(`Misconfigured compound (*/*) field`);
        }

        const [linkTable, linkTableField] = fieldParts;

        // ensure the link table exists
        const linkService = linkDefs.get(linkTable);

        if (!linkService) {
          throw new Error(`Link type '${linkTable}' does not exist`);
        }

        // the actual join field is the *other* field
        // currently works properly if there are exactly 2 fields in the link
        const actualJoinField = Object.keys(
          linkService.servicesObjectMap
        ).filter((ele) => ele !== linkTableField)[0];

        const linkJoinTypeDef = linkService.typeDef;

        // find the field on the typeDef
        const typeDefField = linkJoinTypeDef.definition.fields[linkTableField];

        if (!typeDefField) {
          throw new Error(
            `Field '${linkTableField}' does not exist on type '${linkJoinTypeDef.definition.name}'`
          );
        }

        if (!typeDefField.sqlOptions) {
          throw new Error(
            `Field '${linkTableField}' on type '${linkJoinTypeDef.definition.name}' is not a SQL field`
          );
        }

        // if there's no nested fields, do not apply join logic, cut short.
        if (!Object.keys(nestedValue.fields).length) {
          // populate the fieldDef and tableAlias
          fieldsObjectMap.fields[keyName].fieldInfo = {
            fieldDef: typeDefField,
            // tableAlias should always be index 0 because only one join is allowed per link type per level
            tableAlias: `${linkTable}0`,
          };

          // add the linkTable to check later
          requiredJoinKeys.add(`${linkTable}/*`);

          return;
        }

        const nestedJoinType = typeDefField.sqlOptions.joinType!;

        const { tableAlias: joinTableAlias } = acquireTableAlias(
          linkTable,
          tableIndexMap
        );

        const { tableAlias: nestedJoinTableAlias } = acquireTableAlias(
          nestedJoinType,
          tableIndexMap
        );

        // add the keyname with a special name, but check to make sure it hasn't already been joined at this level
        if (joinObjectMap[`${linkTable}/*`]) {
          // if this link join already exists on this level, throw an error. only one join allowed per link type per level
          throw new Error(`${linkTable} link type already joined`);
        }

        joinObjectMap[`${linkTable}/*`] = {
          normalJoin: {
            table: linkTable,
            alias: joinTableAlias,
            parentTableField: "id",
            field: actualJoinField,
          },
          // automatically apply the nested field
          nested: {
            [linkTableField]: {
              normalJoin: {
                table: nestedJoinType,
                alias: nestedJoinTableAlias,
                parentTableField: linkTableField,
                field: "id",
              },
              nested: {},
            },
          },
        };

        // if there are additional fields that need to be joined inside the value.fields, need to drill down and join those as well
        processJoinFields(
          nestedJoinType,
          nestedJoinTableAlias,
          nestedValue,
          tableIndexMap,
          joinObjectMap[`${linkTable}/*`].nested[linkTableField].nested
        );
      } else {
        // get the typeDefField
        const typeDefField = typeDef.definition.fields[nestedValue.field];

        if (!typeDefField) {
          throw new Error(
            `Field: '${nestedValue.field}' does not exist on type: '${typeDef.definition.name}'`
          );
        }

        if (!typeDefField.sqlOptions) {
          throw new Error(`Misconfigured SQL field`);
        }

        // populate the fieldDef and tableAlias
        fieldsObjectMap.fields[keyName].fieldInfo = {
          fieldDef: typeDefField,
          tableAlias: tableAlias,
        };

        // if the value is object with more fields, need to join
        if (Object.keys(nestedValue.fields).length) {
          // set an entry in the joinObjectMap
          const joinTable = typeDefField.sqlOptions.joinType;

          if (!joinTable) {
            throw new Error(
              `Field '${nestedValue.field}' is not joinable on type '${typeDef.definition.name}'`
            );
          }

          const { tableAlias: joinTableAlias } = acquireTableAlias(
            joinTable,
            tableIndexMap
          );

          // if there is a specialJoin function, handle differently
          if (typeDefField.sqlOptions?.specialJoin) {
            joinObjectMap[keyName] = {
              specialJoin: {
                table: joinTable,
                alias: joinTableAlias,
                joinFunction: typeDefField.sqlOptions.specialJoin.joinFunction,
                args: nestedValue.args,
              },
              nested: {},
            };
          } else {
            // otherwise, handle it like a normal join
            joinObjectMap[keyName] = {
              normalJoin: {
                table: joinTable,
                alias: joinTableAlias,
                parentTableField: typeDefField.sqlOptions.field!,
                field: "id",
              },
              nested: {},
            };
          }
          // if there are additional fields that need to be joined inside the value.fields, need to drill down and join those as well
          processJoinFields(
            joinTable,
            joinTableAlias,
            nestedValue,
            tableIndexMap,
            joinObjectMap[keyName].nested
          );
        }
      }
    });

    requiredJoinKeys.forEach((joinKey) => {
      if (!joinObjectMap[joinKey]) {
        throw new Error(`Required join key not present: '${joinKey}'`);
      }
    });
  }

  return {
    fieldsObjectMap,
    joinObjectMap,
  };
}

function applyKnexWhere(
  knexObject: Knex.QueryBuilder,
  whereObject: SqlWhereObject,
  fieldsObjectMap: FieldsObjectMap
) {
  whereObject.fields.forEach((whereSubObject) => {
    if (isSqlWhereObject(whereSubObject)) {
      knexObject[whereObject.connective === "OR" ? "orWhere" : "andWhere"](
        (builder) => {
          applyKnexWhere(builder, whereSubObject, fieldsObjectMap);
        }
      );
    } else {
      const operator = whereSubObject.operator ?? "eq";
      const bindings: any[] = [];
      const fieldAlias = getSingleFieldAlias(
        fieldsObjectMap,
        standardizeSqlSingleSelectField(whereSubObject.field)
      );

      let whereSubstatement = fieldAlias;
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
      currentJoinObject[field].specialJoin!.joinFunction({
        knexObject,
        parentTableAlias,
        joinTableAlias: currentJoinObject[field].specialJoin!.alias,
        specialParams,
        specialJoinDefinition: currentJoinObject[field].specialJoin!,
      });

      // shift the currentParentTableAlias after doing special join
      currentParentTableAlias = currentJoinObject[field].specialJoin!.alias;
    }

    const normalJoin = currentJoinObject[field].normalJoin;
    if (normalJoin) {
      knexObject.leftJoin(
        { [normalJoin.alias]: normalJoin.table },
        currentParentTableAlias + "." + normalJoin.parentTableField,
        normalJoin.alias + "." + normalJoin.field
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

// helper function to generate keynames for SqlSelectQueryObject
function generateKeyName(key: string, args: any) {
  return `${key}${args ? `-${JSON.stringify(args)}` : ""}`;
}

function processSingleFieldObject(
  singleFieldObject: SqlSingleFieldObject,
  fieldsObjectMap: FieldsObjectMap
) {
  // if not exists, initialize
  const keyName = generateKeyName(
    singleFieldObject.field,
    singleFieldObject.args
  );
  if (!fieldsObjectMap.fields[keyName]) {
    fieldsObjectMap.fields[keyName] = {
      fields: {},
      field: singleFieldObject.field,
      args: singleFieldObject.args,
    };
  }

  // if nested, process the nested field
  if (singleFieldObject.nested) {
    processSingleFieldObject(
      singleFieldObject.nested,
      fieldsObjectMap.fields[keyName]
    );
  }

  return fieldsObjectMap;
}

function processWhereObject(
  whereObject: SqlWhereObject,
  fieldsObjectMap: FieldsObjectMap = { fields: {} }
) {
  whereObject.fields.forEach((whereSubObject) => {
    if (isSqlWhereObject(whereSubObject)) {
      processWhereObject(whereSubObject, fieldsObjectMap);
    } else {
      const singleSelectField = standardizeSqlSingleSelectField(
        whereSubObject.field
      );

      processSingleFieldObject(singleSelectField, fieldsObjectMap);
    }
  });

  return fieldsObjectMap;
}

export async function fetchTableRows(sqlQuery: SqlSelectQuery) {
  try {
    // acquire alias of the first table
    const { tableIndexMap, tableAlias } = acquireTableAlias(sqlQuery.table);

    const standardizedSelectObject = standardizeSelectInput(sqlQuery.select);

    // initialize fieldsObjectMap
    const fieldsObjectMap = { fields: {} };

    // gather all of the known fields in select, insert them into the fieldsObjectMap
    Object.entries(standardizedSelectObject).forEach(
      ([_alias, singleFieldObject]) => {
        processSingleFieldObject(singleFieldObject, fieldsObjectMap);
      }
    );

    // process groupBy
    if (sqlQuery.groupBy) {
      sqlQuery.groupBy.forEach((ele) =>
        processSingleFieldObject(
          standardizeSqlSingleSelectField(ele),
          fieldsObjectMap
        )
      );
    }

    // process orderBy
    if (sqlQuery.orderBy) {
      sqlQuery.orderBy.forEach((orderByObject) =>
        processSingleFieldObject(
          standardizeSqlSingleSelectField(orderByObject.field),
          fieldsObjectMap
        )
      );
    }

    // standardize the where input
    const standardizedWhereObject = standardizeWhereInput(sqlQuery.where);

    // process the where
    processWhereObject(standardizedWhereObject, fieldsObjectMap);

    // finalize processing of fields
    const { joinObjectMap } = processJoinFields(
      sqlQuery.table,
      tableAlias,
      fieldsObjectMap,
      tableIndexMap
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, joinObjectMap, tableAlias, sqlQuery.specialParams);

    // build and apply select object
    const knexSelectObject = {};

    Object.entries(standardizedSelectObject).forEach(
      ([alias, singleFieldObject]) => {
        knexSelectObject[alias] = knex.raw(
          getSingleFieldAlias(fieldsObjectMap, singleFieldObject)
        );
      }
    );

    knexObject.select(knexSelectObject);

    // apply groupBy
    if (sqlQuery.groupBy) {
      sqlQuery.groupBy.forEach((ele) => {
        // should always exist
        knexObject.groupBy(
          knex.raw(
            getSingleFieldAlias(
              fieldsObjectMap,
              standardizeSqlSingleSelectField(ele)
            )
          )
        );
      });
    }

    // apply orderBy
    if (sqlQuery.orderBy) {
      knexObject.orderByRaw(
        sqlQuery.orderBy
          .map((orderByObject) => {
            return `${getSingleFieldAlias(
              fieldsObjectMap,
              standardizeSqlSingleSelectField(orderByObject.field),
              { ignoreGetter: true }
            )} ${orderByObject.desc ? "desc NULLS LAST" : "asc NULLS FIRST"}`;
          })
          .join(", ")
      );
    }

    // apply where, if any fields
    if (standardizedWhereObject.fields.length > 0) {
      applyKnexWhere(knexObject, standardizedWhereObject, fieldsObjectMap);
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
        sqlQuery.distinctOn.map((ele) =>
          getSingleFieldAlias(
            fieldsObjectMap,
            standardizeSqlSingleSelectField(ele),
            {
              ignoreGetter: true,
              wrapTableAlias: false, // not wrapping table alias because knex will do it for us here
            }
          )
        )
      );
    }

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    return await knexObject;
  } catch (err) {
    throw handleSqlError(err);
  }
}

export async function countTableRows(sqlQuery: SqlCountQuery) {
  try {
    // acquire alias of the first table
    const { tableIndexMap, tableAlias } = acquireTableAlias(sqlQuery.table);

    // standardize the where input
    const standardizedWhereObject = standardizeWhereInput(sqlQuery.where);

    const fieldsObjectMap = processWhereObject(standardizedWhereObject);

    // finalize processing of fields
    const { joinObjectMap } = processJoinFields(
      sqlQuery.table,
      tableAlias,
      fieldsObjectMap,
      tableIndexMap
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, joinObjectMap, tableAlias, sqlQuery.specialParams);

    // apply where, if any fields
    if (standardizedWhereObject.fields.length > 0) {
      applyKnexWhere(knexObject, standardizedWhereObject, fieldsObjectMap);
    }

    // apply limit
    if (sqlQuery.limit) {
      knexObject.limit(sqlQuery.limit);
    }

    // apply distinct
    knexObject[sqlQuery.distinct ? "countDistinct" : "count"](
      knex.raw(`"${tableAlias}"."${sqlQuery.field ?? "id"}"`)
    );

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    const results = await knexObject;
    return Number(results[0].count);
  } catch (err) {
    throw handleSqlError(err);
  }
}

export async function sumTableRows(sqlQuery: SqlSumQuery) {
  try {
    // acquire alias of the first table
    const { tableIndexMap, tableAlias } = acquireTableAlias(sqlQuery.table);

    // standardize the where input
    const standardizedWhereObject = standardizeWhereInput(sqlQuery.where);

    const fieldsObjectMap = processWhereObject(standardizedWhereObject);

    // add the field to be summed
    processSingleFieldObject(
      standardizeSqlSingleSelectField(sqlQuery.field),
      fieldsObjectMap
    );

    // finalize processing of fields
    const { joinObjectMap } = processJoinFields(
      sqlQuery.table,
      tableAlias,
      fieldsObjectMap,
      tableIndexMap
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, joinObjectMap, tableAlias, sqlQuery.specialParams);

    // apply where, if any fields
    if (standardizedWhereObject.fields.length > 0) {
      applyKnexWhere(knexObject, standardizedWhereObject, fieldsObjectMap);
    }

    // apply limit
    if (sqlQuery.limit) {
      knexObject.limit(sqlQuery.limit);
    }

    // apply distinct
    knexObject[sqlQuery.distinct ? "sumDistinct" : "sum"](
      knex.raw(
        getSingleFieldAlias(
          fieldsObjectMap,
          standardizeSqlSingleSelectField(sqlQuery.field)
        )
      )
    );

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    const results = await knexObject;
    return Number(results[0].sum);
  } catch (err) {
    throw handleSqlError(err);
  }
}

export function getRawKnexObject(sqlQuery: SqlRawQuery) {
  try {
    // acquire alias of the first table
    const { tableIndexMap, tableAlias } = acquireTableAlias(sqlQuery.table);

    // standardize the where input
    const standardizedWhereObject = standardizeWhereInput(sqlQuery.where);

    const fieldsObjectMap = processWhereObject(standardizedWhereObject);

    // finalize processing of fields
    const { joinObjectMap } = processJoinFields(
      sqlQuery.table,
      tableAlias,
      fieldsObjectMap,
      tableIndexMap
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, joinObjectMap, tableAlias, sqlQuery.specialParams);

    // apply where, if any fields
    if (standardizedWhereObject.fields.length > 0) {
      applyKnexWhere(knexObject, standardizedWhereObject, fieldsObjectMap);
    }

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    return knexObject;
  } catch (err) {
    throw handleSqlError(err);
  }
}

export async function insertTableRow(sqlQuery: SqlInsertQuery) {
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

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    sqlQuery.extendFn && sqlQuery.extendFn(knexObject);

    return await knexObject;
  } catch (err) {
    throw handleSqlError(err);
  }
}

export async function updateTableRow(sqlQuery: SqlUpdateQuery) {
  try {
    // acquire alias of the first table
    const { tableIndexMap, tableAlias } = acquireTableAlias(sqlQuery.table);

    // standardize the where input
    const standardizedWhereObject = standardizeWhereInput(sqlQuery.where);

    const fieldsObjectMap = processWhereObject(standardizedWhereObject);

    // finalize processing of fields
    const { joinObjectMap } = processJoinFields(
      sqlQuery.table,
      tableAlias,
      fieldsObjectMap,
      tableIndexMap
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

    if (Object.keys(sqlFields).length < 1) {
      throw new Error("No fields to update");
    }

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, joinObjectMap, tableAlias);

    // apply where, if any fields
    if (standardizedWhereObject.fields.length > 0) {
      applyKnexWhere(knexObject, standardizedWhereObject, fieldsObjectMap);
    }

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    sqlQuery.extendFn && sqlQuery.extendFn(knexObject);

    return await knexObject.update(sqlFields);
  } catch (err) {
    throw handleSqlError(err);
  }
}

export async function incrementTableRow(sqlQuery: SqlIncrementQuery) {
  try {
    // acquire alias of the first table
    const { tableIndexMap, tableAlias } = acquireTableAlias(sqlQuery.table);

    // standardize the where input
    const standardizedWhereObject = standardizeWhereInput(sqlQuery.where);

    const fieldsObjectMap = processWhereObject(standardizedWhereObject);

    // finalize processing of fields
    const { joinObjectMap } = processJoinFields(
      sqlQuery.table,
      tableAlias,
      fieldsObjectMap,
      tableIndexMap
    );

    // check if there is a sql setter on the field
    const currentTypeDef = objectTypeDefs.get(sqlQuery.table);
    if (!currentTypeDef) {
      throw new Error(`TypeDef for '${sqlQuery.table}' not found`);
    }

    // handle set fields and convert to actual sql fields, if aliased
    const sqlFields: { [x: string]: number } = {};
    for (const fieldname in sqlQuery.fields) {
      const sqlOptions =
        currentTypeDef.definition.fields[fieldname]?.sqlOptions;
      if (!sqlOptions) throw new Error(`'${fieldname}' is not a sql field`);

      sqlFields[sqlOptions.field ?? fieldname] = sqlQuery.fields[fieldname];
    }

    if (Object.keys(sqlFields).length < 1) {
      throw new Error("No fields to increment");
    }

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, joinObjectMap, tableAlias);

    // apply where, if any fields
    if (standardizedWhereObject.fields.length > 0) {
      applyKnexWhere(knexObject, standardizedWhereObject, fieldsObjectMap);
    }

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    sqlQuery.extendFn && sqlQuery.extendFn(knexObject);

    for (const field in sqlFields) {
      // due to some weird glitch, increment will be called twice per field so we're just gonna return it here. only the very first field will be incremented
      return await knexObject.increment(field, sqlFields[field]);
    }

    return knexObject;
  } catch (err) {
    throw handleSqlError(err);
  }
}

export async function deleteTableRow(sqlQuery: SqlDeleteQuery) {
  try {
    // acquire alias of the first table
    const { tableIndexMap, tableAlias } = acquireTableAlias(sqlQuery.table);

    // standardize the where input
    const standardizedWhereObject = standardizeWhereInput(sqlQuery.where);

    const fieldsObjectMap = processWhereObject(standardizedWhereObject);

    // finalize processing of fields
    const { joinObjectMap } = processJoinFields(
      sqlQuery.table,
      tableAlias,
      fieldsObjectMap,
      tableIndexMap
    );

    const knexObject = knex.from({ [tableAlias]: sqlQuery.table });

    // apply the joins
    applyJoins(knexObject, joinObjectMap, tableAlias);

    // apply where, if any fields
    if (standardizedWhereObject.fields.length > 0) {
      applyKnexWhere(knexObject, standardizedWhereObject, fieldsObjectMap);
    }

    if (sqlQuery.transaction) {
      knexObject.transacting(sqlQuery.transaction);
    }

    sqlQuery.extendFn && sqlQuery.extendFn(knexObject);

    return await knexObject.delete();
  } catch (err) {
    throw handleSqlError(err);
  }
}

export { executeDBQuery };
