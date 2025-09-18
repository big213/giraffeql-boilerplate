import {
  generateAnonymousRootResolver,
  generateGiraffeqlResolverTree,
  processGiraffeqlResolverTree,
  GiraffeqlResolverNode,
  GiraffeqlObjectType,
  objectTypeDefs,
  GiraffeqlObjectTypeLookup,
  isRootResolverDefinition,
  GiraffeqlBaseError,
  GiraffeqlRootResolverType,
} from "giraffeql";

import {
  insertTableRow,
  updateTableRow,
  deleteTableRow,
  fetchTableRows,
  countTableRows,
  KnexExtendFunction,
  SqlSelectQuery,
  SqlWhereInput,
  SqlSimpleSelectObject,
  SqlSelectQueryObject,
  standardizeSelectInput,
  SqlSingleFieldObject,
} from "./sql";
import { CustomResolverFunction } from "../../../types";

import { expandObject } from "../helpers/shared";
import type { Request } from "express";
import {
  generateFieldPath,
  generateSqlSingleFieldObject,
  generateSqlSingleFieldObjectFromArray,
} from "./sqlHelper";
import { Knex } from "knex";
import { knex } from "../../../utils/knex";

type CustomResolver = {
  resolver: CustomResolverFunction;
  value?: unknown;
};

type CustomResolverMap = {
  [x: string]: CustomResolver;
};

type SqlSelectQueryOutput = {
  [x: string]: any;
};

//validates the add fields, and then does the add operation
export async function createObjectType({
  typename,
  req,
  rootResolver,
  fieldPath,
  addFields,
  extendFn,
  transaction,
}: {
  typename: string;
  req: Request;
  rootResolver: GiraffeqlRootResolverType;
  fieldPath: string[];
  addFields: { [x: string]: unknown };
  extendFn?: KnexExtendFunction;
  transaction?: Knex.Transaction;
}): Promise<any> {
  const typeDef = objectTypeDefs.get(typename);
  if (!typeDef) {
    throw new GiraffeqlBaseError({
      message: `Invalid typeDef '${typename}'`,
    });
  }

  // assemble the sql fields
  const sqlFields = {};

  // handle the custom setters
  const customResolvers: CustomResolverMap = {};

  for (const field in addFields) {
    if (!(field in typeDef.definition.fields)) {
      throw new GiraffeqlBaseError({
        message: `Invalid add field: ${field}`,
      });
    }

    // if it is a sql field, add to sqlFields
    if (typeDef.definition.fields[field].sqlOptions) {
      sqlFields[field] = addFields[field];
    }

    // if it has a custom updater, add to customResolvers
    const customResolver = typeDef.definition.fields[field].updater;
    if (customResolver) {
      customResolvers[field] = {
        resolver: customResolver,
        value: addFields[field],
      };
    }
  }

  let addedResults;

  // do the sql fields first, if any
  if (Object.keys(sqlFields).length > 0) {
    addedResults = await insertTableRow({
      table: typename,
      fields: sqlFields,
      extendFn,
      transaction,
    });
  }

  const resultObject = addedResults ? addedResults[0] : {};

  // handle the custom setter functions, which might rely on id of created object
  for (const field in customResolvers) {
    await customResolvers[field].resolver(
      typename,
      req,
      customResolvers[field].value,
      resultObject
    );
  }

  return resultObject;
}

