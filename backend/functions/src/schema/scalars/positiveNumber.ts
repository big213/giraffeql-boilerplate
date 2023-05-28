import { GiraffeqlScalarType } from "giraffeql";

function validate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") throw true;

  if (Number.isNaN(Number(value))) throw true;

  const parsedValue = Number(value);

  if (parsedValue < 0) throw true;

  return parsedValue;
}

export const positiveNumber = new GiraffeqlScalarType({
  name: "positiveNumber",
  types: ["number"],
  description: "Numeric value greater than equal to 0",
  parseValue: validate,
  serialize: validate,
});
