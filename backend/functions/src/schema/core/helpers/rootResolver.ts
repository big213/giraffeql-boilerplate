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
import { PaginatedService } from "../services";
import {
  generatePaginatorPivotResolverObject,
  generateStatsResolverObject,
  generateAggregatorResolverObject,
  GiraffeqlObjectTypeLookupService,
} from "../helpers/typeDef";
import { capitalizeString, isObject } from "../helpers/shared";
import { Request } from "express";
import { RestOptions } from "giraffeql/lib/types";
import { ExternalQuery } from "../../../types";
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
    restOptions?: Partial<RestOptions> & { query: ExternalQuery };
    additionalArgs?: {
      [x in string]:
        | GiraffeqlInputFieldType
        | GiraffeqlInputTypeLookup
        | undefined;
    };
  }[];
}): { [x: string]: GiraffeqlRootResolverType } {
  const capitalizedClass = capitalizeString(service.typename);

  const rootResolvers = {};

  methods.forEach((method) => {
    switch (method.type) {
      case "get": {
        const methodName = `${service.typename}Get`;
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
          resolver: (inputs) => {
            return service.getRecord(inputs);
          },
        });
        break;
      }
      case "stats": {
        if (service instanceof PaginatedService) {
          const methodName = `${service.typename}GetStats`;
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
            ...generateStatsResolverObject({
              pivotService: service,
            }),
          });
        }
        break;
      }
      case "getPaginator": {
        if (service instanceof PaginatedService) {
          const methodName = `${service.typename}GetPaginator`;
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
            ...generatePaginatorPivotResolverObject({
              pivotService: service,
            }),
          });
        }
        break;
      }
      case "getAggregator": {
        if (service instanceof PaginatedService) {
          const methodName = `${service.typename}GetAggregator`;
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
            ...generateAggregatorResolverObject({
              pivotService: service,
            }),
          });
        }
        break;
      }
      case "delete": {
        const methodName = `${service.typename}Delete`;
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
          args: new GiraffeqlInputFieldType({
            required: true,
            type: service.inputTypeDefLookup,
          }),
          resolver: (inputs) => service.deleteRecord(inputs),
        });
        break;
      }
      case "update": {
        const updateArgs = {};
        const methodName = `${service.typename}Update`;
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
                    name: `update${capitalizedClass}Args`,
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
          resolver: (inputs) => service.updateRecord(inputs),
        });
        break;
      }
      case "create": {
        const createArgs = {};
        const methodName = `${service.typename}Create`;
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
          args: new GiraffeqlInputFieldType({
            required: true,
            type: new GiraffeqlInputType({
              name: `create${capitalizedClass}Args`,
              fields: createArgs,
            }),
          }),
          resolver: (inputs) => service.createRecord(inputs),
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
