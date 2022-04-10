import {
  ObjectTypeDefinitionField,
  ScalarDefinition,
  InputTypeDefinition,
  ResolverFunction,
  RootResolverFunction,
  GiraffeqlArgsError,
  objectTypeDefs,
  GiraffeqlInitializationError,
  GiraffeqlInputType,
  GiraffeqlScalarType,
  GiraffeqlObjectTypeLookup,
  GiraffeqlObjectType,
  GiraffeqlInputFieldType,
  ArrayOptions,
  inputTypeDefs,
} from "giraffeql";
import { knex } from "../../../utils/knex";
import { isObject } from "./shared";
import {
  BaseService,
  LinkService,
  NormalService,
  PaginatedService,
} from "../services";
import * as Scalars from "../../scalars";
import type {
  ObjectTypeDefSqlOptions,
  SqlType,
  StringKeyObject,
} from "../../../types";
import { getObjectType } from "./resolver";
import { SqlSelectQuery } from "./sql";

type GenerateFieldParams = {
  name?: string;
  description?: string;
  allowNull: boolean;
  hidden?: boolean;
  nestHidden?: boolean;
  defaultValue?: unknown;
  sqlOptions?: Partial<ObjectTypeDefSqlOptions>;
  typeDefOptions?: Partial<ObjectTypeDefinitionField>;
};

/*
 ** Standard Fields
 */

// generic field builder
export function generateStandardField(
  params: {
    sqlType?: SqlType;
    type: GiraffeqlScalarType | GiraffeqlObjectTypeLookup | GiraffeqlObjectType;
    arrayOptions?: ArrayOptions;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull,
    arrayOptions,
    hidden = false,
    nestHidden = false,
    defaultValue,
    sqlType,
    type,
    sqlOptions,
    typeDefOptions,
  } = params;

  const typeDef = <ObjectTypeDefinitionField>{
    type,
    description,
    arrayOptions,
    allowNull,
    required: defaultValue === undefined && !allowNull,
    sqlOptions: sqlType
      ? {
          type: sqlType,
          ...(defaultValue !== undefined && { defaultValue: defaultValue }),
          ...sqlOptions,
        }
      : undefined,
    hidden,
    nestHidden,
    addable: true, // default addable and updateable
    updateable: true,
    ...typeDefOptions,
  };
  return typeDef;
}

// NOT a sql field.
export function generateGenericScalarField(
  params: {
    type: GiraffeqlScalarType;
    arrayOptions?: ArrayOptions;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    arrayOptions,
    defaultValue,
    hidden,
    nestHidden,
    type,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    arrayOptions,
    defaultValue,
    hidden,
    nestHidden,
    type: type ?? Scalars.string,
    sqlOptions,
    typeDefOptions,
  });
}

export function generateStringField(
  params: {
    type?: GiraffeqlScalarType;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    type,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "string",
    type: type ?? Scalars.string,
    sqlOptions,
    typeDefOptions,
  });
}

// DateTime as UNIX timestamp
export function generateUnixTimestampField(
  params: {
    nowOnly?: boolean; // if the unix timestamp can only be set to now()
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
    nowOnly,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "dateTime",
    type: Scalars.unixTimestamp,
    sqlOptions: {
      getter: (tableAlias, field) =>
        `extract(epoch from "${tableAlias}".${field})`,
      parseValue: nowOnly
        ? () => knex.fn.now()
        : (value: unknown) => {
            // if null, allow null value
            if (value === null) return null;
            if (typeof value !== "number")
              throw new Error("Unix timestamp must be sent in seconds"); // should never happen
            // assuming the timestamp is being sent in seconds
            return new Date(value * 1000);
          },
      ...sqlOptions,
    },
    typeDefOptions,
  });
}

export function generateDateField(params: GenerateFieldParams) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "date",
    type: Scalars.date,
    sqlOptions,
    typeDefOptions,
  });
}

