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
import { NormalService, PaginatedService, EnumService } from "../services";
import { generatePaginatorPivotResolverObject } from "../helpers/typeDef";
import { capitalizeString, isObject } from "../helpers/shared";
import { Request } from "express";
type BaseRootResolverTypes =
  | "get"
  | "getMultiple"
  | "delete"
  | "create"
  | "update"
  | "created"
  | "deleted"
  | "updated"
  | "listUpdated";

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
  service: NormalService;
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
      case "getMultiple": {
        if (service instanceof PaginatedService) {
          const methodName =
            "get" + capitalizeString(service.paginator.typename);
          rootResolvers[methodName] = new GiraffeqlRootResolverType(<
            RootResolverDefinition
          >{
            name: methodName,
            ...(restMethodsArray.includes(method) && {
              restOptions: {
                method: "get",
                route: "/" + service.typename,
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
        } else {
          throw new GiraffeqlInitializationError({
            message: `Cannot getMultiple of a non-paginated type '${service.typename}'`,
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
                allowNull: typeDefField.allowNull,
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
                allowNull: typeDefField.allowNull,
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
      case "created": {
        const methodName = service.typename + capitalizedMethod;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "post",
              route: "/subscribe/" + service.typename + capitalizedMethod,
              query: service.defaultQuery,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          resolver: ({ req, query, args, fieldPath }) =>
            service.subscribeToMultipleItem(
              service.typename + capitalizedMethod,
              {
                req,
                query,
                args,
                fieldPath,
              }
            ),
        });
        break;
      }
      case "deleted": {
        const methodName = service.typename + capitalizedMethod;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "post",
              route: "/subscribe/" + service.typename + capitalizedMethod,
              query: service.defaultQuery,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          resolver: ({ req, query, args, fieldPath }) =>
            service.subscribeToSingleItem(
              service.typename + capitalizedMethod,
              {
                req,
                query,
                args,
                fieldPath,
              }
            ),
        });
        break;
      }
      case "updated": {
        const methodName = service.typename + capitalizedMethod;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "post",
              route: "/subscribe/" + service.typename + capitalizedMethod,
              query: service.defaultQuery,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          resolver: ({ req, query, args, fieldPath }) =>
            service.subscribeToSingleItem(
              service.typename + capitalizedMethod,
              {
                req,
                query,
                args,
                fieldPath,
              }
            ),
        });
        break;
      }
      case "listUpdated": {
        const methodName = service.typename + capitalizedMethod;
        rootResolvers[methodName] = new GiraffeqlRootResolverType({
          name: methodName,
          ...(restMethodsArray.includes(method) && {
            restOptions: {
              method: "post",
              route: "/subscribe/" + service.typename + capitalizedMethod,
              query: service.defaultQuery,
            },
          }),
          type: service.typeDefLookup,
          allowNull: false,
          resolver: ({ req, query, args, fieldPath }) =>
            service.subscribeToMultipleItem(
              service.typename + capitalizedMethod,
              {
                req,
                query,
                args,
                fieldPath,
              }
            ),
        });
        break;
      }

      default:
        throw new Error(`Unknown root resolver method requested: '${method}'`);
    }
  });

  return rootResolvers;
}

export function generateEnumRootResolver(enumService: EnumService): {
  [x: string]: GiraffeqlRootResolverType;
} {
  const capitalizedClass = capitalizeString(enumService.paginator.typename);
  const methodName = "get" + capitalizedClass;
  const rootResolvers = {
    [methodName]: new GiraffeqlRootResolverType({
      name: methodName,
      ...(enumService.defaultQuery && {
        restOptions: {
          method: "get",
          route: "/" + enumService.paginator.typename,
          query: enumService.defaultQuery,
        },
      }),
      allowNull: false,
      type: enumService.paginator.typeDef,
      resolver: ({ req, args, query, fieldPath }) =>
        enumService.paginator.getRecord({
          req,
          args,
          query,
          fieldPath,
        }),
    }),
  };

  return rootResolvers;
}
