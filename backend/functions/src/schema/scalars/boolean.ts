import { GiraffeqlScalarType } from "giraffeql";

function validate(value: unknown) {
  if (typeof value === "boolean" || value === null) return value;
  else if (value === "true") return true;
  else if (value === "false") return false;
  else throw true;
}

export const boolean = new GiraffeqlScalarType({
  name: "boolean",
  types: ["boolean"],
  description: "Boolean value",
  parseValue: validate,
  serialize: validate,
});