export function generateTextField(params: GenerateFieldParams) {
  const {
    description,
    allowNull = true,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull: allowNull,
    hidden,
    nestHidden,
    sqlType: "text",
    type: Scalars.string,
    sqlOptions,
    typeDefOptions,
  });
}

export function generateIntegerField(params: GenerateFieldParams) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "integer",
    type: Scalars.number,
    sqlOptions,
    typeDefOptions,
  });
}

export function generateFloatField(params: GenerateFieldParams) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "float",
    type: Scalars.number,
    sqlOptions,
    typeDefOptions,
  });
}

export function generateDecimalField(params: GenerateFieldParams) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "decimal",
    type: Scalars.number,
    sqlOptions,
    typeDefOptions,
  });
}

export function generateBooleanField(params: GenerateFieldParams) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "boolean",
    type: Scalars.boolean,
    sqlOptions,
    typeDefOptions,
  });
}

// array of [type], stored in DB as JSON
export function generateArrayField(
  params: {
    type: GiraffeqlScalarType | GiraffeqlObjectTypeLookup | GiraffeqlObjectType;
    allowNullElement?: boolean;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    allowNullElement = false,
    hidden,
    nestHidden,
    type,
    sqlOptions,
    typeDefOptions,
  } = params;

  // if adding a GiraffeqlObjectType, also need to register the equivalent GiraffeqlInputFieldType if it doesn't exist
  if (type instanceof GiraffeqlObjectType) {
    if (!inputTypeDefs.has(type.definition.name)) {
      const fields: any = Object.entries(type.definition.fields).reduce(
        (total, entry) => {
          // ONLY scalars processed at the moment
          if (entry[1].type instanceof GiraffeqlScalarType) {
            total[entry[0]] = new GiraffeqlInputFieldType({
              type: entry[1].type,
              allowNull: entry[1].allowNull,
              required: entry[1].required,
            });
          }

          return total;
        },
        {}
      );

      new GiraffeqlInputType({
        name: type.definition.name,
        description: `Object Input matching an Object Type`,
        fields,
      });
    }
  }

  return generateStandardField({
    description,
    arrayOptions: {
      allowNullElement,
    },
    allowNull,
    hidden,
    nestHidden,
    sqlType: "jsonb",
    type,
    ...(!allowNull && { defaultValue: [] }),
    sqlOptions: {
      // necessary for inserting JSON into DB properly
      parseValue: (val) => JSON.stringify(val),
      ...sqlOptions,
    },
    typeDefOptions: {
      ...typeDefOptions,
    },
  });
}

// generic JSON field, stored as JSON, but input/output as stringified JSON by default
export function generateJSONField(
  params: {
    jsonString?: boolean;
  } & GenerateFieldParams
) {
  const {
    jsonString = true,
    description,
    allowNull = true,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    hidden,
    nestHidden,
    sqlType: "jsonb",
    type: jsonString ? Scalars.jsonString : Scalars.json,
    sqlOptions: {
      // if not a JSON string, need to stringify it to insert into DB properly
      ...(!jsonString && {
        parseValue: (val) => JSON.stringify(val),
      }),
      ...sqlOptions,
    },
    typeDefOptions: {
      ...typeDefOptions,
    },
  });
}

// should handle kenums too
export function generateEnumField(
  params: {
    scalarDefinition: GiraffeqlScalarType;
    isKenum?: boolean;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    nestHidden,
    scalarDefinition,
    sqlOptions,
    typeDefOptions,
    isKenum = false,
  } = params;

  // if scalarDefinition.parseValue, run that on defaultValue

  return generateStandardField({
    description,
    allowNull: allowNull,
    defaultValue:
      scalarDefinition.definition.parseValue && defaultValue !== undefined
        ? scalarDefinition.definition.parseValue(defaultValue)
        : defaultValue,
    hidden,
    nestHidden,
    sqlType: isKenum ? "integer" : "string",
    type: scalarDefinition,
    sqlOptions,
    typeDefOptions,
  });
}

