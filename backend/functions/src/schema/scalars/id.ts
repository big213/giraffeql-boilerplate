import { GiraffeqlScalarType } from "giraffeql";

function validate(value: unknown) {
  if (typeof value !== "string") throw true;

  if (!value.match(/^[0-9a-z]{4,8}$/)) throw true;

  return value;
}

export const id = new GiraffeqlScalarType({
  name: "id",
  types: ["string"],
  description: "ID Field",
  parseValue: validate,
  serialize: validate,
});
