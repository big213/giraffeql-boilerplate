import { BaseService } from ".";
import {
  aggregateTableRows,
  countTableRows,
  deleteTableRow,
  fetchTableRows,
  getRawKnexObject,
  incrementTableRow,
  insertTableRow,
  isKnexRawStatement,
  SqlAggregateQuery,
  SqlCountQuery,
  SqlDeleteQuery,
  SqlFieldGetter,
  SqlIncrementQuery,
  SqlInsertQuery,
  SqlRawQuery,
  SqlSelectQuery,
  SqlSimpleRawSelectObject,
  SqlSimpleSelectObject,
  SqlSumQuery,
  SqlUpdateQuery,
  SqlWhereFieldOperator,
  SqlWhereInput,
  SqlWhereObject,
  sumTableRows,
  updateTableRow,
  SqlSimpleOrderByObject,
} from "../helpers/sql";
import { permissionsCheck } from "../helpers/permissions";

import {
  GiraffeqlObjectType,
  GiraffeqlObjectTypeLookup,
  objectTypeDefs,
  GiraffeqlInputType,
  GiraffeqlArgsError,
  GiraffeqlInputFieldType,
  GiraffeqlInitializationError,
  GiraffeqlBaseError,
} from "giraffeql";

import { ServiceFunctionInputs } from "../../../types";

import {
  escapeRegExp,
  generateId,
  isObject,
  generateCursorFromNode,
  btoa,
  capitalizeString,
  getUpdatedFieldValues,
} from "../helpers/shared";
import { getObjectType } from "../helpers/resolver";
import { knex } from "../../../utils/knex";
import { generateSqlSingleFieldObject } from "../helpers/sqlHelper";
import { Knex } from "knex";
import {
  getInputTypeDef,
  GiraffeqlInputTypeLookupService,
  GiraffeqlObjectTypeLookupService,
} from "../helpers/typeDef";
import { ItemNotFoundError } from "../helpers/error";
import { Scalars } from "../../scalars";

export type FieldObject = {
  field?: string;
};

export type SortFieldObject = FieldObject & {
  descNullsFirst?: boolean;
  ascNullsLast?: boolean;
};

export type FieldMap<T> = {
  [x: string]: T;
};

export type SearchFieldObject = {
  field?: string;
  exact?: boolean;
  customProcessor?: (
    whereSubObject: SqlWhereObject,
    searchObject: any,
    searchFieldObject: SearchFieldObject,
    fieldPath: string
  ) => void;
};

export type DistanceFieldObject = {
  latitude: string;
  longitude: string;
};

export type AggregatorOptions = {
  keys: {
    [x: string]: {
      field: string;
      getter?: SqlFieldGetter;
    };
  };
  values: {
    [x: string]: {
      field: string;
      getter?: SqlFieldGetter;
    };
  };
};

export type KeyMap = {
  [x: string]: string[];
};

export class PaginatedService extends BaseService {
  typeDef!: GiraffeqlObjectType;

  typeDefLookup: GiraffeqlObjectTypeLookupService;

  inputTypeDef!: GiraffeqlInputType;
  primaryInputTypeDef!: GiraffeqlInputType;

  inputTypeDefLookup: GiraffeqlInputTypeLookupService;

  primaryInputTypeDefLookup: GiraffeqlInputTypeLookupService;

  filterFieldsMap: FieldMap<FieldObject> = {};

  // some combination of these fields need to be able to identify a unique record
  uniqueKeyMap: KeyMap = {
    primary: ["id"],
  };

  primaryKeyAutoIncrement: boolean = false;

  primaryKeyLength: number = 8;

  sortFieldsMap: FieldMap<SortFieldObject> = {};

  groupByFieldsMap: FieldMap<FieldObject> = {};

  aggregatorOptions?: AggregatorOptions;

  searchFieldsMap: { [x: string]: SearchFieldObject } = {};

  distanceFieldsMap: { [x: string]: DistanceFieldObject } = {};

  searchParams: { [x: string]: GiraffeqlInputFieldType } | undefined =
    undefined;