export function generateKeyValueArray(
  params: {
    name?: string;
    valueType?: GiraffeqlScalarType;
    allowNullValue?: boolean;
  } & GenerateFieldParams
) {
  const {
    name,
    valueType = Scalars.string,
    allowNullValue = false,
    ...remainingParams
  } = params;

  let finalObjectName: string;

  // if name is defined, check if it is not already defined
  if (name) {
    finalObjectName = name;
    if (inputTypeDefs.has(name)) {
      throw new GiraffeqlInitializationError({
        message: `Input type with name: '${name}' already exists`,
      });
    }
  } else {
    finalObjectName = "keyValueObject";
    let iteration = 0;
    // if no name, generate an appropriate name by adding an incrementing number
    while (inputTypeDefs.has(finalObjectName)) {
      finalObjectName += String(iteration);
      iteration++;
    }
  }

  // generate the input type if not exists
  if (!inputTypeDefs.has(finalObjectName)) {
    new GiraffeqlInputType({
      name: finalObjectName,
      description: "Object Input with key and value properties",
      fields: {
        key: new GiraffeqlInputFieldType({
          type: Scalars.string,
          required: true,
        }),
        value: new GiraffeqlInputFieldType({
          type: valueType,
          required: true,
          allowNull: allowNullValue,
        }),
      },
    });
  }

  // generate the object type if not exists
  if (!objectTypeDefs.has(finalObjectName)) {
    new GiraffeqlObjectType({
      name: finalObjectName,
      description: "Object with key and value properties",
      fields: {
        key: {
          type: Scalars.string,
          allowNull: false,
        },
        value: {
          type: valueType,
          allowNull: allowNullValue,
        },
      },
    });
  }

  return generateArrayField({
    allowNullElement: false,
    type: new GiraffeqlObjectTypeLookup(finalObjectName),
    ...remainingParams,
  });
}

/*
 ** Field Helpers (Commonly used fields)
 */

export function generateCreatedAtField() {
  return {
    createdAt: generateUnixTimestampField({
      description: "When the record was created",
      allowNull: false,
      defaultValue: knex.fn.now(),
      sqlOptions: { field: "created_at" },
      typeDefOptions: { addable: false, updateable: false }, // not addable or updateable
    }),
  };
}

export function generateUpdatedAtField() {
  return {
    updatedAt: generateUnixTimestampField({
      description: "When the record was last updated",
      allowNull: true,
      sqlOptions: { field: "updated_at" },
      typeDefOptions: { addable: false, updateable: false }, // not addable or updateable
      nowOnly: true,
    }),
  };
}

export function generateIdField({ autoIncrement = false } = {}) {
  return {
    id: generateStandardField({
      description: "The unique ID of the field",
      allowNull: false,
      sqlType: autoIncrement ? "integer" : "string",
      type: autoIncrement ? Scalars.number : Scalars.id,
      typeDefOptions: { addable: false, updateable: false }, // not addable or updateable
    }),
  };
}

export function generateTypenameField(service: BaseService) {
  return {
    __typename: generateGenericScalarField({
      description: "The typename of the record",
      allowNull: false,
      type: Scalars.string,
      typeDefOptions: {
        resolver: () => service.typename,
        args: new GiraffeqlInputFieldType({
          required: false,
          allowNull: false,
          type: Scalars.number,
        }),
        addable: false,
        updateable: false, // not addable or updateable
      },
    }),
  };
}

export function generateCreatedByField(
  service: NormalService,
  allowNull = false
) {
  return {
    createdBy: generateJoinableField({
      allowNull,
      service,
      sqlOptions: {
        field: "created_by",
      },
      typeDefOptions: { addable: false, updateable: false }, // not addable or updateable
    }),
  };
}

