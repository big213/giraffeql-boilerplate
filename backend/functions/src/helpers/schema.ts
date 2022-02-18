import { TsSchemaGenerator } from "giraffeql";
export class CustomSchemaGenerator extends TsSchemaGenerator {
  constructor(giraffeqlOptions) {
    super(giraffeqlOptions);
    this.scaffoldStr += `
type Edge<T> = {
  __typename: Field<string, undefined>;
  node: Field<T, undefined>;
  cursor: Field<string, undefined>;
};

export type FilterByField<T> = {
  eq?: T
  neq?: T
  gt?: T
  lt?: T
  in?: T[]
  nin?: T[]
  regex?: Scalars['regex']
}

export type SortByField<T> = {
  field: T
  desc: boolean
}\n\n`;
  }

  // additional post-processing of the schema
  processSchema() {
    // loop through this.inputTypeTsTypeFields and find places to simplify
    this.inputTypeTsTypeFields.value.forEach((value, key) => {
      // if inputDefName contains FilterByField/, transform it into a FilterByField<T>
      if (key.match(/FilterByField\//)) {
        if (typeof value.value !== "string") {
          const filterByType = value.value.get("eq")?.value;
          if (filterByType) {
            this.inputTypeTsTypeFields.value.set(key, {
              value: `FilterByField<${filterByType}>`,
              isNullable: false,
              isOptional: false,
            });
          }
        }
      }

      // if inputDefName ends with SortByObject, transform it into a SortByField<T>
      if (key.match(/SortByObject$/)) {
        if (typeof value.value !== "string") {
          const sortByType = value.value.get("field")?.value;
          if (sortByType) {
            this.inputTypeTsTypeFields.value.set(key, {
              value: `SortByField<${sortByType}>`,
              isNullable: false,
              isOptional: false,
            });
          }
        }
      }
    });

    // loop through types and find places to simplify
    this.typeDocumentRoot.value.forEach((value, key) => {
      // if typeDefKey ends in Edge, simplify to generic to save space
      if (key.match(/Edge$/)) {
        this.typeDocumentRoot.value.set(key, {
          value: `Edge<${key.replace(/Edge$/, "")}>`,
          isNullable: false,
          isOptional: false,
        });
      }
    });
  }
}
