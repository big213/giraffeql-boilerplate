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
  ObjectTypeDefinition,
  GiraffeqlInputTypeLookup,
  GiraffeqlBaseError,
} from "giraffeql";
import { knex } from "../../../utils/knex";
import {
  camelToSnake,
  flattenObject,
  getNestedProperty,
  isObject,
} from "./shared";
import {
  BaseService,
  EnumService,
  LinkService,
  PaginatedService,
} from "../services";
import type {
  ObjectTypeDefSqlOptions,
  ServiceFunctionInputs,
  SqlType,
  StringKeyObject,
} from "../../../types";
import { getObjectType } from "./resolver";
import { fetchTableRows, SqlSelectQuery } from "./sql";
import { Enum, Kenum } from "./enum";
import { User } from "../../services";
import { Scalars } from "../../scalars";
import { ValidatorFunction } from "giraffeql/lib/types";
import {
  generateGetAggregatorRootResolver,
  generateGetPaginatorRootResolver,
  generateGetStatsRootResolver,
} from "./rootResolver";

type GenerateFieldParams = {
  name?: string;
  description?: string;
  allowNull: boolean; // this actually corresponds to the input
  allowNullOutput?: boolean;
  hidden?: boolean;
  nestHidden?: boolean;
  defaultValue?: unknown;
  sqlOptions?: Partial<ObjectTypeDefSqlOptions> | null;
  typeDefOptions?: Partial<ObjectTypeDefinitionField>;
  addable?: boolean;
  updateable?: boolean;
  validator?: ValidatorFunction;
};

// special type to indicate that it is a lookup attached to a specific service
export class GiraffeqlInputTypeLookupService extends GiraffeqlInputTypeLookup {
  service: PaginatedService;

  constructor(name: string, service: PaginatedService) {
    super(name);

    this.service = service;
  }
}

export class GiraffeqlObjectTypeLookupService extends GiraffeqlObjectTypeLookup {
  service: PaginatedService;

  constructor(name: string, service: PaginatedService) {
    super(name);

    this.service = service;
  }
}

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
    allowNullOutput = allowNull,
    arrayOptions,
    hidden = false,
    nestHidden = false,
    defaultValue,
    sqlType,
    type,
    addable = true, // default is addable and updateable
    updateable = true,
    sqlOptions,
    typeDefOptions,
    validator,
  } = params;

  const typeDef = <ObjectTypeDefinitionField>{
    type,
    description,
    arrayOptions,
    allowNull: allowNullOutput,
    allowNullInput: allowNull,
    required: defaultValue === undefined && !allowNull,
    sqlOptions:
      sqlOptions !== null && sqlType
        ? {
            type: sqlType,
            ...(defaultValue !== undefined && { defaultValue: defaultValue }),
            ...sqlOptions,
          }
        : undefined,
    hidden,
    nestHidden,
    addable,
    updateable,
    validator,
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
  const { type, ...remainingOptions } = params;
  return generateStandardField({
    type: type ?? Scalars.string,
    ...remainingOptions,
  });
}

export function generateStringField(
  params: {
    type?: GiraffeqlScalarType;
    length?: number;
  } & GenerateFieldParams
) {
  const { length = 255, sqlOptions, type, ...remainingOptions } = params;
  return generateStandardField({
    sqlType: "string",
    type: type ?? Scalars.string,
    sqlOptions: {
      stringOptions: {
        length,
      },
      ...sqlOptions,
    },
    ...remainingOptions,
  });
}

// DateTime as UNIX timestamp
export function generateUnixTimestampField(
  params: {
    nowOnly?: boolean; // if the unix timestamp can only be set to now()
  } & GenerateFieldParams
) {
  const { sqlOptions, nowOnly, ...remainingOptions } = params;
  return generateStandardField({
    sqlType: "dateTime",
    type: Scalars.unixTimestamp,
    sqlOptions: {
      getter: (tableAlias, field) =>
        `extract(epoch from "${tableAlias}".${field})`,
      parseValue: nowOnly
        ? () => knex.fn.now()
        : (value: unknown) => {
            // if null, allow null value
            if (value === null || value === undefined) return null;
            // if Date type, return that
            if (value instanceof Date) return value;

            if (typeof value !== "number")
              throw new Error(
                "Unix timestamp must be sent in seconds, null, undefined, or Date"
              ); // should never happen

            // assuming the timestamp is being sent in seconds
            return new Date(value * 1000);
          },
      ...sqlOptions,
    },
    ...remainingOptions,
  });
}

export function generateDateField(params: GenerateFieldParams) {
  const { ...remainingOptions } = params;
  return generateStandardField({
    sqlType: "date",
    type: Scalars.date,
    ...remainingOptions,
  });
}

export function generateTextField(params: GenerateFieldParams) {
  const { ...remainingOptions } = params;
  return generateStandardField({
    sqlType: "text",
    type: Scalars.string,
    ...remainingOptions,
  });
}