export function generateJoinableField(
  params: {
    service: NormalService;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    sqlOptions,
    typeDefOptions,
    service,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    sqlType: "string",
    type: service.typeDefLookup,
    typeDefOptions,
    sqlOptions: {
      joinType: service.typename,
      ...sqlOptions,
    },
  });
}

// alternative strategy for "joins"
export function generateDataloadableField(
  params: {
    service: NormalService;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    defaultValue,
    hidden,
    service,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    defaultValue,
    hidden,
    sqlType: "integer",
    type: service.typeDefLookup,
    sqlOptions,
    typeDefOptions: {
      defer: true,
      dataloader: ({ req, args, query, currentObject, fieldPath, data }) => {
        // if data.idArray empty, return empty array
        if (!data.idArray.length) return Promise.resolve([]);
        // aggregator function that must accept data.idArray = [1, 2, 3, ...]
        return getObjectType({
          typename: service.typename,
          req,
          fieldPath,
          externalQuery: query,
          sqlParams: {
            where: [{ field: "id", operator: "in", value: data.idArray }],
          },
          data,
        });
      },
      ...typeDefOptions,
    },
  });
}

// user TypeDef
// fieldPath: "userUserFollowLink/user"
function validateFieldPath(
  initialTypeDef: GiraffeqlObjectType,
  fieldPath: string
) {
  let currentTypeDef = initialTypeDef;
  let allowNull = false;
  const keyParts = fieldPath.split(/\./);
  let currentType;
  let currentObjectTypeField;

  keyParts.forEach((keyPart, keyIndex) => {
    let actualKeyPart = keyPart;
    // does the keypart have a "/"? if so, must handle differently
    if (keyPart.match(/\//)) {
      const subParts = keyPart.split(/\//);
      const linkJoinType = subParts[0];

      // ensure the type exists
      const linkJoinTypeDef = objectTypeDefs.get(linkJoinType);
      if (!linkJoinTypeDef)
        throw new Error(`Link join type '${linkJoinType}' does not exist`);

      // advance the currentTypeDef to the link Join Type Def
      currentTypeDef = linkJoinTypeDef;

      // set the actualFieldPart to the 2nd part
      actualKeyPart = subParts[1];
    }

    if (!currentTypeDef.definition.fields[actualKeyPart])
      throw new GiraffeqlInitializationError({
        message: `Invalid fieldPath '${fieldPath}' on '${initialTypeDef.definition.name}'`,
      });

    currentObjectTypeField = currentTypeDef.definition.fields[actualKeyPart];
    currentType = currentObjectTypeField.type;

    // currentObjectTypeField must be a sql field
    if (!currentObjectTypeField.sqlOptions) {
      throw new GiraffeqlInitializationError({
        message: `At least one non-sql field in fieldPath '${fieldPath}' on '${initialTypeDef.definition.name}'`,
      });
    }

    // if one in the chain has allowNull === true, then allowNull
    if (currentObjectTypeField.allowNull) allowNull = true;

    if (keyParts[keyIndex + 1]) {
      if (currentType instanceof GiraffeqlObjectTypeLookup) {
        const lookupTypeDef = objectTypeDefs.get(currentType.name);

        if (!lookupTypeDef) {
          throw new GiraffeqlInitializationError({
            message: `Invalid typeDef lookup for '${currentType.name}'`,
          });
        }

        currentTypeDef = lookupTypeDef;
      } else if (currentType instanceof GiraffeqlObjectType) {
        currentTypeDef = currentType;
      } else {
        // must be scalar. should be over in the next iteration, else will fail
      }
    }
  });

  // final value must be scalar at the moment
  if (!(currentType instanceof GiraffeqlScalarType)) {
    throw new GiraffeqlInitializationError({
      message: `Final filter field must be a scalar type. Field: '${fieldPath}' on '${initialTypeDef.definition.name}'`,
    });
  }

  return {
    currentType,
    allowNull,
    currentObjectTypeField,
  };
}

// same as generatePaginatorPivotResolverObject but returns only the records, not the paginator
export function generatePivotResolverObject({
  pivotService,
  filterByField,
  additionalFilterFields,
  sqlParams,
}: {
  pivotService: PaginatedService;
  filterByField: string;
  additionalFilterFields?: StringKeyObject;
  sqlParams?: Omit<SqlSelectQuery, "table" | "select" | "where">;
}) {
  return {
    type: pivotService.typeDefLookup,
    arrayOptions: {
      allowNullElement: false,
    },
    requiredSqlFields: ["id"],
    allowNull: false,
    resolver({ req, parentValue, fieldPath, query }) {
      return getObjectType({
        typename: pivotService.typename,
        req,
        fieldPath,
        externalQuery: query,
        sqlParams: {
          where: {
            [filterByField]: parentValue.id,
            ...additionalFilterFields,
          },
          ...sqlParams,
        },
      });
    },
  };
}

// should work for *most* cases
// returns resolver object instead of a typeDef because it is also used to generate the rootResolver
export function generatePaginatorPivotResolverObject(params: {
  pivotService: PaginatedService;
  filterByField?: string;
}) {
  const { pivotService, filterByField } = params;

  // if filterByField, ensure that filterByField is a valid filterField on pivotService
  if (filterByField && !pivotService.filterFieldsMap[filterByField]) {
    throw new GiraffeqlInitializationError({
      message: `Filter Key '${filterByField}' does not exist on type '${pivotService.typename}'`,
    });
  }

  // generate sortByKey ScalarDefinition
  const sortByScalarDefinition: ScalarDefinition = {
    name: pivotService.typename + "SortByKey",
    types: [],
    parseValue: (value) => {
      if (typeof value !== "string" || !(value in pivotService.sortFieldsMap))
        throw true;
      return value;
    },
  };

  process.nextTick(() => {
    sortByScalarDefinition.types = Object.entries(
      pivotService.sortFieldsMap
    ).map(([key, value]) => {
      // ensure the path exists
      validateFieldPath(pivotService.getTypeDef(), value.field ?? key);

      return `"${key}"`;
    });
  });

  const groupByScalarDefinition: ScalarDefinition = {
    name: pivotService.typename + "GroupByKey",
    types: Object.entries(pivotService.groupByFieldsMap).map(([key, value]) => {
      // ensure the path exists
      validateFieldPath(pivotService.getTypeDef(), value.field ?? key);
      return `"${key}"`;
    }),
    parseValue: (value) => {
      if (
        typeof value !== "string" ||
        !(value in pivotService.groupByFieldsMap)
      )
        throw true;
      return value;
    },
  };

  const filterByTypeDefinition: InputTypeDefinition = {
    name: pivotService.typename + "FilterByObject",
    fields: {},
  };

  // populate the fields nextTick, to allow objectTypeDefs to load
  process.nextTick(() => {
    Object.entries(pivotService.filterFieldsMap).reduce(
      (total, [filterKey, filterValue]) => {
        const { currentType, allowNull, currentObjectTypeField } =
          validateFieldPath(
            pivotService.getTypeDef(),
            filterValue.field ?? filterKey
          );

        total[filterKey] = new GiraffeqlInputFieldType({
          type: new GiraffeqlInputType(
            {
              name: `${pivotService.typename}FilterByField/${filterKey}`,
              fields: {
                eq: new GiraffeqlInputFieldType({
                  type: currentType,
                  required: false,
                  allowNull,
                }),
                neq: new GiraffeqlInputFieldType({
                  type: currentType,
                  required: false,
                  allowNull,
                }),
                gt: new GiraffeqlInputFieldType({
                  type: currentType,
                  required: false,
                  allowNull: false,
                }),
                lt: new GiraffeqlInputFieldType({
                  type: currentType,
                  required: false,
                  allowNull: false,
                }),
                gtornull: new GiraffeqlInputFieldType({
                  type: currentType,
                  required: false,
                  allowNull: false,
                }),
                gte: new GiraffeqlInputFieldType({
                  type: currentType,
                  required: false,
                  allowNull: false,
                }),
                lte: new GiraffeqlInputFieldType({
                  type: currentType,
                  required: false,
                  allowNull: false,
                }),
                in: new GiraffeqlInputFieldType({
                  type: currentType,
                  arrayOptions: {
                    allowNullElement: allowNull,
                  },
                  required: false,
                }),
                nin: new GiraffeqlInputFieldType({
                  type: currentType,
                  arrayOptions: {
                    allowNullElement: allowNull,
                  },
                  required: false,
                }),
                regex: new GiraffeqlInputFieldType({
                  type: Scalars.regex,
                  required: false,
                }),
                // only allowed to use contains if it is a jsonb sql type
                ...(currentObjectTypeField.sqlOptions.type === "jsonb" && {
                  contains: new GiraffeqlInputFieldType({
                    type: currentType,
                    allowNull:
                      currentObjectTypeField.arrayOptions?.allowNullElement,
                    required: false,
                  }),
                  containsAll: new GiraffeqlInputFieldType({
                    type: currentType,
                    arrayOptions: currentObjectTypeField.arrayOptions,
                    required: false,
                  }),
                }),
              },
            },
            true
          ),
          required: false,
          allowNull: false,
        });
        return total;
      },
      filterByTypeDefinition.fields
    );
  });

  let rootResolverFunction: RootResolverFunction | undefined;
  let resolverFunction: ResolverFunction | undefined;

  if (filterByField) {
    resolverFunction = async ({
      req,
      args,
      fieldPath,
      query,
      parentValue,
      data,
    }) => {
      // args should be validated already
      const validatedArgs = <any>args;

      // parentValue.id should be requested (via requiredSqlFields)
      const parentItemId = parentValue.id;

      // apply the filterByField as an arg to each filterObject
      const filterObjectArray = validatedArgs.filterBy ?? [{}];
      filterObjectArray.forEach((filterObject) => {
        filterObject[filterByField] = { eq: parentItemId };
      });

      return pivotService.paginator.getRecord({
        req,
        fieldPath,
        args: {
          ...validatedArgs,
          filterBy: filterObjectArray,
        },
        query,
        data,
      });
    };
  } else {
    rootResolverFunction = (inputs) => pivotService.paginator.getRecord(inputs);
  }

  const hasSearchFields =
    pivotService.searchFieldsMap &&
    Object.keys(pivotService.searchFieldsMap).length > 0;

  return <ObjectTypeDefinitionField>{
    type: new GiraffeqlObjectTypeLookup(pivotService.paginator.typename),
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType(
        {
          name: pivotService.paginator.typename,
          fields: {
            first: new GiraffeqlInputFieldType({
              type: Scalars.number,
            }),
            last: new GiraffeqlInputFieldType({
              type: Scalars.number,
            }),
            after: new GiraffeqlInputFieldType({
              type: Scalars.string,
            }),
            before: new GiraffeqlInputFieldType({
              type: Scalars.string,
            }),
            sortBy: new GiraffeqlInputFieldType({
              arrayOptions: {
                allowNullElement: false,
              },
              type: new GiraffeqlInputType(
                {
                  name: `${pivotService.typename}SortByObject`,
                  fields: {
                    field: new GiraffeqlInputFieldType({
                      type: new GiraffeqlScalarType(
                        sortByScalarDefinition,
                        true
                      ),
                      required: true,
                    }),
                    desc: new GiraffeqlInputFieldType({
                      type: Scalars.boolean,
                      required: true,
                    }),
                  },
                },
                true
              ),
            }),
            filterBy: new GiraffeqlInputFieldType({
              arrayOptions: {
                allowNullElement: false,
              },
              type: new GiraffeqlInputType(filterByTypeDefinition, true),
            }),
            groupBy: new GiraffeqlInputFieldType({
              type: new GiraffeqlScalarType(groupByScalarDefinition, true),
              arrayOptions: {
                allowNullElement: false,
              },
            }),
            ...(hasSearchFields && {
              search: new GiraffeqlInputFieldType({
                type: Scalars.string,
              }),
            }),
          },
          inputsValidator: (args, fieldPath) => {
            // check for invalid first/last, before/after combos
            const validatedArgs = <any>args;

            // after
            if (!isObject(args)) {
              throw new GiraffeqlArgsError({
                message: `Args required`,
                fieldPath,
              });
            }

            if ("after" in args) {
              if (!("first" in args))
                throw new GiraffeqlArgsError({
                  message: `Cannot use after without first`,
                  fieldPath,
                });
              if ("last" in args || "before" in args)
                throw new GiraffeqlArgsError({
                  message: `Cannot use after with last/before`,
                  fieldPath,
                });
            }

            // first
            if ("first" in args) {
              if ("last" in args || "before" in args)
                throw new GiraffeqlArgsError({
                  message: `Cannot use after with last/before`,
                  fieldPath,
                });
            }

            // before
            if ("before" in args) {
              if (!("last" in args))
                throw new GiraffeqlArgsError({
                  message: `Cannot use before without last`,
                  fieldPath,
                });
            }

            // last
            if ("last" in args) {
              if (!("before" in args))
                throw new GiraffeqlArgsError({
                  message: `Cannot use before without last`,
                  fieldPath,
                });
            }

            if (!("first" in args) && !("last" in args))
              throw new GiraffeqlArgsError({
                message: `One of first or last required`,
                fieldPath,
              });

            // args.first or args.before cannot exceed 500
            if (Number(args.first ?? args.last) > 500) {
              throw new GiraffeqlArgsError({
                message: `Cannot request more than 500 results at a time`,
                fieldPath,
              });
            }

            // if args.sortBy is provided, all of the fields must be unique
            if ("sortBy" in validatedArgs) {
              const sortFields = validatedArgs.sortBy.map(
                (sortObject) => sortObject.field
              );
              if (sortFields.length > new Set(sortFields).size) {
                throw new GiraffeqlArgsError({
                  message: `All sortBy fields provided must be unique`,
                  fieldPath,
                });
              }
            }

            // if args.filterBy is provided, all of its objects must be non-empty
            if (
              validatedArgs.filterBy &&
              validatedArgs.filterBy.some(
                (filterObject) => Object.keys(filterObject).length < 1
              )
            ) {
              throw new GiraffeqlArgsError({
                message: `All filterBy objects must have at least one filter parameter specified`,
                fieldPath,
              });
            }
          },
        },
        true
      ),
    }),
    ...(rootResolverFunction
      ? {
          resolver: rootResolverFunction,
        }
      : {
          resolver: resolverFunction,
          requiredSqlFields: ["id"],
        }),
  };
}

// special field for generating the currentUserFollowLink foreign sql field for a model
export function generateCurrentUserFollowLinkField(followLink: LinkService) {
  return {
    type: followLink.typeDefLookup,
    allowNull: true,
    sqlOptions: {
      joinType: followLink.typename,
      specialJoin: {
        field: "id",
        foreignTable: followLink.typename,
        joinFunction: (
          knexObject,
          parentTableAlias,
          joinTableAlias,
          specialParams
        ) => {
          knexObject.leftJoin(
            {
              [joinTableAlias]: followLink.typename,
            },
            (builder) => {
              builder
                .on(parentTableAlias + ".id", "=", joinTableAlias + ".target")
                .andOn(
                  specialParams.currentUserId
                    ? knex.raw(`"${joinTableAlias}".user = ?`, [
                        specialParams.currentUserId,
                      ])
                    : knex.raw("false")
                );
            }
          );
        },
      },
    },
  };
}
