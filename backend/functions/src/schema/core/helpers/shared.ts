import { StringKeyObject } from "../../../types";
import { customAlphabet } from "nanoid/async";
import { Request } from "express";
import { baseTimeoutSeconds } from "../../../config";
// An alphabet for generating short IDs.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

export function getUnixTimestamp(): number {
  return new Date().getTime();
}

export function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isObject(ele: unknown): ele is StringKeyObject {
  return Object.prototype.toString.call(ele) === "[object Object]";
}

export function flattenObject(
  obj: StringKeyObject,
  resultsObject: StringKeyObject = {},
  parentsArray: string[] = []
): StringKeyObject {
  Object.entries(obj).forEach(([key, value]) => {
    if (isObject(value)) {
      flattenObject(value, resultsObject, parentsArray.concat(key));
    } else {
      resultsObject[parentsArray.concat(key).join(".")] = value;
    }
  });

  return resultsObject;
}

export function expandObject(obj: StringKeyObject): StringKeyObject {
  const returnObject = {};
  const nestedFieldsSet: Set<string> = new Set();

  for (const field in obj) {
    if (field.match(/\./)) {
      const firstPart = field.substr(0, field.indexOf("."));
      const secondPart = field.substr(field.indexOf(".") + 1);

      // if field is set as null, skip
      if (returnObject[firstPart] === null) continue;

      // if field not in return object as object, set it
      if (!isObject(returnObject[firstPart])) {
        returnObject[firstPart] = {};
        nestedFieldsSet.add(firstPart);
      }

      // if secondPart is "id", set it to null
      if (secondPart === "id" && obj[field] === null) {
        returnObject[firstPart] = null;
        nestedFieldsSet.delete(firstPart);
        continue;
      }

      returnObject[firstPart][secondPart] = obj[field];
    } else {
      // leaf field, add to obj if not already set
      if (!(field in returnObject)) returnObject[field] = obj[field];
    }
  }

  // process the fields that are nested
  nestedFieldsSet.forEach((field) => {
    returnObject[field] = expandObject(returnObject[field]);
  });
  return returnObject;
}

export const snakeToCamel = (str: string): string =>
  str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());

export function camelToSnake(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
export function deepAssign(
  target: StringKeyObject,
  source: StringKeyObject
): StringKeyObject {
  for (const prop in source) {
    const targetProp = target[prop];
    const sourceProp = source[prop];
    // if present in source as object in both source and b,
    if (prop in target) {
      // recursive merge
      if (isObject(targetProp) && isObject(sourceProp)) {
        deepAssign(targetProp, sourceProp);
      }

      // if source and b both have arrays, merge them
      if (Array.isArray(targetProp) && Array.isArray(sourceProp)) {
        targetProp.push(...sourceProp);
      }
    } else {
      //if not present in source OR there is a mismatch in the objects, overwrite the source record
      target[prop] = sourceProp;
    }
  }
  return target;
}

export function atob(str: string): string {
  return Buffer.from(str).toString("base64");
}

export function btoa(str: string): string {
  return Buffer.from(str, "base64").toString("ascii");
}

export function capitalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function lowercaseString(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regexp
}

export function objectOnlyHasFields(
  obj: StringKeyObject,
  fields: string[],
  allFieldsRequired = false
) {
  const objKeys = Object.keys(obj);

  return allFieldsRequired
    ? objKeys.length === fields.length &&
        objKeys.every((key) => fields.includes(key))
    : objKeys.every((key) => fields.includes(key));
}

export function objectDoesNotHaveFields(
  obj: StringKeyObject,
  fields: string[]
) {
  const objKeys = Object.keys(obj);

  return objKeys.every((key) => !fields.includes(key));
}

export function generateId(size = 8) {
  const generateIdFn = customAlphabet(alphabet, size);

  return generateIdFn();
}

// retrieves the cursor from the raw node
export function generateCursorFromNode(rawNode) {
  if (!rawNode) return null;

  const lastValues: any[] = [];

  let lastValueIndex = 0;
  while (`$last_value_${lastValueIndex}` in rawNode) {
    lastValues.push(rawNode[`$last_value_${lastValueIndex}`]);
    lastValueIndex++;
  }

  const lastId = rawNode.$last_id;

  return atob(
    JSON.stringify({
      lastId,
      lastValues,
    })
  );
}

// returns a boolean saying if the request is about to be timed out (5 sec before timeout)
export function isTimeoutImminent(req: Request) {
  return Date.now() - req.startTime > baseTimeoutSeconds.value() * 1000 - 5000;
}

export function isEmptyQuery(query: unknown) {
  return isObject(query) && Object.keys(query).length < 1;
}

export function getArgsNewValue(fields, item, fieldname) {
  if (item[fieldname] === undefined) {
    throw new Error(
      `Item does not contain the requested compare field: '${fieldname}'`
    );
  }

  // stringifying to make arrays equal, if they have the same contents
  return fields[fieldname] !== undefined &&
    JSON.stringify(fields[fieldname]) !== JSON.stringify(item[fieldname])
    ? fields[fieldname]
    : undefined;
}

// for all fields in updateFieldsObject, return undefined if unchanged, or the new value if changed (original value held in 'originalItem')
export function getUpdatedFieldValues(
  updateFieldsObject,
  originalItem,
  fields?: string[]
): { [x: string]: any } {
  return Object.entries(updateFieldsObject).reduce((total, [key, val]) => {
    if (!fields || (fields && fields.includes(key))) {
      total[key] = getArgsNewValue(updateFieldsObject, originalItem, key);
    }
    return total;
  }, {});
}

// parses templateString and replaces with any params
export function processTemplate(
  templateString: string,
  params: { [x in string]: string }
) {
  let templateStringModified = templateString;
  Object.entries(params).forEach(([key, value]) => {
    const currentRegex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    templateStringModified = templateStringModified.replace(
      currentRegex,
      value
    );
  });

  return templateStringModified;
}

export function getNestedProperty(obj: StringKeyObject, path: string) {
  const pathArray = path.split(/\./);
  let currentValue = obj;
  for (const prop of pathArray) {
    // if not object, return null;
    if (!(currentValue && typeof currentValue === "object")) {
      return null;
    }
    currentValue = currentValue[prop];
  }
  return currentValue;
}
