import {
  GiraffeqlObjectTypeLookup,
  GiraffeqlArgsError,
  RootResolverDefinition,
  GiraffeqlInitializationError,
  GiraffeqlRootResolverType,
  GiraffeqlInputType,
  GiraffeqlInputTypeLookup,
  GiraffeqlObjectType,
  GiraffeqlInputFieldType,
  lookupSymbol,
} from "giraffeql";
import { PaginatedService, EnumService } from "../services";
import {
  generatePaginatorPivotResolverObject,
  generateStatsResolverObject,
  generateAggregatorResolverObject,
} from "../helpers/typeDef";
import { capitalizeString, isObject } from "../helpers/shared";
import { Request } from "express";
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
  restMethods = [],
}: {
  service: PaginatedService;
  methods: BaseRootResolverTypes[];
  restMethods?:
    | BaseRootResolverTypes[]
    | {
        [x in BaseRootResolverTypes]?: Partial<
          RootResolverDefinition["restOptions"]
        >;
      };
}): { [x: string]: GiraffeqlRootResolverType } {
  const capitalizedClass = capitalizeString(service.typename);

  const rootResolvers = {};

  const restMethodsArray = Array.isArray(restMethods)
    ? restMethods
    : Object.keys(restMethods);

  // if more than one rest method and no defaultQuery, throw err
  if (restMethodsArray.length > 0 && !service.defaultQuery) {
    throw new GiraffeqlInitializationError({
      message: `Default REST Query must be defined for '${service.typename}'`,
    });
  }

  methods.forEach((method) => {
    const capitalizedMethod = capitalizeString(method);
    switch (method) {
      case "get": {
        const methodName = method + capitalizedClass;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "get",
              route: `/${service.typename}/:id`,
              query: service.defaultQuery,
              ...restMethods[method],
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          args: new GiraffeqlInputFieldType({
            required: true,
            type: service.inputTypeDefLookup,
          }),
          resolver: ({ req, query, args, fieldPath }) => {
            return service.getRecord({
              req,
              query,
              args,
              fieldPath,
            });
          },
        });
        break;
      }
      case "stats": {
        if (service instanceof PaginatedService) {
          const methodName = `get${capitalizeString(service.typename)}Stats`;
          rootResolvers[methodName] = new GiraffeqlRootResolverType(<
            RootResolverDefinition
          >{
            name: methodName,
            ...(restMethodsArray.includes(method) && {
              restOptions: {
                method: "get",
                route: `/${service.typename}:count`,
                query: {
                  count: lookupSymbol,
                },
                // argsTransformer: transformGetMultipleRestArgs,
                ...restMethods[method],
              },
            }),
            ...generateStatsResolverObject({
              pivotService: service,
            }),
          });
        }
        break;
      }
      case "getPaginator": {
        if (service instanceof PaginatedService) {
          const methodName = `get${capitalizeString(
            service.typename
          )}Paginator`;
          rootResolvers[methodName] = new GiraffeqlRootResolverType(<
            RootResolverDefinition
          >{
            name: methodName,
            ...(restMethodsArray.includes(method) && {
              restOptions: {
                method: "get",
                route: `/${service.typename}`,
                query: {
                  paginatorInfo: {
                    total: lookupSymbol,
                    count: lookupSymbol,
                  },
                  edges: {
                    cursor: lookupSymbol,
                    node: service.defaultQuery,
                  },
                },
                argsTransformer: transformGetMultipleRestArgs,
                ...restMethods[method],
              },
            }),
            ...generatePaginatorPivotResolverObject({
              pivotService: service,
            }),
          });
        }
        break;
      }
      case "getAggregator": {
        if (service instanceof PaginatedService) {
          const methodName = `get${capitalizeString(
            service.typename
          )}Aggregator`;
          rootResolvers[methodName] = new GiraffeqlRootResolverType(<
            RootResolverDefinition
          >{
            name: methodName,
            ...(restMethodsArray.includes(method) && {
              restOptions: {
                method: "get",
                route: `/${service.typename}:aggregator`,
                query: {
                  // count: lookupSymbol,
                },
                // argsTransformer: transformGetMultipleRestArgs,
                ...restMethods[method],
              },
            }),
            ...generateAggregatorResolverObject({
              pivotService: service,
            }),
          });
        }
        break;
      }
      case "delete": {
        const methodName = method + capitalizedClass;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "delete",
              route: "/" + service.typename + "/:id",
              query: service.defaultQuery,
              ...restMethods[method],
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          args: new GiraffeqlInputFieldType({
            required: true,
            type: service.inputTypeDefLookup,
          }),
          resolver: ({ req, query, args, fieldPath }) =>
            service.deleteRecord({
              req,
              query,
              args,
              fieldPath,
            }),
        });
        break;
      }
      case "update": {
        const updateArgs = {};
        const methodName = method + capitalizedClass;
        Object.entries(service.getTypeDef().definition.fields).forEach(
          ([key, typeDefField]) => {
            let typeField = typeDefField.type;

            // if typeField is GiraffeqlObjectTypeLookup, convert to GiraffeqlInputTypeLookup
            if (typeField instanceof GiraffeqlObjectTypeLookup) {
              typeField = new GiraffeqlInputTypeLookup(typeField.name);
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
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "put",
              route: "/" + service.typename + "/:id",
              query: service.defaultQuery,
              argsTransformer: (req) => {
                return {
                  item: req.params,
                  fields: {
                    ...req.body,
                  },
                };
              },
              ...restMethods[method],
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
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
                    name: "update" + capitalizedClass + "Fields",
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
          resolver: ({ req, query, args, fieldPath }) =>
            service.updateRecord({ req, query, args, fieldPath }),
        });
        break;
      }
      case "create": {
        const createArgs = {};
        const methodName = method + capitalizedClass;
        Object.entries(service.getTypeDef().definition.fields).forEach(
          ([key, typeDefField]) => {
            let typeField = typeDefField.type;

            // if typeField is GiraffeqlObjectTypeLookup, convert to GiraffeqlInputTypeLookup
            if (typeField instanceof GiraffeqlObjectTypeLookup) {
              typeField = new GiraffeqlInputTypeLookup(typeField.name);
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
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "post",
              route: "/" + service.typename,
              query: service.defaultQuery,
              argsTransformer: (req) => {
                return {
                  ...req.body,
                  ...req.params,
                };
              },
              ...restMethods[method],
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          args: new GiraffeqlInputFieldType({
            required: true,
            type: new GiraffeqlInputType({
              name: methodName,
              fields: createArgs,
            }),
          }),
          resolver: ({ req, query, args, fieldPath }) =>
            service.createRecord({
              req,
              query,
              args,
              fieldPath,
            }),
        });
        break;
      }
      default:
        throw new Error(`Unknown root resolver method requested: '${method}'`);
    }
  });

  return rootResolvers;
}