  constructor(typename?: string) {
    super(typename);

    this.typeDefLookup = new GiraffeqlObjectTypeLookupService(
      this.typename,
      this
    );

    this.inputTypeDefLookup = new GiraffeqlInputTypeLookupService(
      this.typename,
      this
    );

    this.primaryInputTypeDefLookup = new GiraffeqlInputTypeLookupService(
      `${this.typename}Id`,
      this
    );

    process.nextTick(() => {
      const uniqueKeyMap = {};
      Object.entries(this.uniqueKeyMap).forEach(([_uniqueKeyName, entry]) => {
        entry.forEach((field) => {
          const typeDefField = this.getTypeDef().definition.fields[field];
          if (!typeDefField) {
            throw new GiraffeqlInitializationError({
              message: `Unique key map field not found: ${field}. Nested values not allowed`,
            });
          }

          // if the typeDefField is a GiraffeqlObjectType or a *non-service* lookup, throw err
          if (
            typeDefField.type instanceof GiraffeqlObjectType ||
            (typeDefField.type instanceof GiraffeqlObjectTypeLookup &&
              !(typeDefField.type instanceof GiraffeqlObjectTypeLookupService))
          ) {
            throw new Error(
              `TypeDef type for ${field} must be either a scalar or GiraffeqlObjectTypeLookupService`
            );
          }
          uniqueKeyMap[field] = new GiraffeqlInputFieldType({
            type:
              typeDefField.type instanceof GiraffeqlObjectTypeLookupService
                ? typeDefField.type.service.inputTypeDefLookup
                : typeDefField.type,
            allowNull: typeDefField.allowNull,
          });
        });
      });

      this.inputTypeDef = new GiraffeqlInputType({
        name: this.typename,

        fields: uniqueKeyMap,
        inputsValidator: (args, fieldPath) => {
          // check if a valid combination of key args exist
          let validKeyCombination = false;
          if (isObject(args)) {
            const argsArray = Object.keys(args);
            for (const keyName in this.uniqueKeyMap) {
              if (
                this.uniqueKeyMap[keyName].every((ele) =>
                  argsArray.includes(ele)
                ) &&
                argsArray.every((ele) =>
                  this.uniqueKeyMap[keyName].includes(ele)
                )
              ) {
                validKeyCombination = true;
                break;
              }
            }
          }

          if (!validKeyCombination) {
            throw new GiraffeqlArgsError({
              message: `Invalid combination of args`,
              fieldPath,
            });
          }
        },
      });

      this.primaryInputTypeDef = new GiraffeqlInputType({
        name: `${this.typename}Id`,
        fields: {
          id: new GiraffeqlInputFieldType({
            type: Scalars.id,
            allowNull: false,
            required: true,
          }),
        },
      });
    });
  }

  // set typeDef
  setTypeDef(typeDef: GiraffeqlObjectType) {
    this.typeDef = typeDef;
  }

  getTypeDef() {
    if (this.typeDef) return this.typeDef;

    const typeDefLookup = objectTypeDefs.get(this.typeDefLookup.name);

    if (!typeDefLookup)
      throw new Error(`TypeDef not found '${this.typeDefLookup.name}'`);

    return typeDefLookup;
  }

  getCreateInputTypeDefLookup() {
    return getInputTypeDef(`create${capitalizeString(this.typename)}Args`);
  }

  getUpdateInputTypeDefLookup() {
    return getInputTypeDef(`update${capitalizeString(this.typename)}Args`);
  }

  @permissionsCheck("get")
  async getRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    const results = await getObjectType({
      typename: this.typename,
      req,
      rootResolver,
      fieldPath,
      externalQuery: query,
      sqlParams: {
        where: {
          id: args,
        },
        limit: 1,
        specialParams: await this.getSpecialParams({
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        }),
      },
    });

    if (results.length < 1) {
      throw new ItemNotFoundError({ fieldPath });
    }

