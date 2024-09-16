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
} from "giraffeql";
import { knex } from "../../../utils/knex";
import { camelToSnake, isObject } from "./shared";
import { BaseService, LinkService, PaginatedService } from "../services";
import * as Scalars from "../../scalars";
import type {
  ObjectTypeDefSqlOptions,
  SqlType,
  StringKeyObject,
} from "../../../types";
import { getObjectType } from "./resolver";
import { SqlSelectQuery } from "./sql";
import { Enum, Kenum } from "./enum";
import { User } from "../../services";

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
    allowNullOutput = allowNull,
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
    allowNullOutput,
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
    allowNullOutput,
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
    allowNullOutput,
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
    allowNullOutput,
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
    allowNullOutput,
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
    allowNullOutput,
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
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
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
    allowNullOutput,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    hidden,
    nestHidden,
    sqlType: "text",
    type: Scalars.string,
    sqlOptions,
    typeDefOptions,
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
    description,
    allowNull = true,
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
    type = Scalars.number,
    bigInt = false,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: bigInt ? "bigInteger" : "integer",
    type,
    sqlOptions: {
      // detect NaN and convert to undefined
      parseValue: (val) => (Number.isNaN(val) ? undefined : val),
      ...sqlOptions,
    },
    typeDefOptions,
  });
}

export function generateFloatField(
  params: GenerateFieldParams & {
    type?: GiraffeqlScalarType;
  }
) {
  const {
    description,
    allowNull = true,
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
    type = Scalars.number,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
    sqlType: "float",
    type,
    sqlOptions: {
      // detect NaN and convert to undefined
      parseValue: (val) => (Number.isNaN(val) ? undefined : val),
      ...sqlOptions,
    },
    typeDefOptions,
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
    description,
    allowNull = true,
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
    scale = 2,
    precision = 8,
    type = Scalars.number,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
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
    typeDefOptions,
  });
}

export function generateBooleanField(params: GenerateFieldParams) {
  const {
    description,
    allowNull = true,
    allowNullOutput,
    defaultValue,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
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
    allowNullOutput,
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
    allowNullOutput,
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
    // custom type can be Scalars.jsonString, Scalars.json, or some other custom json structure
    type?: GiraffeqlScalarType | GiraffeqlObjectType;
  } & GenerateFieldParams
) {
  const {
    type = Scalars.jsonString,
    description,
    allowNull = true,
    allowNullOutput,
    hidden,
    nestHidden,
    sqlOptions,
    typeDefOptions,
  } = params;

  // if type is a giraffeqlObjectType, need to also generate and register the matching input
  if (type instanceof GiraffeqlObjectType) {
    const inputName = type.definition.name;
    if (!inputTypeDefs.has(inputName)) {
      new GiraffeqlInputType({
        name: inputName,
        description: type.definition.description,
        fields: Object.entries(type.definition.fields).reduce(
          (total, [key, val]) => {
            // currently only allowed to put scalars in nested json objects (sorry)
            if (val.type instanceof GiraffeqlScalarType) {
              total[key] = new GiraffeqlInputFieldType({
                type: val.type,
                required: true,
                arrayOptions: val.arrayOptions,
                allowNull: val.allowNullInput,
              });
            } else if (val.type instanceof GiraffeqlObjectTypeLookup) {
              // also allowing GiraffeqlObjectTypeLookup
              total[key] = new GiraffeqlInputFieldType({
                type: new GiraffeqlInputTypeLookup(val.type.name),
                required: true,
                arrayOptions: val.arrayOptions,
                allowNull: val.allowNullInput,
              });
            }
            return total;
          },
          {}
        ),
      });
    }
  }

  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    hidden,
    nestHidden,
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
    },
  });
}

// should handle kenums too
export function generateEnumField(
  params: {
    scalarDefinition: GiraffeqlScalarType;
    isKenum?: boolean;
    defaultValue?: Enum | Kenum;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    allowNullOutput,
    defaultValue, // must be abcEnum
    hidden,
    nestHidden,
    scalarDefinition,
    sqlOptions,
    typeDefOptions,
    isKenum = false,
  } = params;

  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    defaultValue: defaultValue?.parsed,
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
    ...remainingParams,
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
      typeDefOptions: { addable: false, updateable: false }, // not addable or updateable
    }),
    updatedAt: generateUnixTimestampField({
      description: "When the record was last updated",
      allowNull: false,
      defaultValue: knex.fn.now(),
      sqlOptions: { field: "updated_at" },
      typeDefOptions: { addable: false, updateable: false }, // not addable or updateable
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
        addable: false,
        updateable: false, // not addable or updateable
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
      typeDefOptions: { addable: false, updateable: false }, // not addable or updateable
    }),
  };
}