// validates the update fields, and then does the update operation
export async function updateObjectType({
  typename,
  req,
  rootResolver,
  fieldPath,
  updateFields,
  id,
  transaction,
}: {
  typename: string;
  req: Request;
  rootResolver: GiraffeqlRootResolverType;
  fieldPath: string[];
  updateFields: { [x: string]: unknown };
  id: number;
  transaction?: Knex.Transaction;
}): Promise<any> {
  const typeDef = objectTypeDefs.get(typename);
  if (!typeDef) {
    throw new GiraffeqlBaseError({
      message: `Invalid typeDef '${typename}'`,
    });
  }

  //assemble the sql fields
  const sqlFields = {};

  //handle the custom setters
  const customResolvers: CustomResolverMap = {};

  for (const field in updateFields) {
    if (!(field in typeDef.definition.fields)) {
      throw new GiraffeqlBaseError({
        message: `Invalid update field`,
      });
    }

    // if it is a sql field, add to sqlFields
    if (typeDef.definition.fields[field].sqlOptions) {
      sqlFields[field] = updateFields[field];
    }

    // if it has a custom updater, add to customResolvers
    const customResolver = typeDef.definition.fields[field].updater;
    if (customResolver) {
      customResolvers[field] = {
        resolver: customResolver,
        value: updateFields[field],
      };
    }
  }

  // do the sql first, if any fields
  if (Object.keys(sqlFields).length > 0) {
    await updateTableRow({
      table: typename,
      fields: {
        ...sqlFields,
        updatedAt: knex.fn.now(),
      },
      where: {
        id,
      },
      transaction,
    });
  }

  const resultObject = {
    id,
  };

  //handle the custom setter functions, which might rely on primary keys
  for (const field in customResolvers) {
    await customResolvers[field].resolver(
      typename,
      req,
      customResolvers[field].value,
      resultObject
    );
  }

  return resultObject;
}

// performs the delete operation
export async function deleteObjectType({
  typename,
  req,
  rootResolver,
  fieldPath,
  id,
  transaction,
}: {
  typename: string;
  req: Request;
  rootResolver: GiraffeqlRootResolverType;
  fieldPath: string[];
  id: number;
  transaction?: Knex.Transaction;
}): Promise<any> {
  //resolve the deleters
  const typeDef = objectTypeDefs.get(typename);
  if (!typeDef) {
    throw new GiraffeqlBaseError({
      message: `Invalid typeDef '${typename}'`,
    });
  }

  let hasSqlFields = false;

  //handle the custom deleters
  const customResolvers: CustomResolverMap = {};

  for (const field in typeDef.definition.fields) {
    // see if it has sql fields
    if (typeDef.definition.fields[field].sqlOptions && !hasSqlFields)
      hasSqlFields = true;

    // if it has a custom deleter, add to customResolvers
    const customResolver = typeDef.definition.fields[field].deleter;
    if (customResolver) {
      customResolvers[field] = {
        resolver: customResolver,
      };
    }
  }

  // do the sql first
  if (hasSqlFields)
    await deleteTableRow({
      table: typename,
      where: {
        id,
      },
      transaction,
    });

  const resultObject = {
    id,
  };

  //handle the custom deleter functions, which might rely on primary keys
  for (const field in customResolvers) {
    await customResolvers[field].resolver(typename, req, null, resultObject);
  }

  return resultObject;
}

export async function getObjectType({
  typename,
  req,
  rootResolver,
  fieldPath,
  externalQuery,
  sqlParams,
  additionalSelect = [],
  externalTypeDef,
}: {
  typename: string;
  req: Request;
  rootResolver: GiraffeqlRootResolverType;
  fieldPath: string[];
  externalQuery: unknown;
  sqlParams?: Omit<SqlSelectQuery, "table" | "select">;
  additionalSelect?: SqlSimpleSelectObject[];
  externalTypeDef?: GiraffeqlObjectType;
}): Promise<any[]> {
  const typeDef = objectTypeDefs.get(typename);
  if (!typeDef) {
    throw new GiraffeqlBaseError({
      message: `Invalid typeDef '${typename}'`,
    });
  }

  const anonymousRootResolver = generateAnonymousRootResolver(
    externalTypeDef ?? new GiraffeqlObjectTypeLookup(typename)
  );

  // build an anonymous root resolver (and will also run validators)
  const giraffeqlResolverTree = await generateGiraffeqlResolverTree({
    fieldValue: externalQuery,
    resolverObject: anonymousRootResolver,
    fieldPath,
    validateArgs: false, // should already be validated
    runValidators: false, // should have already been run
    req,
    rootResolver,
  });

  // merge additionalSelect into a selectObject first
  const additionalSelectObject = standardizeSelectInput(additionalSelect);

  // convert GiraffeqlResolverNode into a validatedSqlQuery
  const selectObject = generateSqlQuerySelectObject({
    // should never end up in here without a nested query
    nestedResolverNodeMap: giraffeqlResolverTree.nested!,
    selectObject: additionalSelectObject,
    fieldPath,
  });

  let giraffeqlResultsTreeArray: SqlSelectQueryOutput[];

  // if no sql params, skip and return an empty object
  if (!sqlParams) {
    giraffeqlResultsTreeArray = [{}];
  } else {
    const sqlQuery = {
      select: selectObject,
      table: typename,
      ...sqlParams,
    };

    giraffeqlResultsTreeArray = (await fetchTableRows(sqlQuery)).map((obj) =>
      expandObject(obj)
    );
  }

  // finish processing GiraffeqlResolverNode by running the resolvers on the data fetched thru sql.
  const processedResultsTree = await Promise.all(
    giraffeqlResultsTreeArray.map((giraffeqlResultsTree) =>
      processGiraffeqlResolverTree({
        giraffeqlRootResolver: rootResolver,
        giraffeqlResultsNode: giraffeqlResultsTree,
        giraffeqlResolverNode: giraffeqlResolverTree,
        req,
        fieldPath,
      })
    )
  );

  // handle aggregated fields -- must be nested query. cannot be array of scalars like [1, 2, 3, 4] at the moment
  if (giraffeqlResolverTree.nested) {
    await handleAggregatedQueries({
      resultsArray: processedResultsTree,
      nestedResolverNodeMap: giraffeqlResolverTree.nested,
      req,
      rootResolver,
      fieldPath,
    });
  }

  return processedResultsTree;
}

