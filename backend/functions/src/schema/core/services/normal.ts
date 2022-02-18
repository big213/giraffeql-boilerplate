import { BaseService } from ".";
import {
  countTableRows,
  fetchTableRows,
  SqlOrderByObject,
  SqlSelectQuery,
  SqlSelectQueryObject,
  SqlWhereFieldOperator,
  SqlWhereInput,
  SqlWhereObject,
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
} from "giraffeql";

import { ServiceFunctionInputs } from "../../../types";

import { btoa, escapeRegExp, generateId, isObject } from "../helpers/shared";
import {
  countObjectType,
  createObjectType,
  deleteObjectType,
  getObjectType,
  updateObjectType,
} from "../helpers/resolver";
import { itemNotFoundError } from "../helpers/error";

export type FieldObject = {
  field?: string;
};

export type FieldMap = {
  [x: string]: FieldObject;
};

export type ExternalQuery = {
  [x: string]: any;
};

export type KeyMap = {
  [x: string]: string[];
};

export class NormalService extends BaseService {
  typeDef!: GiraffeqlObjectType;

  typeDefLookup: GiraffeqlObjectTypeLookup;

  inputTypeDef!: GiraffeqlInputType;

  inputTypeDefLookup: GiraffeqlInputTypeLookup;

  rootResolvers!: { [x: string]: GiraffeqlRootResolverType };

  filterFieldsMap: FieldMap = {};

  // some combination of these fields need to be able to identify a unique record
  uniqueKeyMap: KeyMap = {
    primary: ["id"],
  };

  primaryKeyLength: number = 8;

  sortFieldsMap: FieldMap = {};

  groupByFieldsMap: FieldMap = {};

  searchFieldsMap: FieldMap = {};

