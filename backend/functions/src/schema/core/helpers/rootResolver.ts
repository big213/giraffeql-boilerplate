import {
  GiraffeqlObjectTypeLookup,
  GiraffeqlArgsError,
  RootResolverDefinition,
  GiraffeqlRootResolverType,
  GiraffeqlInputType,
  GiraffeqlInputTypeLookup,
  GiraffeqlObjectType,
  GiraffeqlInputFieldType,
} from "giraffeql";
import { PaginatedService } from "../services";
import {
  generatePaginatorPivotResolverObject,
  generateStatsResolverObject,
  generateAggregatorResolverObject,
  GiraffeqlObjectTypeLookupService,
  processLookupArgs,
} from "../helpers/typeDef";
import {
  capitalizeString,
  escapeRegExp,
  generateCursorFromNode,
  getNestedProperty,
  getUpdatedFieldValues,
  isObject,
} from "../helpers/shared";
import { Request } from "express";
import {
  RestOptions,
  RootResolverFunction,
  StringKeyObject,
  ValidatorFunction,
} from "giraffeql/lib/types";
import { ExternalQuery, ServiceFunctionInputs } from "../../../types";
import { getObjectType } from "./resolver";
import { ItemNotFoundError } from "./error";
import {
  fetchTableRows,
  isKnexRawStatement,
  SqlSelectQuery,
  SqlSimpleOrderByObject,
  SqlSimpleRawSelectObject,
  SqlSimpleSelectObject,
  SqlWhereFieldOperator,
  SqlWhereObject,
} from "./sql";
import { generateSqlSingleFieldObject } from "./sqlHelper";
import { db } from "../../../utils/knex";
import { Knex } from "knex";
type BaseRootResolverTypes =
  | "get"
  | "getPaginator"
  | "getAggregator"
  | "stats"
  | "delete"
  | "create"
  | "update";

export function transformGetMultipleRestArgs(req: Request) {
  // is req.query.__args defined? if so, snapshot it, delete it, and merge it in last
  const queryArgs = <any>req.query.__args;
  delete req.query.__args;

  const args = {
    ...req.query,
    ...req.params,
  };

  // convert anything with "filterBy-<eq>.*"" into a filter object
  const filterByObject = Object.entries(args).reduce((total, [key, value]) => {
    const filterMatch = key.match(/^filterBy-([a-z]+)\.(.*)/);
    if (filterMatch) {
      total[filterMatch[2]] = {
        [filterMatch[1]]: value,
      };

      // also need to delete this param from the args
      delete args[key];
    }

    return total;
  }, {});

  // add it to the args
  args.filterBy = Object.keys(filterByObject).length ? [filterByObject] : [];

  // convert anything with "sortBy.*=asc/desc" into a sortBy object
  const sortByArray = Object.entries(args).reduce((total, [key, value]) => {
    const filterMatch = key.match(/^sortBy\.(.*)/);
    if (filterMatch) {
      total.push({
        field: filterMatch[1],
        desc: value === "desc",
      });

      // also need to delete this param from the args
      delete args[key];
    }

    return total;
  }, <any>[]);

  args.sortBy = sortByArray;

  // if query.__args was specified, merge it into args last
  if (queryArgs) {
    const decodedArgs = JSON.parse(
      Buffer.from(decodeURIComponent(queryArgs), "base64").toString()
    );

    Object.assign(args, decodedArgs);
  }

  return args;
}

