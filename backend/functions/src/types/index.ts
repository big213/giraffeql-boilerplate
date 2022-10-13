import type { Request } from "express";
import Knex = require("knex");
import { SpecialJoinDefinition } from "../schema/core/helpers/sql";
import { userPermissionEnum, userRoleKenum } from "../schema/enums";

export type StringKeyObject = Record<string, unknown>;

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

  getter?: (tableAlias: string, field: string) => string;
  setter?: (value: string) => string;
  parseValue?: (value: any) => any; // performed before inserts/updates

  // sql definition
  type?: SqlType;
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
  | "jsonb";

export type ExternalQuery = {
  [x: string]: any;
};

export type ServiceFunctionInputs = {
  req: Request;
  fieldPath: string[];
  args: any;
  query?: any;
  data?: any;
  isAdmin?: boolean;
};

export type ContextUser = {
  id: string;
  role: userRoleKenum | null;
  permissions: userPermissionEnum[];
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
  fieldPath: string[];
  args: any;
  query: any;
  data?: any;
  idArray: any[];
};

export type DataloaderFunction = (
  input: DataloaderFunctionInput
) => Promise<unknown[]>;

export type PaginatorData = {
  rootArgs: StringKeyObject;
  records: StringKeyObject[];
};

export type CustomResolverFunction = (
  typename: string,
  req: Request,
  value: any,
  currentObject: any
) => any;
