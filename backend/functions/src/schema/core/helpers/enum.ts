import { GiraffeqlScalarType, ScalarDefinition } from "giraffeql";

export abstract class Kenum {
  static type = "Kenum";
  static scalarType: GiraffeqlScalarType;

  static getScalarType() {
    if (!this.scalarType) {
      this.scalarType = new GiraffeqlScalarType({
        name: this.getName(),
        types: this.values.map((ele: any) => `"${ele.name}"`),
        description: `Enum stored as a separate key value`,
        serialize: (value: unknown) => this.parse(value)?.name ?? null, // convert from index to name
        parseValue: (value: unknown) => {
          return this.parse(value)?.index ?? null;
        }, // convert from NAME to index
      });
    }

    return this.scalarType;
  }

  public static get values(): Kenum[] {
    return Object.values(this).filter((ele) => ele instanceof Kenum);
  }

  static parse(val: unknown, noNullsAllowed = false): Kenum | null | undefined {
    // if null, return null (except if noNullsAllowed)
    if (val === null && !noNullsAllowed) return null;

    if (val === undefined && !noNullsAllowed) return undefined;

    if (typeof val === "number") return this.fromIndex(val);

    if (typeof val === "string") return this.fromName(val);

    throw new Error(
      `Invalid key type for kenum '${this.getName()}'. Only Number or String allowed`
    );
  }

  static parseNoNulls(val: unknown): Kenum {
    return this.parse(val, true)!;
  }

  private static fromName(name: string): Kenum {
    const value = (this as any)[name];
    if (value) {
      return value;
    }

    throw new RangeError(
      `Illegal argument passed to fromName(): ${name} does not correspond to any instance of the enum ${
        (this as any).prototype.constructor.name
      }`
    );
  }

  private static fromIndex(index: number): Kenum {
    const value = this.values.find((ele) => ele.index === index);
    if (value) {
      return value;
    }

    throw new RangeError(
      `Illegal argument passed to fromIndex(): ${index} does not correspond to any instance of the enum ${
        (this as any).prototype.constructor.name
      }`
    );
  }

  // returns the name of the kenum (minus the kenum part)
  static getName(): string {
    return (this as any).prototype.constructor.name.replace(/Kenum$/, "");
  }

  constructor(
    public readonly name: string,
    public readonly index: number,
    public readonly description: string = ""
  ) {}

  public get parsed(): number {
    return this.index;
  }

  public toJSON(): string {
    return this.name;
  }
}

export abstract class Enum {
  static type = "Enum";
  static scalarType: GiraffeqlScalarType;

  static getScalarType() {
    if (!this.scalarType) {
      this.scalarType = new GiraffeqlScalarType({
        name: this.getName(),
        types: this.values.map((ele: any) => `"${ele.name}"`),
        description: `Enum stored as is`,
        serialize: (value: unknown) => this.parse(value)?.name ?? null, // convert from index to name
        parseValue: (value: unknown) => {
          return this.parse(value)?.name ?? null;
        }, // convert from NAME to index
      });
    }

    return this.scalarType;
  }

  public static get values(): Enum[] {
    return Object.values(this).filter((ele) => ele instanceof Enum);
  }

  static parse(val: unknown, noNullsAllowed = false): Enum | null {
    // if null, return null (except if noNullsAllowed)
    if (val === null && !noNullsAllowed) return null;

    if (typeof val === "string") return this.fromName(val);

    throw new Error(
      `Invalid key type for enum '${this.getName()}'. Only String allowed`
    );
  }

  static parseNoNulls(val: unknown): Enum {
    return this.parse(val, true)!;
  }

  private static fromName(name: string): Enum {
    const value = (this as any)[name];
    if (value) {
      return value;
    }

    throw new RangeError(
      `Illegal argument passed to fromName(): ${name} does not correspond to any instance of the enum ${
        (this as any).prototype.constructor.name
      }`
    );
  }

  // returns the name of the enum (minus the enum part)
  static getName(): string {
    return (this as any).prototype.constructor.name.replace(/Enum$/, "");
  }

  constructor(
    public readonly name: string,
    public readonly description: string = ""
  ) {}

  public get parsed(): string {
    return this.name;
  }

  public toJSON(): string {
    return this.name;
  }
}