  constructor(typename?: string) {
    super(typename);

    this.typeDefLookup = new GiraffeqlObjectTypeLookup(this.typename);

    this.inputTypeDefLookup = new GiraffeqlInputTypeLookup(this.typename);

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
  ) {
    // args should be validated already
    const validatedArgs = <any>args;
    const selectQuery = query || Object.assign({}, this.presets.default);

    //check if the record and query is fetchable
    const results = await getObjectType({
      typename: this.typename,
      req,
      fieldPath,
      externalQuery: selectQuery,
      sqlParams: {
        where: {
          id: validatedArgs.id,
        },
      },
      data,
    });

    if (results.length < 1) {
      throw itemNotFoundError(fieldPath);
    }

    const subscriptionFilterableArgs = {
      id: validatedArgs.id,
    };

    /*
    const channel = await handleJqlSubscription(
      req,
      operationName,
      subscriptionFilterableArgs,
      query || Object.assign({}, this.presets.default)
    );

    return {
      channel_name: channel,
    };
    */
  }

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
  ) {
    // args should be validated already
    const validatedArgs = <any>args;

    const selectQuery = query || Object.assign({}, this.presets.default);

    //check if the query is valid (no need to actually run it)
    /*     if (this.typeDef)
      generateGiraffeqlResolverTreeFromTypeDefinition(
        selectQuery,
        this.typeDef,
        this.typename,
        fieldPath,
        true
      ); */

    // only allowed to filter subscriptions based on these limited args
    const subscriptionFilterableArgs = {
      createdBy: validatedArgs.createdBy,
    };

    /*
    const channel = await handleJqlSubscription(
      req,
      operationName,
      subscriptionFilterableArgs,
      selectQuery
    );

    return {
      channel_name: channel,
    };
    */
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
    // args should be validated already
    const validatedArgs = <any>args;
    await this.handleLookupArgs(args, fieldPath);

    const selectQuery = query ?? Object.assign({}, this.presets.default);

    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    data.rootArgs = args;

    whereObject.fields.push(
      ...Object.entries(validatedArgs).map(([field, value]) => ({
        field,
        value,
      }))
    );

    const results = await getObjectType({
      typename: this.typename,
      req,
      fieldPath,
      externalQuery: selectQuery,
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
      throw itemNotFoundError(fieldPath);
    }

    return results[0];
  }

  @permissionsCheck("getMultiple")
  async countRecords({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;

    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(validatedArgs.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      validatedArgs.filterBy.forEach((filterByObject) => {
        const filterByAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [],
        };
        filterByOrObject.fields.push(filterByAndObject);
        Object.entries(filterByObject).forEach(
          ([filterKey, filterKeyObject]) => {
            Object.entries(<any>filterKeyObject).forEach(
              ([operationKey, operationValue]) => {
                filterByAndObject.fields.push({
                  field: this.filterFieldsMap[filterKey].field ?? filterKey,
                  operator: <SqlWhereFieldOperator>operationKey,
                  value: operationValue,
                });
              }
            );
          }
        );
      });
    }

    //handle search fields
    if (validatedArgs.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const prop in this.searchFieldsMap) {
        whereSubObject.fields.push({
          field: this.searchFieldsMap[prop].field ?? prop,
          value: new RegExp(escapeRegExp(validatedArgs.search), "i"),
          operator: "regex",
        });
      }

      whereObject.fields.push(whereSubObject);
    }

    const resultsCount = await countObjectType(
      this.typename,
      fieldPath,
      [whereObject],
      true
    );

    return resultsCount;
  }

  @permissionsCheck("getMultiple")
  async getRecords({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;
    const selectQuery = query || Object.assign({}, this.presets.default);

    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(validatedArgs.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      validatedArgs.filterBy.forEach((filterByObject) => {
        const filterByAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [],
        };
        filterByOrObject.fields.push(filterByAndObject);
        Object.entries(filterByObject).forEach(
          ([filterKey, filterKeyObject]) => {
            Object.entries(<any>filterKeyObject).forEach(
              ([operationKey, operationValue]) => {
                filterByAndObject.fields.push({
                  field: this.filterFieldsMap[filterKey].field ?? filterKey,
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
    if (validatedArgs.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const prop in this.searchFieldsMap) {
        whereSubObject.fields.push({
          field: this.searchFieldsMap[prop].field ?? prop,
          value: new RegExp(escapeRegExp(validatedArgs.search), "i"),
          operator: "regex",
        });
      }

      whereObject.fields.push(whereSubObject);
    }

    // process sort fields
    const orderBy: SqlOrderByObject[] = [];
    const rawSelect: SqlSelectQueryObject[] = [{ field: "id", as: "$last_id" }];

    // add secondary, etc. sort parameters
    if (Array.isArray(validatedArgs.sortBy)) {
      orderBy.push(...validatedArgs.sortBy);
    }

    // for each sort param, add it to the rawSelect
    orderBy.forEach((orderByObject, index) => {
      rawSelect.push({
        field: orderByObject.field,
        as: `$last_value_${index}`,
      });
    });

    // always add id asc sort as final sort param
    orderBy.push({
      field: "id",
      desc: false,
    });

    // process the "after" or "before" constraint, if provided
    // only one should have been provided
    if (validatedArgs.after || validatedArgs.before) {
      // parse cursor
      const parsedCursor = JSON.parse(
        btoa(validatedArgs.after || validatedArgs.before)
      );

      const whereOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      // for each orderBy statement, need to generate the required where constraints
      orderBy.forEach((orderByObject, index) => {
        const operator = (
          validatedArgs.before ? !orderByObject.desc : orderByObject.desc
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
    const limit = Number(validatedArgs.first ?? validatedArgs.last);

    const sqlParams: Omit<SqlSelectQuery, "table" | "select"> = {
      where: [whereObject],
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
      groupBy: Array.isArray(validatedArgs.groupBy)
        ? validatedArgs.groupBy.reduce((total, item, index) => {
            if (item in this.groupByFieldsMap) {
              total.push({
                field: this.groupByFieldsMap[item].field ?? item,
              });
            }
            return total;
          }, [])
        : null,
    };

    this.sqlParamsModifier && this.sqlParamsModifier(sqlParams);

    // populate the distinctOn, in case the sqlParamsModifier modified the orderBy
    sqlParams.distinctOn = orderBy.map((ele) => ele.field).concat("id");

    const results = await getObjectType({
      typename: this.typename,
      req,
      fieldPath,
      externalQuery: selectQuery,
      rawSelect,
      sqlParams,
      data,
    });

    return validatedArgs.reverse
      ? validatedArgs.before
        ? results
        : results.reverse()
      : validatedArgs.before
      ? results.reverse()
      : results;
  }

  // convert any lookup/joined fields into IDs, in place.
  async handleLookupArgs(args: any, fieldPath: string[]): Promise<void> {
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
            fieldPath,
          });
        }

        // replace args[key] with the item ID
        args[key] = results[0].id;
      }
    }
  }

  getSpecialParams(inputs: ServiceFunctionInputs): any {
    return undefined;
  }

  sqlParamsModifier(sqlParams: Omit<SqlSelectQuery, "table" | "select">) {}

  // looks up a record using its keys
  async lookupRecord(
    selectFields: string[],
    args: any,
    fieldPath: string[],
    throwError = true
  ): Promise<any> {
    const results = await fetchTableRows({
      select:
        selectFields.length > 0
          ? selectFields.map((field) => ({ field }))
          : [{ field: "id" }],
      table: this.typename,
      where: args,
    });

    if (results.length < 1 && throwError) {
      throw new GiraffeqlBaseError({
        message: `${this.typename} not found`,
        fieldPath,
      });
    }

    return results[0] ?? null;
  }

  // look up multiple records
  async lookupMultipleRecord(
    selectFields: string[],
    whereInput: SqlWhereInput,
    fieldPath: string[]
  ): Promise<any> {
    const results = await fetchTableRows({
      select: selectFields.length > 0 ? selectFields : ["id"],
      table: this.typename,
      where: whereInput,
    });

    return results;
  }

  // count the records matching the criteria
  async getRecordCount(
    whereInput: SqlWhereInput,
    fieldPath: string[]
  ): Promise<any> {
    const recordsCount = await countTableRows({
      table: this.typename,
      where: whereInput,
    });

    return recordsCount;
  }

  isEmptyQuery(query: unknown) {
    return isObject(query) && Object.keys(query).length < 1;
  }

  // generates a valid unique ID for this record
  // will try 3 times before calling it quits
  async generateRecordId(fieldPath: string[], attempt = 0) {
    // if 3 or more tries, throw err
    if (attempt > 2) {
      throw new Error(
        "Unable to generate unique ID for this record after 3 tries"
      );
    }

    const id = await generateId(this.primaryKeyLength);
    // check if the id already is in use
    const recordsCount = await this.getRecordCount(
      {
        id,
      },
      fieldPath
    );

    if (recordsCount < 1) {
      return id;
    }

    return this.generateRecordId(fieldPath, ++attempt);
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
    // args should be validated already
    const validatedArgs = <any>args;
    await this.handleLookupArgs(args, fieldPath);

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
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
    // args should be validated already
    const validatedArgs = <any>args;

    const item = await this.lookupRecord(["id"], validatedArgs.item, fieldPath);

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(validatedArgs.fields, fieldPath);

    await updateObjectType({
      typename: this.typename,
      id: item.id,
      updateFields: {
        ...validatedArgs.fields,
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

  @permissionsCheck("delete")
  async deleteRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;
    // confirm existence of item and get ID
    const item = await this.lookupRecord(["id"], validatedArgs, fieldPath);

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

    await deleteObjectType({
      typename: this.typename,
      id: item.id,
      req,
      fieldPath,
    });

    return requestedResults;
  }
}
