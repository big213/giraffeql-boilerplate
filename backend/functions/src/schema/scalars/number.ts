import { GiraffeqlScalarType } from "giraffeql";

function validate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") throw true;

  // if empty string, throw err (this would convert to 0, which is not intended behavior)
  if (typeof value === "string" && !value.trim()) {
    throw true;
  }

  if (Number.isNaN(Number(value))) throw true;

  const parsedValue = Number(value);

  return parsedValue;
}

export const number = new GiraffeqlScalarType({
  name: "number",
  types: ["number"],
  description: "Numeric value",
  parseValue: validate,
  serialize: validate,
});
