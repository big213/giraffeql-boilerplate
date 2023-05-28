import { GiraffeqlScalarType } from "giraffeql";

export abstract class Kenum {
  static get values(): Kenum[] {
    return Object.values(this);
  }

  static fromName(name: string): Kenum {
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

  static fromIndex(index: number): Kenum {
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

  static fromUnknown(key: unknown): Kenum {
    if (typeof key === "number") return this.fromIndex(key);

    if (typeof key === "string") return this.fromName(key);

    throw new Error(
      "Invalid key type for kenum. Only Number or String allowed"
    );
  }

  // returns the name of the kenum (minus the kenum part)
  static getName(): string {
    return (this as any).prototype.constructor.name;
  }

  static generateScalarType() {
    return new GiraffeqlScalarType({
      name: this.getName(),
      types: this.values.map((ele: any) => `"${ele.name}"`),
      description: `Enum stored as a separate key value`,
      serialize: (value: unknown) => this.fromUnknown(value).name, // convert from index to name
      parseValue: (value: unknown) => {
        return this.fromUnknown(value).index;
      }, // convert from NAME to index
    });
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
  static fromName(name: string): Enum {
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

  static fromUnknown(key: unknown): Enum {
    if (typeof key === "string") return this.fromName(key);

    throw new Error("Invalid key type for enum. Only String allowed");
  }

  static get values(): Enum[] {
    return Object.values(this);
  }

  // returns the name of the enum (minus the enum part)
  static getName(): string {
    return (this as any).prototype.constructor.name;
  }

  static generateScalarType() {
    return new GiraffeqlScalarType({
      name: this.getName(),
      types: this.values.map((ele: any) => `"${ele.name}"`),
      description: `Enum stored as is`,
      serialize: (value: unknown) => this.fromUnknown(value).name, // convert from index to name
      parseValue: (value: unknown) => {
        return this.fromUnknown(value).name;
      }, // convert from NAME to index
    });
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
