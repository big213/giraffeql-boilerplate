import { SqlSingleFieldObject, SqlWhereObject } from "./sql";

export type SqlSimpleWhereObject = {
  [x: string]: unknown;
};

// converts a simple where object to SqlWhereObject
export function generateSqlWhereObject(
  simpleWhereObject: SqlSimpleWhereObject
): SqlWhereObject {
  const whereObject: SqlWhereObject = { fields: [] };
  Object.entries(simpleWhereObject).forEach(([key, val]) => {
    whereObject.fields.push({
      field: {
        field: key,
      },
      value: val,
    });
  });

  return whereObject;
}

// fieldPath can have dot notation
// args will be appended on the final object
export function generateSqlSingleFieldObject(
  fieldPath: string,
  args?: any
): SqlSingleFieldObject {
  const fieldParts = fieldPath.split(/\./);

  if (!fieldParts.length) throw new Error(`Invalid fieldPath`);

  const singleFieldObject: SqlSingleFieldObject = {
    field: fieldParts[0],
    nested: null,
  };

  let currentSingleFieldObject = singleFieldObject;

  fieldParts.forEach((fieldFragment, index) => {
    // skip first one
    if (index === 0) return;

    currentSingleFieldObject.nested = {
      field: fieldFragment,
      // args added on the final object
      ...(index === fieldParts.length - 1 && {
        args,
      }),
    };

    // shift
    currentSingleFieldObject = currentSingleFieldObject.nested;
  });

  return singleFieldObject;
}

// generates a sqlSingleFieldObject from a fieldInfoArray
export function generateSqlSingleFieldObjectFromArray(
  fieldInfoArray: {
    field: string;
    args: any;
  }[]
): SqlSingleFieldObject {
  if (!fieldInfoArray.length) throw new Error(`Invalid fieldPathArray`);

  const singleFieldObject: SqlSingleFieldObject = {
    field: fieldInfoArray[0].field,
    args: fieldInfoArray[0].args,
    nested: null,
  };

  let currentSingleFieldObject = singleFieldObject;

  fieldInfoArray.forEach((fieldPathInfo, index) => {
    // skip first one
    if (index === 0) return;

    currentSingleFieldObject.nested = {
      field: fieldPathInfo.field,
      args: fieldPathInfo.args,
    };

    // shift
    currentSingleFieldObject = currentSingleFieldObject.nested;
  });

  return singleFieldObject;
}

// takes a SqlSingleFieldObject and extracts the fieldPath from it
export function generateFieldPath(
  singleFieldObject: SqlSingleFieldObject,
  fieldPath: string[] = []
) {
  const parentPlusCurrentField = fieldPath.concat(singleFieldObject.field);

  if (singleFieldObject.nested) {
    return generateFieldPath(singleFieldObject.nested, parentPlusCurrentField);
  } else {
    return parentPlusCurrentField.join(".");
  }
}
