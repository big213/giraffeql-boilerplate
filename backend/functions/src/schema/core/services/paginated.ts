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
  SqlSimpleOrderByObject,
  SqlSimpleRawSelectObject,
  SqlSimpleSelectObject,
  SqlSumQuery,
  SqlUpdateQuery,
  SqlWhereFieldOperator,
  SqlWhereInput,
  SqlWhereObject,
  sumTableRows,
  updateTableRow,
} from "../helpers/sql";
import { permissionsCheck } from "../helpers/permissions";

import {
  GiraffeqlObjectType,
  GiraffeqlRootResolverType,
  GiraffeqlObjectTypeLookup,
  objectTypeDefs,
  GiraffeqlInputType,
  GiraffeqlArgsError,
  GiraffeqlInputTypeLookup,
  GiraffeqlInputFieldType,
  GiraffeqlInitializationError,
  GiraffeqlScalarType,
  GiraffeqlBaseError,
  lookupSymbol,
} from "giraffeql";

import { ExternalQuery, ServiceFunctionInputs } from "../../../types";

import {
  escapeRegExp,
  generateId,
  isObject,
  generateCursorFromNode,
  btoa,
} from "../helpers/shared";
import {
  countObjectType,
  createObjectType,
  deleteObjectType,
  getObjectType,
  updateObjectType,
} from "../helpers/resolver";
import { Scalars } from "../..";
import { knex } from "../../../utils/knex";
import { generateSqlSingleFieldObject } from "../helpers/sqlHelper";
import { Knex } from "knex";

export type FieldObject = {
  field?: string;
};

