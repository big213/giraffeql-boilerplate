import * as enums from "../enums";

import { BaseScalars } from "giraffeql";

// base scalars
export const string = BaseScalars.string;
// export const number = BaseScalars.number;
export const boolean = BaseScalars.boolean;
export const unknown = BaseScalars.unknown;

// added scalars
export { number } from "./number"; // replacing the built-in number type to automatically parse Number-like strings
export { positiveNumber } from "./positiveNumber"; // >= 0
export { imageUrl } from "./imageUrl";
export { url } from "./url";
export { unixTimestamp } from "./unixTimestamp";
export { date } from "./date";
export { id } from "./id";
export { regex } from "./regex";
export { json } from "./json";
export { jsonString } from "./jsonString";

// generate the scalar types
export const userRole = enums.userRole.generateScalarType();
export const userPermission = enums.userPermission.generateScalarType();
