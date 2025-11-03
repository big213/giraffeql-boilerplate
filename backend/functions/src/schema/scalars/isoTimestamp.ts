import { GiraffeqlScalarType } from "giraffeql";

function validate(value) {
  // if it's already a date object, convert it into ISO string
  if (value instanceof Date) return value.toISOString();

  if (typeof value !== "string") throw true;

  // expecting something like 2025-11-01T20:15:30.123Z (or +/-04:00)
  if (
    !value.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(Z|([+-]\d{2}):?(\d{2}))?$/
    )
  )
    throw true;

  return value;
}

export const isoTimestamp = new GiraffeqlScalarType({
  name: "isoTimestamp",
  types: ["string"],
  description: "ISO Timestamp",
  serialize: validate,
  parseValue: validate,
});
