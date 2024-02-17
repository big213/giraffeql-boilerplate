import { BaseService } from ".";
import {
  countTableRows,
  deleteTableRow,
  fetchTableRows,
  getRawKnexObject,
  incrementTableRow,
  insertTableRow,
  SqlCountQuery,
  SqlDeleteQuery,
  SqlIncrementQuery,
  SqlInsertQuery,
  SqlRawQuery,
  SqlSelectQuery,
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

import { escapeRegExp, generateId, isObject } from "../helpers/shared";
import {
  countObjectType,
  createObjectType,
  deleteObjectType,
  getObjectType,
  updateObjectType,
} from "../helpers/resolver";
import { PaginatorService } from ".";
import { Transaction } from "knex";
import { Scalars } from "../..";
import { knex } from "../../../utils/knex";
import { generateSqlSingleFieldObject } from "../helpers/sqlHelper";

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

export type KeyMap = {
  [x: string]: string[];
};

export class PaginatedService extends BaseService {
  typeDef!: GiraffeqlObjectType;

  paginator: PaginatorService;

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

    this.paginator = new PaginatorService(this);

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
  // not currently working
  async subscribeToSingleItem(
    operationName: string,
    {
      req,
      fieldPath,
      args,
      query,
      data = {},
      isAdmin = false,
    }: ServiceFunctionInputs
  ) {}

  @permissionsCheck("getMultiple")
  // not currently working
  async subscribeToMultipleItem(
    operationName: string,
    {
      req,
      fieldPath,
      args,
      query,
      data = {},
      isAdmin = false,
    }: ServiceFunctionInputs
  ) {}

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

  @permissionsCheck("getMultiple")
  async getPaginator(inputs: ServiceFunctionInputs) {
    return this.paginator.getRecord(inputs);
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

  @permissionsCheck("getMultiple")
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
  async incrementSqlRecord(sqlQuery: Omit<SqlIncrementQuery, "table">) {
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

  isEmptyQuery(query: unknown) {
    return isObject(query) && Object.keys(query).length < 1;
  }

  // generates a valid unique ID for this record
  // will try 3 times before calling it quits
  async generateRecordId(transaction?: Transaction, attempt = 0) {
    // if 3 or more tries, throw err
    if (attempt > 2) {
      throw new Error(
        "Unable to generate unique ID for this record after 3 tries"
      );
    }

    const id = await generateId(this.primaryKeyLength);
    // check if the id already is in use
    const recordsCount = await this.countSqlRecord({
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

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        // only add the id field if the id field is a string (not auto-increment)
        ...(!this.primaryKeyAutoIncrement && {
          id: await this.generateRecordId(),
        }),
        ...args,
        createdBy: req.user!.id,
      },
      req,
      fieldPath,
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
      addResults.id
    );

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: addResults.id },
          query,
          fieldPath,
          isAdmin,
          data,
        });
  }

  async afterCreateProcess(inputs: ServiceFunctionInputs, itemId: string) {}

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

    await updateObjectType({
      typename: this.typename,
      id: item.id,
      updateFields: {
        ...args.fields,
        updatedAt: 1,
      },
      req,
      fieldPath,
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
      item.id
    );

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: item.id },
          query,
          fieldPath,
          isAdmin,
          data,
        });
  }

  async afterUpdateProcess(inputs: ServiceFunctionInputs, itemId: string) {}

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

    // first, fetch the requested query, if any
    const requestedResults = this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args,
          query,
          fieldPath,
          isAdmin,
          data,
        });

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
    });

    return requestedResults;
  }
}
