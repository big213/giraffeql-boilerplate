import * as enums from "../enums";

import { BaseScalars } from "giraffeql";

// added scalars
import { number } from "./number";
import { boolean } from "./boolean";
import { positiveNumber } from "./positiveNumber";
import { negativeNumber } from "./negativeNumber";
import { positiveNumberAndZero } from "./positiveNumberAndZero";
import { negativeNumberAndZero } from "./negativeNumberAndZero";
import { imageUrl } from "./imageUrl";
import { url } from "./url";
import { unixTimestamp } from "./unixTimestamp";
import { date } from "./date";
import { id } from "./id";
import { regex } from "./regex";
import { json } from "./json";
import { jsonString } from "./jsonString";
import { email } from "./email";

export const Scalars = {
  string: BaseScalars.string,
  unknown: BaseScalars.unknown,
  number, // replacing the built-in number type to automatically parse Number-like strings
  boolean, // replacing the built-in boolean type to automatically parse "true" and "false" as booleans
  positiveNumber,
  negativeNumber,
  positiveNumberAndZero,
  negativeNumberAndZero,
  imageUrl,
  url,
  unixTimestamp,
  date,
  id,
  regex,
  json,
  jsonString,
  email,

  // generate the enum scalar types
  userRole: enums.userRole.getScalarType(),
  userPermission: enums.userPermission.getScalarType(),
  /** END ENUM Scalar Types */
};