export function countObjectType(
  typename: string,
  fieldPath: string[],
  whereInput: SqlWhereInput,
  distinct?: boolean
): Promise<number> {
  return countTableRows({
    table: typename,
    where: whereInput,
    distinct,
  });
}

function generateSqlQuerySelectObject({
  nestedResolverNodeMap,
  selectObject = {},
  fieldPath,
}: {
  nestedResolverNodeMap: { [x: string]: GiraffeqlResolverNode };
  selectObject?: SqlSelectQueryObject;
  fieldPath: string[];
}) {
  // traverse the nestedResolverNodeMap and retrieve all required fields
  const requiredFields = retrieveAllRequiredFields(nestedResolverNodeMap);

  // insert the required fields into selectObject
  [...requiredFields].reduce((total, fieldPath) => {
    selectObject[fieldPath] = generateSqlSingleFieldObject(fieldPath);
    return selectObject;
  }, selectObject);

  // traverse the nestedResolverNodeMap and return an array of SqlSingleFieldObject
  const singleFieldsObjects: SqlSingleFieldObject[] =
    generateSqlSingleFieldObjectArray({
      nestedResolverNodeMap,
      fieldPath,
    });

  // populate the selectObject.
  singleFieldsObjects.forEach((singleFieldObject) => {
    selectObject[generateFieldPath(singleFieldObject)] = singleFieldObject;
  });

  return selectObject;
}

function retrieveAllRequiredFields(
  nestedResolverNodeMap: {
    [x: string]: GiraffeqlResolverNode;
  },
  isDataloader = false,
  fieldPath: string[] = []
) {
  const requiredFields: Set<string> = new Set();

  Object.entries(nestedResolverNodeMap).forEach(([field, resolverNode]) => {
    if (isRootResolverDefinition(resolverNode.typeDef)) {
      throw new Error(`Misconfigured giraffeql`);
    }

    // only add the requiredSqlFields if it's not a dataloaded field
    if (resolverNode.typeDef.requiredSqlFields && !isDataloader) {
      resolverNode.typeDef.requiredSqlFields
        .map((requiredField) =>
          fieldPath.length
            ? `${fieldPath.join(".")}.${requiredField}`
            : requiredField
        )
        .forEach((ele) => {
          requiredFields.add(ele);
        });
    }
    resolverNode.typeDef.sqlOptions?.joinType;

    // if nested and not dataloader, traverse the tree
    if (resolverNode.nested && !isDataloader) {
      retrieveAllRequiredFields(
        resolverNode.nested,
        !!resolverNode.typeDef.dataloader,
        fieldPath.concat(field)
      ).forEach((ele) => requiredFields.add(ele));
    }
  });

  return requiredFields;
}