export function generateBaseRootResolvers({
  service,
  methods,
}: {
  service: PaginatedService;
  methods: {
    type: BaseRootResolverTypes;
    validator?: ValidatorFunction | ValidatorFunction[];
    restOptions?: Partial<RestOptions> & { query: ExternalQuery };
    resolver?: RootResolverFunction;
    name?: string;
    additionalArgs?: {
      [x in string]:
        | GiraffeqlInputFieldType
        | GiraffeqlInputTypeLookup
        | undefined;
    };
  }[];
}): { [x: string]: GiraffeqlRootResolverType } {
  const rootResolvers = {};

  methods.forEach((method) => {
    switch (method.type) {
      case "get": {
        const methodName = method.name ?? `${service.typename}Get`;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(method.restOptions && {
            restOptions: {
              method: "get",
              route: `/${service.typename}/:id`,
              ...method.restOptions,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          args: new GiraffeqlInputFieldType({
            required: true,
            type: service.inputTypeDefLookup,
          }),
          validator: method.validator,
          resolver: method.resolver ?? generateGetRootResolver(service),
        });
        break;
      }
      case "stats": {
        if (service instanceof PaginatedService) {
          const methodName = method.name ?? `${service.typename}GetStats`;
          rootResolvers[methodName] = new GiraffeqlRootResolverType(<
            RootResolverDefinition
          >{
            name: methodName,
            ...(method.restOptions && {
              restOptions: {
                method: "get",
                route: `/${service.typename}:count`,
                // argsTransformer: transformGetMultipleRestArgs,
                ...method.restOptions,
              },
            }),
            validator: method.validator,
            ...generateStatsResolverObject({
              pivotService: service,
              rootResolver: method.resolver,
            }),
          });
        }
        break;
      }
      case "getPaginator": {
        if (service instanceof PaginatedService) {
          const methodName = method.name ?? `${service.typename}GetPaginator`;
          rootResolvers[methodName] = new GiraffeqlRootResolverType(<
            RootResolverDefinition
          >{
            name: methodName,
            ...(method.restOptions && {
              restOptions: {
                method: "get",
                route: `/${service.typename}`,
                argsTransformer: transformGetMultipleRestArgs,
                ...method.restOptions,
              },
            }),
            validator: method.validator,
            ...generatePaginatorPivotResolverObject({
              pivotService: service,
              rootResolver: method.resolver,
            }),
          });
        }
        break;
      }
      case "getAggregator": {
        if (service instanceof PaginatedService) {
          const methodName = method.name ?? `${service.typename}GetAggregator`;
          rootResolvers[methodName] = new GiraffeqlRootResolverType(<
            RootResolverDefinition
          >{
            name: methodName,
            ...(method.restOptions && {
              restOptions: {
                method: "get",
                route: `/${service.typename}:aggregator`,
                // argsTransformer: transformGetMultipleRestArgs,
                ...method.restOptions,
              },
            }),
            validator: method.validator,
            ...generateAggregatorResolverObject({
              pivotService: service,
              rootResolver: method.resolver,
            }),
          });
        }
        break;
      }
      case "delete": {
        const methodName = method.name ?? `${service.typename}Delete`;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(method.restOptions && {
            restOptions: {
              method: "delete",
              route: `/${service.typename}/:id`,
              ...method.restOptions,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          validator: method.validator,
          args: new GiraffeqlInputFieldType({
            required: true,
            type: service.inputTypeDefLookup,
          }),
          resolver: method.resolver ?? generateDeleteRootResolver({ service }),
        });
        break;
      }
      case "update": {
        const updateArgs = {};
        const methodName = method.name ?? `${service.typename}Update`;
        Object.entries(service.getTypeDef().definition.fields).forEach(
          ([key, typeDefField]) => {
            let typeField = typeDefField.type;

            // if typeField is GiraffeqlObjectTypeLookup/Service, get the corresponding input
            if (typeField instanceof GiraffeqlObjectTypeLookup) {
              if (!(typeField instanceof GiraffeqlObjectTypeLookupService)) {
                typeField = new GiraffeqlInputTypeLookup(typeField.name);
              } else {
                typeField = typeField.service.inputTypeDefLookup;
              }
            } else if (typeField instanceof GiraffeqlObjectType) {
              typeField = new GiraffeqlInputTypeLookup(
                typeField.definition.name
              );
            }

            if (typeDefField.updateable) {
              // generate the argDefinition for the string type
              updateArgs[key] = new GiraffeqlInputFieldType({
                type: typeField,
                required: false,
                allowNull:
                  typeDefField.allowNullInput ?? typeDefField.allowNull,
                arrayOptions: typeDefField.arrayOptions,
              });
            }
          }
        );

        // add any additional or override args
        if (method.additionalArgs) {
          Object.assign(updateArgs, method.additionalArgs);
        }

        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(method.restOptions && {
            restOptions: {
              method: "put",
              route: `/${service.typename}/:id`,
              argsTransformer: (req) => {
                return {
                  item: req.params,
                  fields: {
                    ...req.body,
                  },
                };
              },
              ...method.restOptions,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          validator: method.validator,
          args: new GiraffeqlInputFieldType({
            required: true,
            type: new GiraffeqlInputType({
              name: methodName,
              fields: {
                item: new GiraffeqlInputFieldType({
                  type: service.inputTypeDefLookup,
                  required: true,
                }),
                fields: new GiraffeqlInputFieldType({
                  type: new GiraffeqlInputType({
                    name: `${methodName}Args`,
                    fields: updateArgs,
                    inputsValidator: (args, fieldPath) => {
                      // check if at least 1 valid update field provided
                      if (!isObject(args)) {
                        throw new GiraffeqlArgsError({
                          message: `Object args required`,
                          fieldPath,
                        });
                      }

                      const { id, ...updateFields } = args;
                      if (Object.keys(updateFields).length < 1)
                        throw new GiraffeqlArgsError({
                          message: `No valid fields to update`,
                          fieldPath,
                        });
                    },
                  }),
                  required: true,
                }),
              },
            }),
          }),
          resolver: method.resolver ?? generateUpdateRootResolver({ service }),
        });
        break;
      }
      case "create": {
        const createArgs = {};
        const methodName = method.name ?? `${service.typename}Create`;
        Object.entries(service.getTypeDef().definition.fields).forEach(
          ([key, typeDefField]) => {
            let typeField = typeDefField.type;

            // if typeField is GiraffeqlObjectTypeLookup/Service, get the corresponding input
            if (typeField instanceof GiraffeqlObjectTypeLookup) {
              if (!(typeField instanceof GiraffeqlObjectTypeLookupService)) {
                typeField = new GiraffeqlInputTypeLookup(typeField.name);
              } else {
                typeField = typeField.service.inputTypeDefLookup;
              }
            } else if (typeField instanceof GiraffeqlObjectType) {
              typeField = new GiraffeqlInputTypeLookup(
                typeField.definition.name
              );
            }

            if (typeDefField.addable) {
              // generate the argDefinition for the string type
              createArgs[key] = new GiraffeqlInputFieldType({
                type: typeField,
                required: typeDefField.required,
                allowNull:
                  typeDefField.allowNullInput ?? typeDefField.allowNull,
                arrayOptions: typeDefField.arrayOptions,
              });
            }
          }
        );

        // add any additional or override args
        if (method.additionalArgs) {
          Object.assign(createArgs, method.additionalArgs);
        }

        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(method.restOptions && {
            restOptions: {
              method: "post",
              route: `/${service.typename}`,
              argsTransformer: (req) => {
                return {
                  ...req.body,
                  ...req.params,
                };
              },
              ...method.restOptions,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          validator: method.validator,
          args: new GiraffeqlInputFieldType({
            required: true,
            type: new GiraffeqlInputType({
              name: `${methodName}Args`,
              fields: createArgs,
            }),
          }),
          resolver: method.resolver ?? generateCreateRootResolver({ service }),
        });
        break;
      }

      default:
        throw new Error(
          `Unknown root resolver method requested: '${method.type}'`
        );
    }
  });

  return rootResolvers;
}

export function generateRootResolverTypeCreateOperation({
  service,
  operation,
  validator,
  argFields,
  resolver,
}: {
  service: PaginatedService;
  operation: string;
  validator?: ValidatorFunction | ValidatorFunction[];
  argFields:
    | null
    | {
        [x in string]:
          | GiraffeqlInputFieldType
          | GiraffeqlInputTypeLookup
          | undefined;
      };
  resolver: RootResolverFunction;
}) {
  const methodName = `${service.typename}${capitalizeString(operation)}`;
  return new GiraffeqlRootResolverType({
    name: methodName,
    restOptions: {
      method: "post",
      route: `/${service.typename}/${operation}`,
      argsTransformer: (req) => {
        return {
          ...req.body,
          ...req.params,
        };
      },
    },
    type: service.typeDefLookup,
    allowNull: false,
    validator,
    args: argFields
      ? new GiraffeqlInputFieldType({
          required: true,
          type: new GiraffeqlInputType({
            name: `${methodName}Args`,
            fields: <any>argFields,
          }),
        })
      : undefined,
    resolver,
  });
}

export function generateRootResolverTypeUpdateOperation({
  service,
  operation,
  validator,
  argFields,
  resolver,
}: {
  service: PaginatedService;
  operation: string;
  validator?: ValidatorFunction | ValidatorFunction[];
  argFields:
    | null
    | {
        [x in string]:
          | GiraffeqlInputFieldType
          | GiraffeqlInputTypeLookup
          | undefined;
      };
  resolver: RootResolverFunction;
}) {
  const methodName = `${service.typename}${capitalizeString(operation)}`;
  return new GiraffeqlRootResolverType({
    name: methodName,
    restOptions: {
      method: "put",
      route: `/${service.typename}/:id/${operation}`,
      argsTransformer: (req) => {
        return {
          item: req.params,
          ...req.body,
        };
      },
    },
    type: service.typeDefLookup,
    allowNull: false,
    validator,
    // if no args, do a direct lookup of the item
    args: argFields
      ? new GiraffeqlInputFieldType({
          required: true,
          type: new GiraffeqlInputType({
            name: `${methodName}Args`,
            fields: {
              item: new GiraffeqlInputFieldType({
                type: service.inputTypeDefLookup,
                required: true,
              }),
              ...(<any>argFields),
            },
          }),
        })
      : new GiraffeqlInputFieldType({
          required: true,
          allowNull: false,
          type: service.inputTypeDefLookup,
        }),
    resolver,
  });
}

export async function processRootResolverArgs(inputs: ServiceFunctionInputs) {
  if (!inputs.processedArgs) {
    inputs.processedArgs = await processLookupArgs(
      inputs.args,
      inputs.rootResolver.definition.args
    );
  }

  return inputs;
}

export function generateGetRootResolver(service: PaginatedService) {
  return async function getRecord(inputs: ServiceFunctionInputs) {
    const { req, rootResolver, fieldPath, query, processedArgs } =
      await processRootResolverArgs(inputs);

    const results = await getObjectType({
      typename: service.typename,
      req,
      rootResolver,
      fieldPath,
      externalQuery: query,
      sqlParams: {
        where: {
          id: processedArgs,
        },
        limit: 1,
        specialParams: await service.getSpecialParams(inputs),
      },
    });

    if (results.length < 1) {
      throw new ItemNotFoundError({ fieldPath });
    }

    return results[0];
  };
}

export function generateGetStatsRootResolver(service: PaginatedService) {
  return async function getRecord(inputs: ServiceFunctionInputs) {
    const { req, rootResolver, fieldPath, query, processedArgs } =
      await processRootResolverArgs(inputs);
    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(processedArgs.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      processedArgs.filterBy.forEach((filterByObject) => {
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
                    service.filterFieldsMap[filterKey].field ?? filterKey
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
    if (processedArgs.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const field in service.searchFieldsMap) {
        const fieldPath = service.searchFieldsMap[field].field ?? field;

        // if there is a custom handler on the options, use that
        const customProcessor = service.searchFieldsMap[field].customProcessor;
        if (customProcessor) {
          customProcessor(
            whereSubObject,
            processedArgs.search,
            service.searchFieldsMap[field],
            fieldPath
          );
        } else {
          // if field options has exact, ony allow eq
          if (service.searchFieldsMap[field].exact) {
            whereSubObject.fields.push({
              field: fieldPath,
              value: processedArgs.search.query,
              operator: "eq",
            });
          } else {
            whereSubObject.fields.push({
              field: fieldPath,
              value: new RegExp(escapeRegExp(processedArgs.search.query), "i"),
              operator: "regex",
            });
          }
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    return {
      ...(query?.count !== undefined && {
        count: await service.countSqlRecord({
          field: "id",
          where: [whereObject],
          distinct: true,
        }),
      }),
    };
  };
}

export function generateGetPaginatorRootResolver(service: PaginatedService) {
  return async function getRecordPaginator(inputs: ServiceFunctionInputs) {
    const { req, rootResolver, fieldPath, query, processedArgs } =
      await processRootResolverArgs(inputs);

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

    // this helper function processes the processedArgs.filterBy, processedArgs.search, and processedArgs.distance
    service.processFilterArgs(processedArgs, whereObject, rawSelect);

    // create a snapshot of the whereObject (before applying after/before), for calculating the total
    const countWhereObject = {
      ...whereObject,
      fields: whereObject.fields.slice(),
    };

    // process sort fields
    const orderBy: SqlSimpleOrderByObject[] = [];

    // add secondary, etc. sort parameters
    if (Array.isArray(processedArgs.sortBy)) {
      orderBy.push(
        ...processedArgs.sortBy.map((sortByObject) => {
          if (service.distanceFieldsMap[sortByObject.field]) {
            // if it is a distanceField, confirm that the distance field was specified
            if (!processedArgs.distance?.[sortByObject.field]) {
              throw new Error(
                `If sorting by '${sortByObject.field}', distance parameters must be provided for this field`
              );
            }
            return {
              ...sortByObject,
              field: db.raw(sortByObject.field),
            };
          } else {
            const sortFieldOptions = service.sortFieldsMap[sortByObject.field];

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
    if (processedArgs.after || processedArgs.before) {
      // parse cursor
      const parsedCursor = JSON.parse(
        atob(processedArgs.after || processedArgs.before)
      );

      const whereOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      // for each orderBy statement, need to generate the required where constraints
      orderBy.forEach((orderByObject, index) => {
        // if it is a raw filter field, skip
        if (isKnexRawStatement(orderByObject.field)) return;

        const operator = (
          processedArgs.before ? !orderByObject.desc : orderByObject.desc
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

    // set limit to processedArgs.first or processedArgs.last, one of which must be provided
    const limit = Number(processedArgs.first ?? processedArgs.last);

    const sqlParams: Omit<SqlSelectQuery, "table" | "select"> = {
      where: [whereObject],
      rawSelect,
      orderBy,
      limit,
      specialParams: await service.getSpecialParams(inputs),
      distinctOn: undefined,
      groupBy: Array.isArray(processedArgs.groupBy)
        ? processedArgs.groupBy.reduce((total, item, index) => {
            if (item in service.groupByFieldsMap) {
              total.push({
                field: service.groupByFieldsMap[item].field ?? item,
              });
            }
            return total;
          }, [])
        : null,
    };

    service.sqlParamsModifier?.(sqlParams);

    // populate the distinctOn, in case the sqlParamsModifier modified the orderBy
    sqlParams.distinctOn = orderBy.reduce((total, ele) => {
      total.push(ele.field);
      return total;
    }, <(string | Knex.Raw)[]>[]);

    const results = await getObjectType({
      typename: service.typename,
      additionalSelect,
      req,
      rootResolver,
      fieldPath,
      externalQuery: query.edges?.node ?? {},
      sqlParams,
    });

    const validatedResults = processedArgs.reverse
      ? processedArgs.before
        ? results
        : results.reverse()
      : processedArgs.before
      ? results.reverse()
      : results;

    return {
      ...(query.paginatorInfo && {
        paginatorInfo: {
          ...(query.paginatorInfo.total && {
            total: await service.countSqlRecord({
              where: [countWhereObject],
              distinct: true,
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
  };
}

export function generateGetAggregatorRootResolver(service: PaginatedService) {
  return async function getRecordAggregator(inputs: ServiceFunctionInputs) {
    const { req, rootResolver, fieldPath, query, processedArgs } =
      await processRootResolverArgs(inputs);

    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(processedArgs.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      processedArgs.filterBy.forEach((filterByObject) => {
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
                    service.filterFieldsMap[filterKey].field ?? filterKey
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
    if (processedArgs.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const field in service.searchFieldsMap) {
        const fieldPath = service.searchFieldsMap[field].field ?? field;

        // if there is a custom handler on the options, use that
        const customProcessor = service.searchFieldsMap[field].customProcessor;
        if (customProcessor) {
          customProcessor(
            whereSubObject,
            processedArgs.search,
            service.searchFieldsMap[field],
            fieldPath
          );
        } else {
          // if field options has exact, ony allow eq
          if (service.searchFieldsMap[field].exact) {
            whereSubObject.fields.push({
              field: fieldPath,
              value: processedArgs.search.query,
              operator: "eq",
            });
          } else {
            whereSubObject.fields.push({
              field: fieldPath,
              value: new RegExp(escapeRegExp(processedArgs.search.query), "i"),
              operator: "regex",
            });
          }
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    const selectObjects: SqlSimpleSelectObject[] = [
      {
        field: service.aggregatorOptions!.keys[processedArgs.keyField].field,
        getter: service.aggregatorOptions!.keys[processedArgs.keyField].getter,
        as: "key",
      },
    ];

    Object.entries(service.aggregatorOptions!.values).forEach(
      ([key, value]) => {
        if (key in query) {
          selectObjects.push({
            field: service.aggregatorOptions!.values[key].field,
            getter: service.aggregatorOptions!.values[key].getter,
            as: key,
          });
        }
      }
    );

    const results = await fetchTableRows({
      select: selectObjects,
      table: service.typename,
      where: [whereObject],
      groupBy: [db.raw(`"key"`)],
      orderBy: [
        {
          field: db.raw(`"${processedArgs.sortBy?.field ?? "key"}"`),
          desc: processedArgs.sortBy?.desc === true,
        },
      ],
    });

    return results;
  };
}

export type CreateRecordOptions = {
  beforeTransaction?: ({
    inputs,
    data,
  }: {
    inputs: ServiceFunctionInputs;
    data: any;
  }) => Promise<void> | void;
  getCreateFields?: ({
    inputs,
    data,
    transaction,
  }: {
    inputs: ServiceFunctionInputs;
    data: any;
    transaction: Knex.Transaction;
  }) => Promise<StringKeyObject> | StringKeyObject;
  afterCreate?: ({
    inputs,
    itemId,
    data,
    transaction,
  }: {
    inputs: ServiceFunctionInputs;
    itemId: string;
    data: any;
    transaction: Knex.Transaction;
  }) => Promise<void> | void;
};

export type UpdateRecordOptions = {
  fields?: string[];
  pathToItem?: string | null;
  beforeTransaction?: ({
    inputs,
    item,
    data,
    updatedFieldsObject,
  }: {
    inputs: ServiceFunctionInputs;
    item: any;
    data: any;
    updatedFieldsObject?: any;
  }) => Promise<void> | void;
  getUpdateFields?: ({
    inputs,
    item,
    data,
    updatedFieldsObject,
    transaction,
  }: {
    inputs: ServiceFunctionInputs;
    item: any;
    data: any;
    updatedFieldsObject?: any;
    transaction: Knex.Transaction;
  }) => Promise<void | StringKeyObject> | (void | StringKeyObject);
  afterUpdate?: ({
    inputs,
    item,
    data,
    updatedFieldsObject,
    transaction,
  }: {
    inputs: ServiceFunctionInputs;
    item: any;
    data: any;
    updatedFieldsObject?: any;
    transaction: Knex.Transaction;
  }) => Promise<void> | void;
};

export type DeleteRecordOptions = {
  fields?: string[];
  beforeTransaction?: ({
    inputs,
    item,
    data,
  }: {
    inputs: ServiceFunctionInputs;
    item: any;
    data: any;
  }) => Promise<void> | void;
  beforeDelete?: ({
    inputs,
    item,
    data,
    transaction,
  }: {
    inputs: ServiceFunctionInputs;
    item: any;
    data: any;
    transaction: Knex.Transaction;
  }) => Promise<void> | void;
  afterDelete?: ({
    inputs,
    item,
    data,
    transaction,
  }: {
    inputs: ServiceFunctionInputs;
    item: any;
    data: any;
    transaction: Knex.Transaction;
  }) => Promise<void> | void;
  onDeleteEntries?: {
    service: PaginatedService;
    field?: string;
    getFieldValue?: (item) => any;
    recursive?: boolean;
  }[];
};

export function generateCreateRootResolver({
  service,
  options,
}: {
  service: PaginatedService;
  options?: CreateRecordOptions;
}) {
  return async function createRecord(inputs: ServiceFunctionInputs) {
    const { req, rootResolver, fieldPath, query, processedArgs } =
      await processRootResolverArgs(inputs);

    const data = {};

    await options?.beforeTransaction?.({ inputs, data });

    let addResults;
    await db.transaction(async (transaction) => {
      const createFields = await options?.getCreateFields?.({
        inputs,
        data,
        transaction,
      });

      addResults = await service.createSqlRecord({
        fields: {
          ...(createFields || processedArgs),
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
      await options?.afterCreate?.({
        inputs,
        itemId: addResults.id,
        data,
        transaction,
      });
    });

    return service.getReturnQuery({
      id: addResults.id,
      inputs,
    });
  };
}

export function generateUpdateRootResolver({
  service,
  options,
}: {
  service: PaginatedService;
  options?: UpdateRecordOptions;
}) {
  return async function updateRecord(inputs: ServiceFunctionInputs) {
    const { req, rootResolver, fieldPath, processedArgs, query } =
      await processRootResolverArgs(inputs);

    const data = {};

    const item = await service.getFirstSqlRecord(
      {
        select: ["id"].concat(options?.fields ?? []),
        where: {
          id:
            options?.pathToItem === null
              ? processedArgs
              : getNestedProperty(processedArgs, options?.pathToItem ?? "item"),
        },
      },
      true
    );

    const updatedFieldsObject =
      options?.fields && processedArgs.fields
        ? getUpdatedFieldValues(processedArgs.fields, item, options.fields)
        : undefined;

    await options?.beforeTransaction?.({
      inputs,
      item,
      data,
      updatedFieldsObject,
    });

    await db.transaction(async (transaction) => {
      const updateFields = await options?.getUpdateFields?.({
        inputs,
        item,
        data,
        updatedFieldsObject,
        transaction,
      });

      await service.updateSqlRecord(
        {
          fields: updateFields ?? processedArgs.fields,
          where: {
            id: item.id,
          },
          transaction,
        },
        true
      );

      // do post-update fn, if any
      await options?.afterUpdate?.({
        inputs,
        item,
        data,
        updatedFieldsObject,
        transaction,
      });
    });

    return service.getReturnQuery({
      id: item.id,
      inputs,
    });
  };
}

export function generateDeleteRootResolver({
  service,
  options,
}: {
  service: PaginatedService;
  options?: DeleteRecordOptions;
}) {
  return async function deleteRecord(inputs: ServiceFunctionInputs) {
    const { req, rootResolver, fieldPath, processedArgs, query } =
      await processRootResolverArgs(inputs);

    const data = {};

    // confirm existence of item and get ID
    const item = await service.getFirstSqlRecord(
      {
        select: ["id"].concat(options?.fields ?? []),
        where: { id: processedArgs },
      },
      true
    );

    await options?.beforeTransaction?.({ inputs, item, data });

    let requestedQuery;

    // delete the type and also any associated services
    await db.transaction(async (transaction) => {
      await options?.beforeDelete?.({
        inputs,
        item,
        data,
        transaction,
      });

      requestedQuery = await service.getReturnQuery({
        id: item.id,
        inputs,
        transaction,
      });

      await service.deleteSqlRecord({
        where: {
          id: item.id,
        },
        transaction,
      });

      if (options?.onDeleteEntries) {
        for (const deleteEntry of options.onDeleteEntries) {
          if (deleteEntry.service === service && deleteEntry.recursive) {
            // if it's the same service and deleting recursively, fetch the IDs of all child elements that need to be deleted, and then delete them all at once
            const idsToDelete: any[] = [];

            let newlyDiscoveredIdsToDelete: any[] = [
              deleteEntry.getFieldValue?.(item) ?? item.id,
            ];

            while (newlyDiscoveredIdsToDelete.length) {
              const recordsToDelete = await deleteEntry.service.getAllSqlRecord(
                {
                  select: ["id"],
                  where: [
                    {
                      field: deleteEntry.field ?? service.typename,
                      operator: "in",
                      value: newlyDiscoveredIdsToDelete,
                    },
                  ],
                  transaction,
                }
              );

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
                [deleteEntry.field ?? service.typename]:
                  deleteEntry.getFieldValue?.(item) ?? item.id,
              },
              transaction,
            });
          }
        }
      }

      // do post-delete fn, if any
      await options?.afterDelete?.({
        inputs,
        item,
        data,
        transaction,
      });
    });

    return requestedQuery;
  };
}
