import { GiraffeqlScalarType } from "giraffeql";

function validate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") throw true;

  const parsedValue = Number(value);
  if (Number.isNaN(Number(value))) throw true;

  return parsedValue;
}

export const number = new GiraffeqlScalarType({
  name: "number",
  types: ["number"],
  description: "Numeric value",
  parseValue: validate,
  serialize: validate,
});
