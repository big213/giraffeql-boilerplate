import { BaseService } from ".";
import {
  aggregateTableRows,
  countTableRows,
  deleteTableRow,
  fetchTableRows,
  getRawKnexObject,
  incrementTableRow,
  insertTableRow,
  SqlAggregateQuery,
  SqlCountQuery,
  SqlDeleteQuery,
  SqlFieldGetter,
  SqlIncrementQuery,
  SqlInsertQuery,
  SqlRawQuery,
  SqlSelectQuery,
  SqlSimpleRawSelectObject,
  SqlSumQuery,
  SqlUpdateQuery,
  SqlWhereFieldOperator,
  SqlWhereInput,
  SqlWhereObject,
  sumTableRows,
  updateTableRow,
} from "../helpers/sql";
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

import { ServiceFunctionInputs, StringKeyObject } from "../../../types";

import {
  escapeRegExp,
  generateId,
  isObject,
  capitalizeString,
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

  async getReturnQuery({
    id,
    inputs,
    transaction,
  }: {
    id: string | number;
    inputs: ServiceFunctionInputs;
    transaction?: Knex.Transaction;
  }) {
    const { req, rootResolver, args, query, fieldPath } = inputs;

    // if no fields requested, return an empty object
    if (Object.keys(query).length === 0) {
      return {};
    }

    const results = await getObjectType({
      typename: this.typename,
      req,
      rootResolver,
      fieldPath,
      externalQuery: query,
      sqlParams: {
        where: {
          id,
        },
        limit: 1,
        specialParams: await this.getSpecialParams(inputs),
        transaction,
      },
    });

    if (results.length < 1) {
      throw new ItemNotFoundError({ fieldPath });
    }

    return results[0];
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

  processFilterArgs(
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