function generateSqlSingleFieldObjectArray({
  nestedResolverNodeMap,
  fieldInfoArray = [],
  singleFieldsObjects = [],
  fieldPath,
}: {
  nestedResolverNodeMap: { [x: string]: GiraffeqlResolverNode };
  fieldInfoArray?: {
    field: string;
    args: any;
  }[];
  singleFieldsObjects?: SqlSingleFieldObject[];
  fieldPath: string[];
}) {
  // traverse the nestedResolverNodeMap
  Object.entries(nestedResolverNodeMap).forEach(([field, resolverNode]) => {
    const typeDef = resolverNode.typeDef;
    // if root resolver object, skip (should never reach this case)
    if (isRootResolverDefinition(typeDef)) {
      throw new Error(`Misconfigured giraffeql`);
    }

    // always check if the field is nestHidden
    // if nestHidden, only allowed if on root level of query (cannot access the field in a nested context)
    if (fieldInfoArray.length && typeDef.nestHidden) {
      throw new GiraffeqlBaseError({
        message: `Requested field not allowed to be accessed directly in an nested context`,
        fieldPath: fieldPath.concat(field),
      });
    }

    if (typeDef.sqlOptions) {
      // duplicate the path, add the current field info
      const currentFieldInfoArray = [
        ...fieldInfoArray,
        {
          field,
          args: resolverNode.args,
        },
      ];

      // if nested with no resolver and no dataloader, AND joinable
      if (
        resolverNode.nested &&
        !typeDef.resolver &&
        !typeDef.dataloader &&
        typeDef.sqlOptions.joinType
      ) {
        // if yes, go deeper
        generateSqlSingleFieldObjectArray({
          nestedResolverNodeMap: resolverNode.nested,
          fieldInfoArray: currentFieldInfoArray,
          singleFieldsObjects,
          fieldPath: fieldPath.concat(field),
        });

        // if the nested map doesn't include id, add it manually (as ID field is required for proper processing of SQL fields)
        if (!resolverNode.nested.id) {
          singleFieldsObjects.push(
            generateSqlSingleFieldObjectFromArray(
              currentFieldInfoArray.concat({
                field: "id",
                args: null,
              })
            )
          );
        }
      } else {
        // if no, it's a leaf node. build the singleFieldObject and add to return array
        singleFieldsObjects.push(
          generateSqlSingleFieldObjectFromArray(currentFieldInfoArray)
        );
      }
    }
  });

  return singleFieldsObjects;
}

async function handleAggregatedQueries({
  resultsArray,
  nestedResolverNodeMap,
  req,
  rootResolver,
  args,
  fieldPath = [],
}: {
  resultsArray: any[];
  nestedResolverNodeMap: { [x: string]: GiraffeqlResolverNode };
  req: Request;
  rootResolver: GiraffeqlRootResolverType;
  args?: unknown;
  fieldPath?: string[];
}): Promise<void> {
  for (const field in nestedResolverNodeMap) {
    const currentFieldPath = fieldPath.concat(field);
    // if root resolver object, skip (should never reach this case)
    const typeDef = nestedResolverNodeMap[field].typeDef;
    if (isRootResolverDefinition(typeDef)) {
      continue;
    }

    const dataloaderFn = typeDef.dataloader;
    const nestedResolver = nestedResolverNodeMap[field].nested;
    if (dataloaderFn && nestedResolverNodeMap[field].query) {
      // if it has a dataloader, pass the fields to dataloader and have it replace the relevant fields in-place
      await dataloaderFn({
        req,
        rootResolver,
        args,
        query: nestedResolverNodeMap[field].query,
        fieldPath: currentFieldPath,
        resultsArray,
        field,
      });
    } else if (nestedResolver) {
      // if field does not have a dataloader, it must be nested.
      // build the array of records that will need replacing and go deeper
      const nestedResultsArray = resultsArray.reduce((total: any[], result) => {
        if (result) total.push(result[field]);
        return total;
      }, []);

      await handleAggregatedQueries({
        resultsArray: nestedResultsArray,
        nestedResolverNodeMap: nestedResolver,
        req,
        rootResolver,
        args,
        fieldPath: currentFieldPath,
      });
    }
  }
}
