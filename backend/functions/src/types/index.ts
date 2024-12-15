import type { Request } from "express";
import type { Knex } from "knex";
import {
  SpecialJoinDefinition,
  SqlFieldGetter,
} from "../schema/core/helpers/sql";
import { userPermission, userRole } from "../schema/enums";
import { GiraffeqlRootResolverType } from "giraffeql";

export type StringKeyObject = Record<string, any>;

export type SpecialJoinFunction = ({
  knexObject,
  parentTableAlias,
  joinTableAlias,
  specialJoinDefinition,
  specialParams,
}: {
  knexObject: Knex.QueryBuilder;
  parentTableAlias: string;
  joinTableAlias: string;
  specialJoinDefinition: SpecialJoinDefinition;
  specialParams: any;
}) => void;

export type ObjectTypeDefSqlOptions = {
  // if this is a join field, the typename of the joinType
  joinType?: string;

  // if this is an alias, the actual final field on the sqlTable this field refers to
  field?: string;

  specialJoin?: {
    // the field on the foreignTable
    field: string;

    // if the field exists on a foreign table, specify it here.
    foreignTable: string;
    // joinType?: string;
    // the function that will perform the necessary joins to access the foreignTable
    joinFunction: SpecialJoinFunction;
  };

  getter?: SqlFieldGetter;
  setter?: (value: string) => string;
  parseValue?: (value: any) => any; // performed before inserts/updates

  // sql definition
  type?: SqlType;
  // only used for decimal sqlType
  decimalOptions?: {
    precision: number;
    scale: number;
  };

  // only used for string sqlType
  stringOptions?: {
    length: number;
  };

  defaultValue?: any;
  unique?: boolean | string;
};

export type SqlType =
  | "string"
  | "integer"
  | "dateTime"
  | "date"
  | "text"
  | "float"
  | "decimal"
  | "boolean"
  | "json"
  | "jsonb"
  | "bigInteger";

export type ExternalQuery = {
  [x: string]: any;
};

export type ServiceFunctionInputs = {
  req: Request;
  fieldPath: string[];
  args: any;
  query?: any;
  rootResolver: GiraffeqlRootResolverType;
};

export type ContextUser = {
  id: string;
  role: userRole | null;
  permissions: userPermission[];
  isApiKey: boolean; // was the context created using an API Key?
};

export type AccessControlMap = {
  [x: string]: AccessControlFunction;
};

export type AccessControlFunction = (
  inputs: ServiceFunctionInputs
) => boolean | Promise<boolean>;

export type DataloaderFunctionInput = {
  req: Request;
  rootResolver: GiraffeqlRootResolverType;
  fieldPath: string[];
  args: any;
  query: any;
  idArray: any[];
};

export type DataloaderFunction = (
  input: DataloaderFunctionInput
) => Promise<unknown[]>;

export type CustomResolverFunction = (
  typename: string,
  req: Request,
  value: any,
  currentObject: any
) => any;