export function generateJoinableField(
  params: {
    service: PaginatedService;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    allowNullOutput,
    defaultValue,
    hidden,
    sqlOptions,
    typeDefOptions,
    service,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    defaultValue,
    hidden,
    sqlType: service.primaryKeyAutoIncrement ? "integer" : "string",
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
    service: PaginatedService;
    isArray?: boolean;
  } & GenerateFieldParams
) {
  const {
    description,
    allowNull = true,
    allowNullOutput,
    isArray = false,
    defaultValue,
    hidden,
    service,
    sqlOptions,
    typeDefOptions,
  } = params;
  return generateStandardField({
    description,
    allowNull,
    allowNullOutput,
    defaultValue:
      defaultValue === undefined && isArray && !allowNullOutput
        ? []
        : defaultValue,
    hidden,
    sqlType: service.primaryKeyAutoIncrement ? "integer" : "string",
    type: service.typeDefLookup,
    sqlOptions: {
      ...(isArray && {
        // necessary for inserting JSON into DB properly
        parseValue: (val) => {
          // storing in DB as JSON: ["id1", "id2", ...]
          // although any unique key combination can be inputted (via typeDefLookup), only the id is currently supported using this simple implementation
          return JSON.stringify(val.map((input) => input.id));
        },
        type: "jsonb",
      }),
      ...sqlOptions,
    },
    typeDefOptions: {
      dataloader: ({ req, query, fieldPath, data, idArray }) => {
        // if idArray empty, return empty array
        if (!idArray.length) return Promise.resolve([]);
        // aggregator function that must accept idArray = [1, 2, 3, ...]
        return getObjectType({
          typename: service.typename,
          req,
          fieldPath,
          additionalSelect: [
            {
              field: "id", // always add the required id field, in case it wasn't requested in the query
            },
          ],
          externalQuery: query,
          sqlParams: {
            where: [{ field: "id", operator: "in", value: idArray }],
          },
          data,
        });
      },
      ...(isArray && {
        arrayOptions: {
          // nulls are filtered out automatically by dataloader
          allowNullElement: false,
        },
      }),
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
export function generatePaginatorPivotResolverObject({
  pivotService,
  filterByField,
}: {
  pivotService: PaginatedService;
  filterByField?: string;
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

      return pivotService.getRecordPaginator({
        req,
        args: {
          ...validatedArgs,
          filterBy: filterObjectArray,
        },
        fieldPath,
        query,
        data,
      });
    };
  } else {
    rootResolverFunction = (inputs) => pivotService.getRecordPaginator(inputs);
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
    type: new GiraffeqlObjectType(<ObjectTypeDefinition>{
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
}: {
  pivotService: PaginatedService;
  filterByField?: string;
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

      return pivotService.getRecordStats({
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
    rootResolverFunction = (inputs) => pivotService.getRecordStats(inputs);
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
}: {
  pivotService: PaginatedService;
  filterByField?: string;
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

      return pivotService.getRecordAggregator({
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
    rootResolverFunction = (inputs) => pivotService.getRecordAggregator(inputs);
  }

  const hasSearchFields =
    pivotService.searchFieldsMap &&
    Object.keys(pivotService.searchFieldsMap).length > 0;

  const hasDistanceFields =
    pivotService.distanceFieldsMap &&
    Object.keys(pivotService.distanceFieldsMap).length > 0;

  const aggregatorKeyFieldScalarDefinition: ScalarDefinition = {
    name: pivotService.typename + "AggregatorKeyField",
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
      typeDefOptions: {
        addable: true,
        updateable: servicesObjectMap[field].updateable ?? true,
      },
      sqlOptions: {
        unique: "compositeIndex",
        ...(servicesObjectMap[field].sqlField && {
          field: servicesObjectMap[field].sqlField,
        }),
      },
    });
  }

  return <ObjectTypeDefinition>processTypeDef({
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
