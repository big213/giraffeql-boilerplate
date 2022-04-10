import { StringKeyObject } from "../../../types";
import { customAlphabet } from "nanoid/async";
import { Request } from "express";
import { functionTimeoutSeconds } from "../../../config";
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

export function generateId(size = 8) {
  const generateIdFn = customAlphabet(alphabet, size);

  return generateIdFn();
}

// extracts last_value_N values from an object and returns an array
export function extractLastValueColumns(
  obj: StringKeyObject,
  deleteProps = false
) {
  const lastValues: any[] = [];

  let lastValueIndex = 0;
  while (`$last_value_${lastValueIndex}` in obj) {
    lastValues.push(obj[`$last_value_${lastValueIndex}`]);
    if (deleteProps) delete obj[`$last_value_${lastValueIndex}`];
    lastValueIndex++;
  }

  return lastValues;
}

// returns a boolean saying if the request is about to be timed out (5 sec before timeout)
export function isTimeoutImminent(req: Request) {
  return Date.now() - req.startTime > functionTimeoutSeconds * 1000 - 5000;
}