// only goes up to 2.1 billion
export function generateIntegerField(
  params: GenerateFieldParams & {
    type?: GiraffeqlScalarType;
    bigInt?: boolean;
  }
) {
  const {
    sqlOptions,
    type = Scalars.number,
    bigInt = false,
    ...remainingOptions
  } = params;
  return generateStandardField({
    sqlType: bigInt ? "bigInteger" : "integer",
    type,
    sqlOptions: {
      // detect NaN and convert to undefined
      parseValue: (val) => (Number.isNaN(val) ? undefined : val),
      ...sqlOptions,
    },
    ...remainingOptions,
  });
}

export function generateFloatField(
  params: GenerateFieldParams & {
    type?: GiraffeqlScalarType;
  }
) {
  const { sqlOptions, type = Scalars.number, ...remainingOptions } = params;
  return generateStandardField({
    sqlType: "float",
    type,
    sqlOptions: {
      // detect NaN and convert to undefined
      parseValue: (val) => (Number.isNaN(val) ? undefined : val),
      ...sqlOptions,
    },
    ...remainingOptions,
  });
}

export function generateDecimalField(
  params: GenerateFieldParams & {
    type?: GiraffeqlScalarType;
    scale?: number;
    precision?: number;
  }
) {
  const {
    sqlOptions,
    scale = 2,
    precision = 8,
    type = Scalars.number,
    ...remainingOptions
  } = params;
  return generateStandardField({
    sqlType: "decimal",
    type,
    sqlOptions: {
      // detect NaN and convert to undefined
      parseValue: (val) => (Number.isNaN(val) ? undefined : val),
      decimalOptions: {
        precision,
        scale,
      },
      ...sqlOptions,
    },
    ...remainingOptions,
  });
}

export function generateBooleanField(params: GenerateFieldParams) {
  const { ...remainingOptions } = params;
  return generateStandardField({
    sqlType: "boolean",
    type: Scalars.boolean,
    ...remainingOptions,
  });
}