export type FieldMap = {
  [x: string]: FieldObject;
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

  defaultQuery: ExternalQuery = {
    id: lookupSymbol,
  };

  typeDefLookup: GiraffeqlObjectTypeLookup;

  inputTypeDef!: GiraffeqlInputType;
  primaryInputTypeDef!: GiraffeqlInputType;

  inputTypeDefLookup: GiraffeqlInputTypeLookup;

  primaryInputTypeDefLookup: GiraffeqlInputTypeLookup;

  rootResolvers!: { [x: string]: GiraffeqlRootResolverType };

  filterFieldsMap: FieldMap = {};

  // some combination of these fields need to be able to identify a unique record
  uniqueKeyMap: KeyMap = {
    primary: ["id"],
  };

  primaryKeyAutoIncrement: boolean = false;

  primaryKeyLength: number = 8;

  sortFieldsMap: FieldMap = {};

  groupByFieldsMap: FieldMap = {};

  aggregatorOptions?: AggregatorOptions;

  searchFieldsMap: { [x: string]: SearchFieldObject } = {};

  distanceFieldsMap: { [x: string]: DistanceFieldObject } = {};

  searchParams: { [x: string]: GiraffeqlInputFieldType } | undefined =
    undefined;

  constructor(typename?: string) {
    super(typename);

    this.typeDefLookup = new GiraffeqlObjectTypeLookup(this.typename);

    this.inputTypeDefLookup = new GiraffeqlInputTypeLookup(this.typename);

    this.primaryInputTypeDefLookup = new GiraffeqlInputTypeLookup(
      `${this.typename}Id`
    );

    process.nextTick(() => {
      const uniqueKeyMap = {};
      Object.entries(this.uniqueKeyMap).forEach(([uniqueKeyName, entry]) => {
        entry.forEach((key) => {
          const typeDefField = this.getTypeDef().definition.fields[key];
          if (!typeDefField) {
            throw new GiraffeqlInitializationError({
              message: `Unique key map field not found. Nested values not allowed`,
            });
          }

          this.getTypeDef().definition.fields[key].allowNull;
          uniqueKeyMap[key] = new GiraffeqlInputFieldType({
            type:
              typeDefField.type instanceof GiraffeqlScalarType
                ? typeDefField.type
                : new GiraffeqlInputTypeLookup(key),
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

  @permissionsCheck("get")
  async getRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    await this.handleLookupArgs(args);

    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    data.rootArgs = args;

    whereObject.fields.push(
      ...Object.entries(args).map(([field, value]) => ({
        field,
        value,
      }))
    );

    const results = await getObjectType({
      typename: this.typename,
      req,
      fieldPath,
      externalQuery: query,
      sqlParams: {
        where: [whereObject],
        limit: 1,
        specialParams: await this.getSpecialParams({
          req,
          fieldPath,
          args,
          query,
          data,
          isAdmin,
        }),
      },
      data,
    });

    if (results.length < 1) {
      throw new Error("Item not found");
    }

    return results[0];
  }

  // convert any lookup/joined fields into IDs, in place.
  async handleLookupArgs(args: any): Promise<void> {
    for (const key in args) {
      const typeField = this.getTypeDef().definition.fields[key]?.type;
      if (
        typeField instanceof GiraffeqlObjectTypeLookup &&
        isObject(args[key])
      ) {
        // get record ID of type, replace object with the ID
        const results = await fetchTableRows({
          select: ["id"],
          table: typeField.name,
          where: args[key],
        });

        if (results.length < 1) {
          throw new GiraffeqlBaseError({
            message: `${typeField.name} not found`,
          });
        }

        // replace args[key] with the item ID
        args[key] = results[0].id;
      }
    }
  }

  @permissionsCheck("getStats")
  async getRecordStats({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
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
        count: await countObjectType(
          this.typename,
          fieldPath,
          [whereObject],
          true
        ),
      }),
    };
  }

  @permissionsCheck("getPaginator")
  async getRecordPaginator({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
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
            return sortByObject;
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

        // if null last value, skip
        if (lastValue === null) return;

        const whereAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [
            {
              field: orderByObject.field,
              operator,
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
        fieldPath,
        args,
        query,
        data,
        isAdmin,
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
      fieldPath,
      externalQuery: query.edges?.node ?? {},
      sqlParams,
      data,
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
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
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
    const results = await fetchTableRows({
      ...sqlQuery,
      table: this.typename,
    });

    if (results.length < 1 && throwError) {
      throw new GiraffeqlBaseError({
        message: `${this.typename} not found`,
      });
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

  async updateSqlRecord(sqlQuery: Omit<SqlUpdateQuery, "table">) {
    return updateTableRow({
      ...sqlQuery,
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
              updatedAt: 1,
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
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    await this.handleLookupArgs(args);

    let addResults;
    await knex.transaction(async (transaction) => {
      addResults = await createObjectType({
        typename: this.typename,
        addFields: {
          // only add the id field if the id field is a string (not auto-increment)
          ...(!this.primaryKeyAutoIncrement && {
            id: await this.generateRecordId(transaction),
          }),
          ...args,
          createdBy: req.user!.id,
        },
        req,
        fieldPath,
        transaction,
      });

      // do post-create fn, if any
      await this.afterCreateProcess(
        {
          req,
          fieldPath,
          args,
          query,
          data,
          isAdmin,
        },
        addResults.id,
        transaction
      );
    });

    return this.getRecord({
      req,
      args: { id: addResults.id },
      query,
      fieldPath,
      isAdmin,
      data,
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
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const item = await this.getFirstSqlRecord(
      {
        select: ["id"],
        where: args.item,
      },
      true
    );

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(args.fields);

    await knex.transaction(async (transaction) => {
      await updateObjectType({
        typename: this.typename,
        id: item.id,
        updateFields: {
          ...args.fields,
          updatedAt: 1,
        },
        req,
        fieldPath,
        transaction,
      });

      // do post-update fn, if any
      await this.afterUpdateProcess(
        {
          req,
          fieldPath,
          args,
          query,
          data,
          isAdmin,
        },
        item.id,
        transaction
      );
    });

    return this.getRecord({
      req,
      args: { id: item.id },
      query,
      fieldPath,
      isAdmin,
      data,
    });
  }

  async afterUpdateProcess(
    inputs: ServiceFunctionInputs,
    itemId: string,
    transaction?: Knex.Transaction
  ) {}

  // retrieves the related services that should also be deleted when this record is also delated
  getOnDeleteEntries(): {
    service: PaginatedService;
    field?: string;
  }[] {
    return [];
  }

  @permissionsCheck("delete")
  async deleteRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // confirm existence of item and get ID
    const item = await this.getFirstSqlRecord(
      {
        select: ["id"],
        where: args,
      },
      true
    );

    let requestedResults;

    if (Object.keys(query).length > 0) {
      // check for get permissions, if fields were requested
      await this.testPermissions("get", {
        req,
        args,
        query,
        fieldPath,
        isAdmin,
        data,
      });
      // fetch the requested query, if any
      requestedResults = await this.getRecord({
        req,
        args,
        query,
        fieldPath,
        isAdmin,
        data,
      });
    }

    // delete the type and also any associated services
    await knex.transaction(async (transaction) => {
      await deleteObjectType({
        typename: this.typename,
        id: item.id,
        req,
        fieldPath,
        transaction,
      });

      for (const deleteEntry of this.getOnDeleteEntries()) {
        await deleteEntry.service.deleteSqlRecord({
          where: {
            [deleteEntry.field ?? this.typename]: item.id,
          },
          transaction,
        });
      }

      // do post-delete fn, if any
      await this.afterDeleteProcess(
        {
          req,
          fieldPath,
          args,
          query,
          data,
          isAdmin,
        },
        item.id,
        transaction
      );
    });

    return requestedResults ?? {};
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