    return results[0];
  }

  async getReturnQuery({
    id,
    inputs,
  }: {
    id: string | number;
    inputs: ServiceFunctionInputs;
  }) {
    const { req, rootResolver, args, query, fieldPath } = inputs;

    // check the "get" permissions manually
    await this.testPermissions("get", {
      req,
      rootResolver,
      args: { id },
      query,
      fieldPath,
    });

    // if no fields requested, return an empty object (after checking permissions)
    if (Object.keys(query).length === 0) {
      return {};
    }

    const results = await getObjectType({
      typename: this.typename,
      req: req,
      rootResolver: rootResolver,
      fieldPath: fieldPath,
      externalQuery: query,
      sqlParams: {
        where: {
          id,
        },
        limit: 1,
        specialParams: await this.getSpecialParams(inputs),
      },
    });

    if (results.length < 1) {
      throw new ItemNotFoundError({ fieldPath });
    }

    return results[0];
  }

  @permissionsCheck("getStats")
  async getRecordStats({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(args.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      args.filterBy.forEach((filterByObject) => {
        const filterByAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [],
        };
        filterByOrObject.fields.push(filterByAndObject);
        Object.entries(filterByObject).forEach(
          ([filterKey, filterKeyObject]) => {
            Object.entries(<any>filterKeyObject).forEach(
              ([operationKey, operationValue]: [string, any]) => {
                filterByAndObject.fields.push({
                  field: generateSqlSingleFieldObject(
                    this.filterFieldsMap[filterKey].field ?? filterKey
                  ),
                  operator: <SqlWhereFieldOperator>operationKey,
                  value: operationValue,
                });
              }
            );
          }
        );
      });
    }

    // handle search fields
    if (args.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const field in this.searchFieldsMap) {
        const fieldPath = this.searchFieldsMap[field].field ?? field;

        // if there is a custom handler on the options, use that
        const customProcessor = this.searchFieldsMap[field].customProcessor;
        if (customProcessor) {
          customProcessor(
            whereSubObject,
            args.search,
            this.searchFieldsMap[field],
            fieldPath
          );
        } else {
          // if field options has exact, ony allow eq
          if (this.searchFieldsMap[field].exact) {
            whereSubObject.fields.push({
              field: fieldPath,
              value: args.search.query,
              operator: "eq",
            });
          } else {
            whereSubObject.fields.push({
              field: fieldPath,
              value: new RegExp(escapeRegExp(args.search.query), "i"),
              operator: "regex",
            });
          }
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    return {
      ...(query?.count !== undefined && {
        count: await this.countSqlRecord({
          field: "id",
          where: [whereObject],
          distinct: true,
        }),
      }),
    };
  }

  @permissionsCheck("getPaginator")
  async getRecordPaginator({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    // raw select statements (i.e. Knex.Raw)
    const rawSelect: SqlSimpleRawSelectObject[] = [];

    // additional select statements that should be added for scaffolding
    const additionalSelect: SqlSimpleSelectObject[] = [
      { field: "id", as: "$last_id" },
    ];

    // this helper function processes the args.filterBy, args.search, and args.distance
    this.processArgs(args, whereObject, rawSelect);

    // create a snapshot of the whereObject (before applying after/before), for calculating the total
    const countWhereObject = {
      ...whereObject,
      fields: whereObject.fields.slice(),
    };

    // process sort fields
    const orderBy: SqlSimpleOrderByObject[] = [];

    // add secondary, etc. sort parameters
    if (Array.isArray(args.sortBy)) {
      orderBy.push(
        ...args.sortBy.map((sortByObject) => {
          if (this.distanceFieldsMap[sortByObject.field]) {
            // if it is a distanceField, confirm that the distance field was specified
            if (!args.distance?.[sortByObject.field]) {
              throw new Error(
                `If sorting by '${sortByObject.field}', distance parameters must be provided for this field`
              );
            }
            return {
              ...sortByObject,
              field: knex.raw(sortByObject.field),
            };
          } else {
            const sortFieldOptions = this.sortFieldsMap[sortByObject.field];

            return {
              ...sortByObject,
              options: {
                nullsFirst: sortByObject.desc
                  ? sortFieldOptions.descNullsFirst
                  : sortFieldOptions.ascNullsLast === undefined
                  ? undefined
                  : sortFieldOptions.ascNullsLast === false,
              },
            };
          }
        })
      );
    }

    // for each sort param, add it to the rawSelect (if it is not a knex.raw type
    orderBy.forEach((orderByObject, index) => {
      if (!isKnexRawStatement(orderByObject.field)) {
        additionalSelect.push({
          field: orderByObject.field,
          as: `$last_value_${index}`,
        });
      }
    });

    // always add id asc sort as final sort param
    orderBy.push({
      field: "id",
      desc: false,
    });

    // process the "after" or "before" constraint, if provided
    // only one should have been provided
    if (args.after || args.before) {
      // parse cursor
      const parsedCursor = JSON.parse(btoa(args.after || args.before));

      const whereOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      // for each orderBy statement, need to generate the required where constraints
      orderBy.forEach((orderByObject, index) => {
        // if it is a raw filter field, skip
        if (isKnexRawStatement(orderByObject.field)) return;

        const operator = (
          args.before ? !orderByObject.desc : orderByObject.desc
        )
          ? "lt"
          : "gt";

        const lastValue = parsedCursor.lastValues[index];

        // are the nulls going to be shown last?
        const nullsLast =
          (orderByObject.desc && !orderByObject.options?.nullsFirst) ||
          (!orderByObject.desc && orderByObject.options?.nullsFirst === false);

        // if null last value *and* nulls are last, skip
        if (lastValue === null && nullsLast) return;

        const whereAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [
            {
              field: orderByObject.field,
              // if last value is null and nulls are first, always use gt NULL
              operator: lastValue === null && !nullsLast ? "gt" : operator,
              value:
                orderByObject.field === "id" ? parsedCursor.lastId : lastValue,
            },
          ],
        };

        // build additional cascading whereAndObjects
        orderBy.slice(0, index).forEach((orderByObject, index) => {
          // if it is a raw filter field, skip
          if (isKnexRawStatement(orderByObject.field)) return;

          const lastValue = parsedCursor.lastValues[index];
          whereAndObject.fields.push({
            field: orderByObject.field,
            operator: "eq",
            value:
              orderByObject.field === "id" ? parsedCursor.lastId : lastValue,
          });
        });

        whereOrObject.fields.push(whereAndObject);
      });

      whereObject.fields.push(whereOrObject);
    }

    // set limit to args.first or args.last, one of which must be provided
    const limit = Number(args.first ?? args.last);

    const sqlParams: Omit<SqlSelectQuery, "table" | "select"> = {
      where: [whereObject],
      rawSelect,
      orderBy,
      limit,
      specialParams: await this.getSpecialParams({
        req,
        rootResolver,
        fieldPath,
        args,
        query,
      }),
      distinctOn: undefined,
      groupBy: Array.isArray(args.groupBy)
        ? args.groupBy.reduce((total, item, index) => {
            if (item in this.groupByFieldsMap) {
              total.push({
                field: this.groupByFieldsMap[item].field ?? item,
              });
            }
            return total;
          }, [])
        : null,
    };

    this.sqlParamsModifier?.(sqlParams);

    // populate the distinctOn, in case the sqlParamsModifier modified the orderBy
    sqlParams.distinctOn = orderBy.reduce((total, ele) => {
      total.push(ele.field);
      return total;
    }, <(string | Knex.Raw)[]>[]);

    const results = await getObjectType({
      typename: this.typename,
      additionalSelect,
      req,
      rootResolver,
      fieldPath,
      externalQuery: query.edges?.node ?? {},
      sqlParams,
    });

    const validatedResults = args.reverse
      ? args.before
        ? results
        : results.reverse()
      : args.before
      ? results.reverse()
      : results;

    return {
      ...(query.paginatorInfo && {
        paginatorInfo: {
          ...(query.paginatorInfo.total && {
            total: await this.countSqlRecord({
              where: [countWhereObject],
            }),
          }),
          ...(query.paginatorInfo.count && {
            count: validatedResults.length,
          }),
          ...(query.paginatorInfo.startCursor && {
            startCursor: generateCursorFromNode(validatedResults[0]),
          }),
          ...(query.paginatorInfo.endCursor && {
            endCursor: generateCursorFromNode(
              validatedResults[validatedResults.length - 1]
            ),
          }),
        },
      }),
      ...(query.edges && {
        edges: validatedResults.map((node) => ({
          node,
          ...(query.edges.cursor && {
            cursor: generateCursorFromNode(node),
          }),
        })),
      }),
    };
  }

  @permissionsCheck("getAggregator")
  async getRecordAggregator({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(args.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      args.filterBy.forEach((filterByObject) => {
        const filterByAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [],
        };
        filterByOrObject.fields.push(filterByAndObject);
        Object.entries(filterByObject).forEach(
          ([filterKey, filterKeyObject]) => {
            Object.entries(<any>filterKeyObject).forEach(
              ([operationKey, operationValue]: [string, any]) => {
                filterByAndObject.fields.push({
                  field: generateSqlSingleFieldObject(
                    this.filterFieldsMap[filterKey].field ?? filterKey
                  ),
                  operator: <SqlWhereFieldOperator>operationKey,
                  value: operationValue,
                });
              }
            );
          }
        );
      });
    }

    // handle search fields
    if (args.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const field in this.searchFieldsMap) {
        const fieldPath = this.searchFieldsMap[field].field ?? field;

        // if there is a custom handler on the options, use that
        const customProcessor = this.searchFieldsMap[field].customProcessor;
        if (customProcessor) {
          customProcessor(
            whereSubObject,
            args.search,
            this.searchFieldsMap[field],
            fieldPath
          );
        } else {
          // if field options has exact, ony allow eq
          if (this.searchFieldsMap[field].exact) {
            whereSubObject.fields.push({
              field: fieldPath,
              value: args.search.query,
              operator: "eq",
            });
          } else {
            whereSubObject.fields.push({
              field: fieldPath,
              value: new RegExp(escapeRegExp(args.search.query), "i"),
              operator: "regex",
            });
          }
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    const selectObjects: SqlSimpleSelectObject[] = [
      {
        field: this.aggregatorOptions!.keys[args.keyField].field,
        getter: this.aggregatorOptions!.keys[args.keyField].getter,
        as: "key",
      },
    ];

    Object.entries(this.aggregatorOptions!.values).forEach(([key, value]) => {
      if (key in query) {
        selectObjects.push({
          field: this.aggregatorOptions!.values[key].field,
          getter: this.aggregatorOptions!.values[key].getter,
          as: key,
        });
      }
    });

    const results = await fetchTableRows({
      select: selectObjects,
      table: this.typename,
      where: [whereObject],
      groupBy: [knex.raw(`"key"`)],
      orderBy: [
        {
          field: knex.raw(`"${args.sortBy?.field ?? "key"}"`),
          desc: args.sortBy?.desc === true,
        },
      ],
    });

    return results;
  }

  // by default, load "currentUserId" with the current user, if any
  async getSpecialParams({ req }: ServiceFunctionInputs) {
    return {
      currentUserId: req.user?.id ?? null,
    };
  }

  sqlParamsModifier(sqlParams: Omit<SqlSelectQuery, "table" | "select">) {}

  // confirms the existence of a record, or throws an error
  async existsSqlRecord(
    sqlQuery: Omit<SqlCountQuery, "table">,
    throwError = false
  ): Promise<boolean> {
    const recordsCount = await countTableRows({
      ...sqlQuery,
      table: this.typename,
    });

    if (recordsCount === 0 && throwError) {
      throw new GiraffeqlBaseError({
        message: `${this.typename} not found`,
      });
    }

    return recordsCount > 0;
  }

  // looks up a record using its keys
  async getFirstSqlRecord(
    sqlQuery: Omit<SqlSelectQuery, "table">,
    throwError = false
  ): Promise<any> {
    // for this keyed lookup, only allow object
    if (!isObject(sqlQuery.where)) {
      throw new Error(`Only simple where object allowed for keyed lookups`);
    }

    const results = await fetchTableRows({
      ...sqlQuery,
      table: this.typename,
      limit: 2,
    });

    if (results.length < 1 && throwError) {
      throw new GiraffeqlBaseError({
        message: `${this.typename} not found`,
      });
    }

    // if there is more than 1 result, throw an err as this is most likely unintentional
    if (results.length > 1) {
      throw new Error(
        `More than 1 result returned for this keyed lookup. This is most likely unintended.`
      );
    }

    return results[0] ?? null;
  }

  // look up multiple records
  async getAllSqlRecord(sqlQuery: Omit<SqlSelectQuery, "table">): Promise<any> {
    const results = await fetchTableRows({
      ...sqlQuery,
      table: this.typename,
    });

    return results;
  }

  // count the records matching the criteria
  async countSqlRecord(
    sqlQuery: Omit<SqlCountQuery, "table">
  ): Promise<number> {
    const recordsCount = await countTableRows({
      ...sqlQuery,
      table: this.typename,
    });

    return recordsCount;
  }

  // sum a field for the records matching the criteria
  async sumSqlRecord(sqlQuery: Omit<SqlSumQuery, "table">): Promise<any> {
    const sum = await sumTableRows({
      ...sqlQuery,
      table: this.typename,
    });

    return sum;
  }

  // aggregate a field for the records matching the criteria
  // allowed operations: sum | avg | count
  async aggregateSqlRecord(
    sqlQuery: Omit<SqlAggregateQuery, "table">
  ): Promise<number> {
    const result = await aggregateTableRows({
      ...sqlQuery,
      table: this.typename,
    });

    return result;
  }

  // sum a field for the records matching the criteria
  getRawKnexObject(sqlQuery: Omit<SqlRawQuery, "table">) {
    return getRawKnexObject({
      ...sqlQuery,
      table: this.typename,
    });
  }

  async createSqlRecord(sqlQuery: Omit<SqlInsertQuery, "table">) {
    return insertTableRow({
      ...sqlQuery,
      fields: {
        ...(!this.primaryKeyAutoIncrement && {
          id: await this.generateRecordId(sqlQuery.transaction),
        }),
        ...sqlQuery.fields,
      },
      table: this.typename,
    }).then((res) => res[0]);
  }

  async createSqlRecordIfNotExists(
    whereInput: SqlWhereInput,
    sqlQuery: Omit<SqlInsertQuery, "table">
  ) {
    let record = await this.getFirstSqlRecord({
      select: ["id"],
      where: whereInput,
    });

    if (!record) {
      record = await this.createSqlRecord(sqlQuery);
    }

    return record;
  }

  async updateSqlRecord(
    sqlQuery: Omit<SqlUpdateQuery, "table">,
    updateUpdatedAt = false
  ) {
    return updateTableRow({
      ...sqlQuery,
      fields: {
        ...sqlQuery.fields,
        ...(updateUpdatedAt && {
          updatedAt: knex.fn.now(),
        }),
      },
      table: this.typename,
    });
  }

  // can only process one field at a time
  async incrementSqlRecord(
    sqlQuery: Omit<SqlIncrementQuery, "table">,
    updateUpdatedAt = false
  ) {
    // since incrementTableRow can only process one field at a time, will break down the fields first
    for (const field in sqlQuery.fields) {
      const quantity = sqlQuery.fields[field];
      // only process if quantity not 0
      if (quantity) {
        await incrementTableRow({
          ...sqlQuery,
          fields: {
            [field]: quantity,
          },
          table: this.typename,
        });

        if (updateUpdatedAt) {
          await updateTableRow({
            ...sqlQuery,
            fields: {
              updatedAt: knex.fn.now(),
            },
            table: this.typename,
          });
        }
      }
    }

    // return nothing
    return;
  }

  async deleteSqlRecord(sqlQuery: Omit<SqlDeleteQuery, "table">) {
    return deleteTableRow({
      ...sqlQuery,
      table: this.typename,
    });
  }

  // generates a valid unique ID for this record
  // will try 3 times before calling it quits
  async generateRecordId(transaction?: Knex.Transaction, attempt = 0) {
    // if 3 or more tries, throw err
    if (attempt > 2) {
      throw new Error(
        "Unable to generate unique ID for this record after 3 tries"
      );
    }

    const id = await generateId(this.primaryKeyLength);
    // check if the id already is in use
    const recordsCount = await this.aggregateSqlRecord({
      field: "id",
      operation: "count",
      where: {
        id,
      },
      transaction,
    });

    if (recordsCount < 1) {
      return id;
    }

    return this.generateRecordId(transaction, ++attempt);
  }

  @permissionsCheck("create")
  async createRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    let addResults;
    await knex.transaction(async (transaction) => {
      addResults = await this.createSqlRecord({
        fields: {
          ...args,
          createdBy: req.user!.id,
        },
        extendFn: (knexObject) => {
          knexObject.onConflict().ignore();
        },
        transaction,
      });

      // if addResults falsey, there was a conflict
      if (!addResults) {
        throw new Error(
          `An entry with this combination of unique keys already exists`
        );
      }

      // do post-create fn, if any
      await this.afterCreateProcess(
        {
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        },
        addResults.id,
        transaction
      );
    });

    return this.getReturnQuery({
      id: addResults.id,
      inputs: {
        req,
        rootResolver,
        args,
        query,
        fieldPath,
      },
    });
  }

  async afterCreateProcess(
    inputs: ServiceFunctionInputs,
    itemId: string,
    transaction?: Knex.Transaction
  ) {}

  @permissionsCheck("update")
  async updateRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    const item = await this.getFirstSqlRecord(
      {
        select: ["id"],
        where: { id: args.item },
      },
      true
    );

    // const updatedFieldsObject = getUpdatedFieldValues(args.fields, item)

    await knex.transaction(async (transaction) => {
      await this.updateSqlRecord(
        {
          fields: {
            ...args.fields,
          },
          where: {
            id: item.id,
          },
          transaction,
        },
        true
      );

      // do post-update fn, if any
      await this.afterUpdateProcess(
        {
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        },
        item.id,
        transaction
      );
    });

    return this.getReturnQuery({
      id: item.id,
      inputs: {
        req,
        rootResolver,
        args,
        query,
        fieldPath,
      },
    });
  }

  async afterUpdateProcess(
    inputs: ServiceFunctionInputs,
    itemId: string,
    transaction?: Knex.Transaction
  ) {}

  // retrieves the related services that should also be deleted when this record is also delated. recursive option only applies if it is the same as the current service
  getOnDeleteEntries(): {
    service: PaginatedService;
    field?: string;
    recursive?: boolean;
  }[] {
    return [];
  }

  @permissionsCheck("delete")
  async deleteRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    // confirm existence of item and get ID
    const item = await this.getFirstSqlRecord(
      {
        select: ["id"],
        where: { id: args },
      },
      true
    );

    const requestedQuery = await this.getReturnQuery({
      id: item.id,
      inputs: {
        req,
        rootResolver,
        args,
        query,
        fieldPath,
      },
    });

    // delete the type and also any associated services
    await knex.transaction(async (transaction) => {
      await this.deleteSqlRecord({
        where: {
          id: item.id,
        },
        transaction,
      });

      for (const deleteEntry of this.getOnDeleteEntries()) {
        if (deleteEntry.service === this && deleteEntry.recursive) {
          // if it's the same service and deleting recursively, fetch the IDs of all child elements that need to be deleted, and then delete them all at once
          const idsToDelete: any[] = [];

          let newlyDiscoveredIdsToDelete: any[] = [item.id];

          while (newlyDiscoveredIdsToDelete.length) {
            const recordsToDelete = await deleteEntry.service.getAllSqlRecord({
              select: ["id"],
              where: [
                {
                  field: deleteEntry.field ?? this.typename,
                  operator: "in",
                  value: newlyDiscoveredIdsToDelete,
                },
              ],
              transaction,
            });

            newlyDiscoveredIdsToDelete = recordsToDelete.map(
              (record) => record.id
            );

            idsToDelete.push(...newlyDiscoveredIdsToDelete);
          }

          if (idsToDelete.length) {
            await deleteEntry.service.deleteSqlRecord({
              where: [{ field: "id", operator: "in", value: idsToDelete }],
              transaction,
            });
          }
        } else {
          await deleteEntry.service.deleteSqlRecord({
            where: {
              [deleteEntry.field ?? this.typename]: item.id,
            },
            transaction,
          });
        }
      }

      // do post-delete fn, if any
      await this.afterDeleteProcess(
        {
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        },
        item.id,
        transaction
      );
    });

    return requestedQuery;
  }

  async afterDeleteProcess(
    inputs: ServiceFunctionInputs,
    itemId: string,
    transaction?: Knex.Transaction
  ) {}

  processArgs(
    args: any,
    whereObject: SqlWhereObject,
    rawSelect?: SqlSimpleRawSelectObject[]
  ) {
    if (Array.isArray(args.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      args.filterBy.forEach((filterByObject) => {
        const filterByAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [],
        };
        filterByOrObject.fields.push(filterByAndObject);
        Object.entries(filterByObject).forEach(
          ([filterKey, filterKeyObject]) => {
            Object.entries(<any>filterKeyObject).forEach(
              ([operationKey, operationValue]: [string, any]) => {
                filterByAndObject.fields.push({
                  field: generateSqlSingleFieldObject(
                    this.filterFieldsMap[filterKey].field ?? filterKey
                  ),
                  operator: <SqlWhereFieldOperator>operationKey,
                  value: operationValue,
                });
              }
            );
          }
        );
      });
    }

    // handle search fields
    if (args.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const field in this.searchFieldsMap) {
        const fieldPath = this.searchFieldsMap[field].field ?? field;

        // if there is a custom handler on the options, use that
        const customProcessor = this.searchFieldsMap[field].customProcessor;
        if (customProcessor) {
          customProcessor(
            whereSubObject,
            args.search,
            this.searchFieldsMap[field],
            fieldPath
          );
        } else {
          // if field options has exact, ony allow eq
          if (this.searchFieldsMap[field].exact) {
            whereSubObject.fields.push({
              field: fieldPath,
              value: args.search.query,
              operator: "eq",
            });
          } else {
            whereSubObject.fields.push({
              field: fieldPath,
              value: new RegExp(escapeRegExp(args.search.query), "i"),
              operator: "regex",
            });
          }
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    // handle distance fields
    if (args.distance) {
      const whereSubObject: SqlWhereObject = {
        connective: "AND",
        fields: [],
      };

      Object.entries(args.distance).forEach(([key, val]) => {
        const latitudeField = this.distanceFieldsMap[key].latitude;
        const longitudeField = this.distanceFieldsMap[key].longitude;

        const latitude = (val as any).from.latitude;
        const longitude = (val as any).from.longitude;

        const ltDistance = (val as any).lt;
        const gtDistance = (val as any).gt;

        if (ltDistance === undefined && gtDistance === undefined) {
          throw new Error(
            `At least one of lt or gt required for distance operations`
          );
        }

        if (ltDistance !== undefined) {
          whereSubObject.fields.push({
            statement: `earth_box(ll_to_earth (${latitude}, ${longitude}), ${ltDistance}) @> ll_to_earth (${latitudeField}, ${longitudeField})`,
            fields: [latitudeField, longitudeField],
          });

          whereSubObject.fields.push({
            statement: `earth_distance(ll_to_earth (${latitude}, ${longitude}), ll_to_earth (${latitudeField}, ${longitudeField})) < ${ltDistance}`,
            fields: [latitudeField, longitudeField],
          });
        }

        // this approach does not appear to be indexed and may be slow
        if (gtDistance !== undefined) {
          whereSubObject.fields.push({
            statement: `earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(${latitudeField}, ${longitudeField})) > ${gtDistance}`,
            fields: [latitudeField, longitudeField],
          });
        }

        // if also sorting by this distance field, need to add it to the raw selects
        if (rawSelect) {
          if (
            args.sortBy &&
            args.sortBy.some((sortByObject) => sortByObject.field === key)
          ) {
            rawSelect.push({
              statement: knex.raw(
                `earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(${latitudeField}, ${longitudeField}))`
              ),
              as: key,
            });
          }
        }
      });

      whereObject.fields.push(whereSubObject);
    }
  }
}