// array of [type], stored in DB as JSON
export function generateArrayField(
  params: {
    type:
      | GiraffeqlScalarType
      | GiraffeqlObjectTypeLookup
      | GiraffeqlObjectType
      | GiraffeqlObjectTypeLookupService;
    uniqueKeyPaths?: string[];
    allowNullElement?: boolean;
  } & GenerateFieldParams
) {
  const {
    allowNull = true,
    allowNullElement = false,
    type,
    sqlOptions,
    uniqueKeyPaths,
    typeDefOptions,
    ...remainingOptions
  } = params;

  // keeps track of the nested typeDefs, if any
  const nestedServiceTypeDefMap: Map<string, GiraffeqlObjectTypeLookupService> =
    new Map();

  // if adding a GiraffeqlObjectType, also need to register the equivalent GiraffeqlInputFieldType if it doesn't exist
  if (type instanceof GiraffeqlObjectType) {
    // for any GiraffeqlObjectTypeLookupService fields, need to add it to nestedServiceTypeDefMap
    Object.entries(type.definition.fields).forEach(([key, value]) => {
      if (value.type instanceof GiraffeqlObjectTypeLookupService) {
        nestedServiceTypeDefMap.set(key, value.type);
      }
    });

    // if equivalent GiraffeqlInputFieldType doesn't exist, create one
    if (!inputTypeDefs.has(type.definition.name)) {
      const fields = Object.entries(type.definition.fields).reduce(
        (total, [key, value]) => {
          if (value.type instanceof GiraffeqlScalarType) {
            total[key] = new GiraffeqlInputFieldType({
              type: value.type,
              allowNull: value.allowNull,
              // unsure if arrays are supported at the moment
              arrayOptions: value.arrayOptions,
              required: value.required,
            });
          } else if (value.type instanceof GiraffeqlObjectTypeLookupService) {
            total[key] = new GiraffeqlInputFieldType({
              type: value.type.service.inputTypeDefLookup,
              required: value.required,
              // unsure if arrays are supported at the moment
              arrayOptions: value.arrayOptions,
              allowNull: value.allowNullInput,
            });
          } else if (value.type instanceof GiraffeqlObjectTypeLookup) {
            total[key] = new GiraffeqlInputFieldType({
              type: new GiraffeqlInputTypeLookup(value.type.name),
              required: value.required,
              // unsure if arrays are supported at the moment
              arrayOptions: value.arrayOptions,
              allowNull: value.allowNullInput,
            });
          } else {
            // GiraffeqlObjectType not supported
            throw new Error(`GiraffeqlObjectType not currently supported`);
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
    arrayOptions: {
      allowNullElement,
    },
    allowNull,
    sqlType: "jsonb",
    type,
    ...(!allowNull && { defaultValue: [] }),
    sqlOptions: {
      // necessary for inserting JSON into DB properly
      parseValue: (val) => {
        // if uniqueKeyPaths, confirm that there are no duplicates given the key combinations (assuming it is not an array of scalars)
        if (val && uniqueKeyPaths && !(type instanceof GiraffeqlScalarType)) {
          const uniqueValues = new Set();

          val.forEach((ele) => {
            if (!ele) return;

            const keyValue = uniqueKeyPaths
              .map((keyPath) => getNestedProperty(ele, keyPath))
              .join("-");

            if (uniqueValues.has(keyValue)) {
              throw new Error(
                `Entry with value '${keyValue}' already exists, which violates the unique key constraint`
              );
            }
            uniqueValues.add(keyValue);
          });
        }

        return JSON.stringify(val);
      },

      ...sqlOptions,
    },
    typeDefOptions: {
      ...typeDefOptions,
      dataloader:
        type instanceof GiraffeqlObjectTypeLookupService
          ? async ({
              req,
              rootResolver,
              query,
              fieldPath,
              resultsArray,
              field,
            }) => {
              // elements is expected to be an array of ids in this case
              const elements: any[] = [];

              // aggregate elements
              resultsArray.forEach((result) => {
                if (!result) return;
                // if it is an array of ids, need to add them each individually
                if (Array.isArray(result[field])) {
                  elements.push(...result[field]);
                }
              });

              // if no elements empty, return
              if (!elements.length) return;

              // aggregator function that must accept elements = [1, 2, 3, ...]
              const aggregatedResults = await getObjectType({
                typename: type.service.typename,
                req,
                rootResolver,
                fieldPath,
                additionalSelect: [
                  {
                    field: "id", // always add the required id field, in case it wasn't requested in the query
                  },
                ],
                externalQuery: query,
                sqlParams: {
                  where: [
                    {
                      field: "id",
                      operator: "in",
                      value: [...new Set(elements)], // remove duplicates
                    },
                  ],
                },
              });

              // build id -> record map
              const recordMap = new Map();
              aggregatedResults.forEach((result: any) => {
                recordMap.set(result.id, result);
              });

              // join the records in memory
              resultsArray.forEach((result) => {
                if (!result) return;

                // if it is an array of ids, need to map them each individually
                if (Array.isArray(result[field])) {
                  // if not found, exclude entirely
                  result[field] = result[field]
                    .map((id) => recordMap.get(id) ?? null)
                    .filter((ele) => ele);
                }
              });
            }
          : nestedServiceTypeDefMap.size
          ? async ({
              req,
              rootResolver,
              query,
              fieldPath,
              resultsArray,
              field,
            }) => {
              // elements is expected to be an array of objects in this case (due to nested type)
              const elements: any[] = [];

              // aggregate elements
              resultsArray.forEach((result) => {
                if (!result) return;
                // if it is an array of ids, need to add them each individually
                if (Array.isArray(result[field])) {
                  elements.push(...result[field]);
                }
              });

              // if no elements empty, return
              if (!elements.length) return;

              // for each typeDef element of the array, extract the Ids
              for (const [
                fieldKey,
                typeDefLookupService,
              ] of nestedServiceTypeDefMap) {
                const idsArray = elements.map((ele) => ele[fieldKey]);

                // fetch the results
                const aggregatedResults = await getObjectType({
                  typename: typeDefLookupService.service.typename,
                  req,
                  rootResolver,
                  fieldPath,
                  additionalSelect: [
                    {
                      field: "id", // always add the required id field, in case it wasn't requested in the query
                    },
                  ],
                  externalQuery: query[fieldKey],
                  sqlParams: {
                    where: [{ field: "id", operator: "in", value: idsArray }],
                  },
                });

                // build id -> record map
                const recordMap = new Map();
                aggregatedResults.forEach((result: any) => {
                  recordMap.set(result.id, result);
                });

                // join the records in memory
                elements.forEach((element) => {
                  if (!element) return;

                  element[fieldKey] = recordMap.get(element[fieldKey]) ?? null;
                });
              }
            }
          : undefined,
    },
    ...remainingOptions,
  });
}

// generic JSON field, stored as JSON, but input/output as stringified JSON by default
export function generateJSONField(
  params: {
    // custom type can be Scalars.jsonString, Scalars.json, or some other custom json structure
    type?:
      | GiraffeqlScalarType
      | GiraffeqlObjectTypeLookup
      | GiraffeqlObjectType
      | GiraffeqlObjectTypeLookupService;
  } & GenerateFieldParams
) {
  const {
    type = Scalars.jsonString,
    sqlOptions,
    typeDefOptions,
    ...remainingOptions
  } = params;

  // keeps track of the nested typeDefs, if any
  // (realistically, this would only be used instead of generateJoinableField if the field is a nested object type, e.g. { user: 123, foo: 'bar' })
  const nestedServiceTypeDefMap: Map<string, GiraffeqlObjectTypeLookupService> =
    new Map();

  // if type is a giraffeqlObjectType, need to also generate and register the matching input
  if (type instanceof GiraffeqlObjectType) {
    const inputName = type.definition.name;
    if (!inputTypeDefs.has(inputName)) {
      new GiraffeqlInputType({
        name: inputName,
        description: type.definition.description,
        fields: Object.entries(type.definition.fields).reduce(
          (total, [key, value]) => {
            if (value.type instanceof GiraffeqlScalarType) {
              total[key] = new GiraffeqlInputFieldType({
                type: value.type,
                required: value.required,
                arrayOptions: value.arrayOptions,
                allowNull: value.allowNullInput,
              });
            } else if (value.type instanceof GiraffeqlObjectTypeLookupService) {
              nestedServiceTypeDefMap.set(key, value.type);
              total[key] = new GiraffeqlInputFieldType({
                type: value.type.service.inputTypeDefLookup,
                required: value.required,
                arrayOptions: value.arrayOptions,
                allowNull: value.allowNullInput,
              });
            } else if (value.type instanceof GiraffeqlObjectTypeLookup) {
              total[key] = new GiraffeqlInputFieldType({
                type: new GiraffeqlInputTypeLookup(value.type.name),
                required: value.required,
                arrayOptions: value.arrayOptions,
                allowNull: value.allowNullInput,
              });
            } else {
              // GiraffeqlObjectType not supported
              throw new Error(`GiraffeqlObjectType not currently supported`);
            }

            return total;
          },
          {}
        ),
      });
    }
  }

  return generateStandardField({
    sqlType: "jsonb",
    type,
    sqlOptions: {
      // if not a JSON string, need to stringify it to insert into DB properly
      ...(type !== Scalars.jsonString && {
        parseValue: (val) => JSON.stringify(val),
      }),
      ...sqlOptions,
    },
    typeDefOptions: {
      ...typeDefOptions,
      dataloader: nestedServiceTypeDefMap.size
        ? async ({
            req,
            rootResolver,
            query,
            fieldPath,
            resultsArray,
            field,
          }) => {
            // elements is expected to be an array of objects in this case (due to nested type)
            const elements: any[] = [];

            // aggregate elements
            resultsArray.forEach((result) => {
              if (!result) return;
              // if it is an array of ids, need to add them each individually
              if (result[field]) {
                elements.push(...result[field]);
              }
            });

            // if no elements empty, return
            if (!elements.length) return;

            // for each typeDef element of the array, extract the Ids
            for (const [
              fieldKey,
              typeDefLookupService,
            ] of nestedServiceTypeDefMap) {
              const idsArray = elements.map((ele) => ele[fieldKey]);

              // fetch the results
              const aggregatedResults = await getObjectType({
                typename: typeDefLookupService.service.typename,
                req,
                rootResolver,
                fieldPath,
                additionalSelect: [
                  {
                    field: "id", // always add the required id field, in case it wasn't requested in the query
                  },
                ],
                externalQuery: query[fieldKey],
                sqlParams: {
                  where: [{ field: "id", operator: "in", value: idsArray }],
                },
              });

              // build id -> record map
              const recordMap = new Map();
              aggregatedResults.forEach((result: any) => {
                recordMap.set(result.id, result);
              });

              // join the records in memory
              elements.forEach((element) => {
                if (!element) return;

                element[fieldKey] = recordMap.get(element[fieldKey] ?? null);
              });
            }
          }
        : undefined,
    },
    ...remainingOptions,
  });
}

// should handle kenums too
export function generateEnumField(
  params: {
    service: EnumService;
    defaultValue?: Enum | Kenum;
  } & GenerateFieldParams
) {
  const { defaultValue, service, sqlOptions, ...remainingOptions } = params;
  return generateStandardField({
    defaultValue: defaultValue?.parsed,
    sqlType: service.enum.type === "Kenum" ? "integer" : "string",
    type: service.scalarDefinition,
    sqlOptions: {
      parseValue: (value: unknown) => {
        // if Enum type, return the parsed value (for storing in DB)
        if (value instanceof Enum || value instanceof Kenum) {
          return value.parsed;
        }

        // otherwise, just return the actual value
        return value;
      },
      ...sqlOptions,
    },
    ...remainingOptions,
  });
}

export function generateKeyValueArray(
  params: {
    name?: string;
    keyType?: GiraffeqlScalarType;
    valueType?: GiraffeqlScalarType;
    allowNullValue?: boolean;
  } & GenerateFieldParams
) {
  const {
    name,
    keyType = Scalars.string,
    valueType = Scalars.string,
    allowNullValue = false,
    ...remainingOptions
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
          type: keyType,
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
          type: keyType,
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
    ...remainingOptions,
  });
}

/*
 ** Field Helpers (Commonly used fields)
 */

export function generateTimestampFields() {
  return {
    createdAt: generateUnixTimestampField({
      description: "When the record was created",
      allowNull: false,
      defaultValue: knex.fn.now(),
      sqlOptions: { field: "created_at" },
      addable: false,
      updateable: false, // not addable or updateable
    }),
    updatedAt: generateUnixTimestampField({
      description: "When the record was last updated",
      allowNull: false,
      defaultValue: knex.fn.now(),
      sqlOptions: { field: "updated_at" },
      addable: false,
      updateable: false, // not addable or updateable
      nowOnly: true,
    }),
  };
}

export function generateIdField(service: PaginatedService) {
  return {
    id: generateStandardField({
      description: "The unique ID of the field",
      allowNull: false,
      sqlType: service.primaryKeyAutoIncrement ? "integer" : "string",
      type: service.primaryKeyAutoIncrement ? Scalars.number : Scalars.id,
      addable: false,
      updateable: false, // not addable or updateable
    }),
  };
}

export function generateTypenameField(service: BaseService) {
  return {
    __typename: generateGenericScalarField({
      description: "The typename of the record",
      allowNull: false,
      type: Scalars.string,
      addable: false,
      updateable: false,
      typeDefOptions: {
        resolver: () => service.typename,
      },
    }),
  };
}

export function generateCreatedByField(
  service: PaginatedService,
  allowNull = false
) {
  return {
    createdBy: generateJoinableField({
      allowNull,
      service,
      sqlOptions: {
        field: "created_by",
      },
      addable: false,
      updateable: false, // not addable or updateable
    }),
  };
}

export function generateJoinableField(
  params: {
    service: PaginatedService;
  } & GenerateFieldParams
) {
  const { sqlOptions, service, ...remainingOptions } = params;
  return generateStandardField({
    sqlType: service.primaryKeyAutoIncrement ? "integer" : "string",
    type: service.typeDefLookup,
    sqlOptions: {
      joinType: service.typename,
      ...sqlOptions,
    },
    ...remainingOptions,
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
    resolver({ req, rootResolver, parentValue, fieldPath, query }) {
      return getObjectType({
        typename: pivotService.typename,
        req,
        rootResolver,
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
export function generatePaginatorPivotResolverObject({
  pivotService,
  filterByField,
  rootResolver,
}: {
  pivotService: PaginatedService;
  filterByField?: string;
  rootResolver?: RootResolverFunction;
}) {
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
      // ensure the path exists, or is in the distanceFieldsMap
      const valueField = value.field ?? key;
      if (!(valueField in pivotService.distanceFieldsMap)) {
        validateFieldPath(pivotService.getTypeDef(), valueField);
      }

      return `"${key}"`;
    });
  });

  const groupByScalarDefinition: ScalarDefinition = {
    name: `${pivotService.typename}GroupByKey`,
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
      rootResolver,
      args,
      fieldPath,
      query,
      parentValue,
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

      return generateGetPaginatorRootResolver(pivotService)({
        req,
        rootResolver,
        args: {
          ...validatedArgs,
          filterBy: filterObjectArray,
        },
        fieldPath,
        query,
      });
    };
  } else {
    rootResolverFunction =
      rootResolver ?? generateGetPaginatorRootResolver(pivotService);
  }

  const hasSearchFields =
    pivotService.searchFieldsMap &&
    Object.keys(pivotService.searchFieldsMap).length > 0;

  const hasDistanceFields =
    pivotService.distanceFieldsMap &&
    Object.keys(pivotService.distanceFieldsMap).length > 0;

  if (hasDistanceFields) {
    // validate the field paths for distance lat + long (to ensure existence, and that they are numbers)
    Object.entries(pivotService.distanceFieldsMap).forEach(
      ([key, distanceFieldObject]) => {
        Object.values(distanceFieldObject).forEach((field) => {
          const { currentType } = validateFieldPath(
            pivotService.getTypeDef(),
            field
          );

          if (currentType !== Scalars.number) {
            throw new Error(
              `Non-number latitude or longitude field specified for ${pivotService.typename} distanceFieldsMap`
            );
          }
        });
      }
    );

    // if any distance fields, register the distance-related input objects (if not already registered)
    if (!inputTypeDefs.has("distanceParamsObject")) {
      new GiraffeqlInputFieldType({
        type: new GiraffeqlInputType(
          {
            name: `distanceParamsObject`,
            fields: {
              gt: new GiraffeqlInputFieldType({
                type: Scalars.number,
                required: false,
                allowNull: false,
              }),
              lt: new GiraffeqlInputFieldType({
                type: Scalars.number,
                required: false,
                allowNull: false,
              }),
              from: new GiraffeqlInputFieldType({
                type: new GiraffeqlInputType({
                  name: "distanceFromObject",
                  fields: {
                    // lat + long must always be numbers
                    latitude: new GiraffeqlInputFieldType({
                      type: Scalars.number,
                      required: true,
                      allowNull: false,
                    }),
                    longitude: new GiraffeqlInputFieldType({
                      type: Scalars.number,
                      required: true,
                      allowNull: false,
                    }),
                  },
                }),
                required: true,
                allowNull: false,
              }),
            },
          },
          true
        ),
      });
    }
  }

  return <ObjectTypeDefinitionField>{
    type: new GiraffeqlObjectType({
      name: `${pivotService.typename}Paginator`,
      description: "Paginator",
      fields: {
        paginatorInfo: {
          type: new GiraffeqlObjectType(
            {
              name: "paginatorInfo",
              fields: {
                total: {
                  type: Scalars.number,
                  allowNull: false,
                },
                count: {
                  type: Scalars.number,
                  allowNull: false,
                },
                startCursor: {
                  type: Scalars.string,
                  allowNull: true,
                },
                endCursor: {
                  type: Scalars.string,
                  allowNull: true,
                },
              },
            },
            true
          ),
          allowNull: false,
        },
        edges: {
          type: new GiraffeqlObjectType({
            name: `${pivotService.typename}Edge`,
            fields: {
              node: {
                type: pivotService.typeDefLookup,
                allowNull: false,
              },
              cursor: {
                type: Scalars.string,
                allowNull: false,
              },
            },
          }),
          arrayOptions: {
            allowNullElement: false,
          },
          allowNull: false,
        },
      },
    }),
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType(
        {
          name: `${pivotService.typename}PaginatorInput`,
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
                type: new GiraffeqlInputType(
                  {
                    name: `${pivotService.typename}SearchObject`,
                    fields: {
                      query: new GiraffeqlInputFieldType({
                        type: Scalars.string,
                        required: true,
                      }),
                      ...(pivotService.searchParams && {
                        params: new GiraffeqlInputFieldType({
                          type: new GiraffeqlInputType(
                            {
                              name: `${pivotService.typename}SearchParams`,
                              fields: pivotService.searchParams,
                            },
                            true
                          ),
                          // required if any child searchParams are required
                          required: Object.values(
                            pivotService.searchParams
                          ).some((ele) => ele.definition.required),
                        }),
                      }),
                    },
                  },
                  true
                ),
              }),
            }),
            ...(hasDistanceFields && {
              distance: new GiraffeqlInputFieldType({
                type: new GiraffeqlInputType(
                  {
                    name: `${pivotService.typename}DistanceObject`,
                    fields: Object.keys(pivotService.distanceFieldsMap).reduce(
                      (total, val) => {
                        total[val] = new GiraffeqlInputFieldType({
                          type: new GiraffeqlInputTypeLookup(
                            "distanceParamsObject"
                          ),
                        });
                        return total;
                      },
                      {}
                    ),
                  },
                  true
                ),
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

export function generateStatsResolverObject({
  pivotService,
  filterByField,
  rootResolver,
}: {
  pivotService: PaginatedService;
  filterByField?: string;
  rootResolver?: RootResolverFunction;
}) {
  // if filterByField, ensure that filterByField is a valid filterField on pivotService
  if (filterByField && !pivotService.filterFieldsMap[filterByField]) {
    throw new GiraffeqlInitializationError({
      message: `Filter Key '${filterByField}' does not exist on type '${pivotService.typename}'`,
    });
  }

  let rootResolverFunction: RootResolverFunction | undefined;
  let resolverFunction: ResolverFunction | undefined;

  if (filterByField) {
    resolverFunction = async ({
      req,
      rootResolver,
      args,
      fieldPath,
      query,
      parentValue,
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

      return generateGetStatsRootResolver(pivotService)({
        req,
        rootResolver,
        fieldPath,
        args: {
          ...validatedArgs,
          filterBy: filterObjectArray,
        },
        query,
      });
    };
  } else {
    rootResolverFunction =
      rootResolver ?? generateGetStatsRootResolver(pivotService);
  }

  const hasSearchFields =
    pivotService.searchFieldsMap &&
    Object.keys(pivotService.searchFieldsMap).length > 0;

  const hasDistanceFields =
    pivotService.distanceFieldsMap &&
    Object.keys(pivotService.distanceFieldsMap).length > 0;

  return <ObjectTypeDefinitionField>{
    type: new GiraffeqlObjectType(
      {
        name: `StatsResponse`,
        fields: {
          count: {
            type: Scalars.number,
            allowNull: false,
          },
        },
      },
      true
    ),
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType(
        {
          name: `${pivotService.typename}StatsInput`,
          fields: {
            filterBy: new GiraffeqlInputFieldType({
              arrayOptions: {
                allowNullElement: false,
              },
              type: new GiraffeqlInputTypeLookup(
                `${pivotService.typename}FilterByObject`
              ),
            }),
            ...(hasSearchFields && {
              search: new GiraffeqlInputFieldType({
                type: new GiraffeqlInputTypeLookup(
                  `${pivotService.typename}SearchObject`
                ),
              }),
            }),
            ...(hasDistanceFields && {
              distance: new GiraffeqlInputFieldType({
                type: new GiraffeqlInputTypeLookup(
                  `${pivotService.typename}DistanceObject`
                ),
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

export function generateAggregatorResolverObject({
  pivotService,
  filterByField,
  rootResolver,
}: {
  pivotService: PaginatedService;
  filterByField?: string;
  rootResolver?: RootResolverFunction;
}) {
  // check for aggregator options
  if (!pivotService.aggregatorOptions) {
    throw new GiraffeqlInitializationError({
      message: `Aggregator options not set up on type '${pivotService.typename}'`,
    });
  }

  // if filterByField, ensure that filterByField is a valid filterField on pivotService
  if (filterByField && !pivotService.filterFieldsMap[filterByField]) {
    throw new GiraffeqlInitializationError({
      message: `Filter Key '${filterByField}' does not exist on type '${pivotService.typename}'`,
    });
  }

  let rootResolverFunction: RootResolverFunction | undefined;
  let resolverFunction: ResolverFunction | undefined;

  if (filterByField) {
    resolverFunction = async ({
      req,
      rootResolver,
      args,
      fieldPath,
      query,
      parentValue,
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

      return generateGetAggregatorRootResolver(pivotService)({
        req,
        rootResolver,
        fieldPath,
        args: {
          ...validatedArgs,
          filterBy: filterObjectArray,
        },
        query,
      });
    };
  } else {
    rootResolverFunction =
      rootResolver ?? generateGetAggregatorRootResolver(pivotService);
  }

  const hasSearchFields =
    pivotService.searchFieldsMap &&
    Object.keys(pivotService.searchFieldsMap).length > 0;

  const hasDistanceFields =
    pivotService.distanceFieldsMap &&
    Object.keys(pivotService.distanceFieldsMap).length > 0;

  const aggregatorKeyFieldScalarDefinition: ScalarDefinition = {
    name: `${pivotService.typename}AggregatorKeyField`,
    types: Object.entries(pivotService.aggregatorOptions.keys).map(
      ([key, value]) => {
        return `"${key}"`;
      }
    ),
    parseValue: (value) => {
      if (
        typeof value !== "string" ||
        !(value in pivotService.aggregatorOptions!.keys)
      )
        throw true;
      return value;
    },
  };

  // ensure one of the keys of values is not "key"
  if ("key" in pivotService.aggregatorOptions.values) {
    throw new GiraffeqlInitializationError({
      message: `Cannot have a value key called "key"`,
    });
  }

  const aggregatorSortKeys = Object.keys(
    pivotService.aggregatorOptions.values
  ).concat("key");

  const aggregatorSortByKeyScalarDefinition: ScalarDefinition = {
    name: pivotService.typename + "AggregatorSortByKeyField",
    types: aggregatorSortKeys.map((value) => {
      return `"${value}"`;
    }),
    parseValue: (value) => {
      if (typeof value !== "string" || !aggregatorSortKeys.includes(value))
        throw true;
      return value;
    },
  };

  return <ObjectTypeDefinitionField>{
    type: new GiraffeqlObjectType({
      name: `${pivotService.typename}AggregatorResult`,
      fields: {
        key: {
          type: Scalars.unknown,
          allowNull: false,
        },
        ...Object.keys(pivotService.aggregatorOptions.values).reduce(
          (total, key) => {
            total[key] = {
              type: Scalars.number,
              allowNull: false,
            };

            return total;
          },
          {}
        ),
      },
    }),
    allowNull: false,
    arrayOptions: {
      allowNullElement: false,
    },
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType(
        {
          name: `${pivotService.typename}AggregatorInput`,
          fields: {
            keyField: new GiraffeqlInputFieldType({
              type: new GiraffeqlScalarType(
                aggregatorKeyFieldScalarDefinition,
                true
              ),
              required: true,
            }),
            filterBy: new GiraffeqlInputFieldType({
              arrayOptions: {
                allowNullElement: false,
              },
              type: new GiraffeqlInputTypeLookup(
                `${pivotService.typename}FilterByObject`
              ),
            }),
            ...(hasSearchFields && {
              search: new GiraffeqlInputFieldType({
                type: new GiraffeqlInputTypeLookup(
                  `${pivotService.typename}SearchObject`
                ),
              }),
            }),
            ...(hasDistanceFields && {
              distance: new GiraffeqlInputFieldType({
                type: new GiraffeqlInputTypeLookup(
                  `${pivotService.typename}DistanceObject`
                ),
              }),
            }),
            sortBy: new GiraffeqlInputFieldType({
              type: new GiraffeqlInputType(
                {
                  name: `AggregatorSortByObject`,
                  fields: {
                    field: new GiraffeqlInputFieldType({
                      type: new GiraffeqlScalarType(
                        aggregatorSortByKeyScalarDefinition,
                        true
                      ),
                    }),
                    desc: new GiraffeqlInputFieldType({
                      type: Scalars.boolean,
                    }),
                  },
                },
                true
              ),
              required: false,
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
        joinFunction: ({
          knexObject,
          parentTableAlias,
          joinTableAlias,
          specialParams,
        }) => {
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

// loops through a typeDef object and populates sqlOptions.field for any property with capital letters for which there is no sqlOptions.field
export function processTypeDef(typeDefObject: ObjectTypeDefinition) {
  Object.entries(typeDefObject.fields).forEach(([fieldname, def]) => {
    // if not a sql field, skip
    if (!def.sqlOptions) return;

    // always set the sqlOptions.field, if not already set
    if (!def.sqlOptions.field) {
      def.sqlOptions.field = camelToSnake(fieldname);
    }
  });

  return typeDefObject;
}

export type ServicesObjectMap = {
  [x: string]: {
    service: PaginatedService;
    allowNull?: boolean;
    allowNullOutput?: boolean;
    sqlField?: string; // sql alias for the field, e.g. if it has CAPS
    updateable?: boolean; // can this field be updated?
  };
};

export function generateLinkTypeDef(
  servicesObjectMap: ServicesObjectMap,
  currentService: LinkService,
  additionalFields?: { [x: string]: ObjectTypeDefinitionField }
): ObjectTypeDefinition {
  // set the servicesObjectMap on currentService
  currentService.servicesObjectMap = servicesObjectMap;

  // only 2 services supported at the moment. additional fields may not work properly in sql.ts processJoinFields
  if (Object.keys(servicesObjectMap).length > 2) {
    throw new Error(
      `Maximum 2 services supported for link types at the moment`
    );
  }

  const typeDefFields = {};

  for (const field in servicesObjectMap) {
    typeDefFields[field] = generateJoinableField({
      service: servicesObjectMap[field].service,
      allowNull: servicesObjectMap[field].allowNull ?? false,
      allowNullOutput: servicesObjectMap[field].allowNullOutput,
      updateable: servicesObjectMap[field].updateable ?? true,
      sqlOptions: {
        unique: "compositeIndex",
        ...(servicesObjectMap[field].sqlField && {
          field: servicesObjectMap[field].sqlField,
        }),
      },
    });
  }

  return processTypeDef({
    name: currentService.typename,
    description: "Link type",
    fields: {
      ...generateIdField(currentService),
      ...generateTypenameField(currentService),
      ...typeDefFields,
      ...generateTimestampFields(),
      ...generateCreatedByField(User),
      ...additionalFields,
    },
  });
}

export async function processLookupArgsInputType(
  args: any,
  inputType: GiraffeqlInputType
) {
  return processLookupArgs(
    args,
    new GiraffeqlInputFieldType({
      type: inputType,
    })
  );
}

export async function processLookupArgs(
  args: any,
  inputFieldType: GiraffeqlInputFieldType | undefined,
  field?: string
): Promise<any> {
  // if inputType undefined, return
  if (!inputFieldType) return;

  const inputType = inputFieldType.definition.type;

  if (inputType instanceof GiraffeqlScalarType) return args;

  // if it is a service lookup (and not a normal lookup), proceed
  if (inputType instanceof GiraffeqlInputTypeLookupService) {
    const inputTypeDef = getInputTypeDef(inputType.name);
    if (isObject(args)) {
      // get record ID of type, replace object with the ID
      const results = await fetchTableRows({
        select: ["id"],
        table: inputTypeDef.definition.name,
        where: flattenObject(args), // flattening object in case of nested lookups
      });

      if (results.length < 1) {
        throw new GiraffeqlBaseError({
          message: `${inputTypeDef.definition.name} not found`,
        });
      }

      // replace args[key] with the item ID
      return results[0].id;
    } else if (Array.isArray(args)) {
      // if the args field is an array, it is assumed to be a valid array of GiraffeqlObjectTypeLookups (dataloadable field, for example)
      // replaces [{ id: "123" }] with ["123"]
      if (args.length > 0) {
        // although any unique key combination can be inputted (via typeDefLookup), only the id is currently supported using this current implementation
        if (!args[0].id) {
          throw new Error(
            `For object lookup arrays, only the id field is currently supported`
          );
        }

        const idsArray = args.map((ele) => ele.id);

        const results = await fetchTableRows({
          select: ["id"],
          table: inputTypeDef.definition.name,
          where: [
            {
              field: "id",
              operator: "in",
              value: idsArray,
            },
          ],
        });

        if (results.length !== args.length) {
          throw new Error(
            `There is at least one invalid or duplicate entry in field: ${
              field ? `'${field}'` : "<Root Args>"
            }`
          );
        }

        // can return the original idsArray at this point, since it has been validated, and this will preserve the original order
        return idsArray;
      }
    }
  } else if (
    inputType instanceof GiraffeqlInputTypeLookup ||
    inputType instanceof GiraffeqlInputType
  ) {
    // get the input type
    const validatedInputType =
      inputType instanceof GiraffeqlInputTypeLookup
        ? getInputTypeDef(inputType.name)
        : inputType;

    // if not a service lookup and not a scalar, and the args is an object need to go deeper
    if (isObject(args)) {
      for (const field in args) {
        args[field] = await processLookupArgs(
          args[field],
          validatedInputType.definition.fields[field],
          field
        );
      }
    } else if (Array.isArray(args)) {
      for (const argsElement of args) {
        for (const field in argsElement) {
          argsElement[field] = await processLookupArgs(
            argsElement[field],
            validatedInputType.definition.fields[field],
            field
          );
        }
      }
    }
  }
  return args;
}

export function getInputTypeDef(name: string) {
  const inputTypeDef = inputTypeDefs.get(name);

  if (!inputTypeDef) {
    throw new Error(`InputTypeDef with name: '${name}' not found`);
  }

  return inputTypeDef;
}
