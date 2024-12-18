import * as enums from "../enums";

import { BaseScalars } from "giraffeql";

// base scalars
export const string = BaseScalars.string;
// export const number = BaseScalars.number;
// export const boolean = BaseScalars.boolean;
export const unknown = BaseScalars.unknown;

// added scalars
export { number } from "./number"; // replacing the built-in number type to automatically parse Number-like strings
export { boolean } from "./boolean"; // replacing the built-in boolean type to automatically parse "true" and "false" as booleans
export { positiveNumber } from "./positiveNumber";
export { negativeNumber } from "./negativeNumber";
export { positiveNumberAndZero } from "./positiveNumberAndZero";
export { negativeNumberAndZero } from "./negativeNumberAndZero";
export { imageUrl } from "./imageUrl";
export { url } from "./url";
export { unixTimestamp } from "./unixTimestamp";
export { date } from "./date";
export { id } from "./id";
export { regex } from "./regex";
export { json } from "./json";
export { jsonString } from "./jsonString";
export { email } from "./email";

// generate the scalar types
export const userRole = enums.userRole.generateScalarType();
export const userPermission = enums.userPermission.generateScalarType();
/** END ENUM Scalar Types */
