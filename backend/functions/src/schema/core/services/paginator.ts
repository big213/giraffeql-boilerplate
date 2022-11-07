import { SimpleService, PaginatedService } from ".";
import { generatePaginatorTypeDef } from "../generators";
import { ServiceFunctionInputs } from "../../../types";

import { lookupSymbol, GiraffeqlObjectType } from "giraffeql";
import {
  btoa,
  escapeRegExp,
  generateCursorFromNode,
  processRawNode,
} from "../helpers/shared";
import {
  SqlOrderByObject,
  SqlSelectQuery,
  SqlSelectQueryObject,
  SqlWhereFieldOperator,
  SqlWhereObject,
} from "../helpers/sql";
import { countObjectType, getObjectType } from "../helpers/resolver";

export class PaginatorService extends SimpleService {
  service: PaginatedService;

  constructor(service: PaginatedService) {
    super(service.typename + "Paginator");
    this.service = service;
    this.typeDef = new GiraffeqlObjectType(generatePaginatorTypeDef(service));

    this.defaultQuery = {
      paginatorInfo: {
        total: lookupSymbol,
        count: lookupSymbol,
      },
      edges: {
        node: service.defaultQuery,
      },
    };
  }

  async getRecord({
    req,
    fieldPath,
    args,
    query,
    data,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const returnObject: any = {};

    let rawResults;
    // if startCursor, endCursor, or edges is requested, must fetch the results
    if (
      query.paginatorInfo?.startCursor ||
      query.paginatorInfo?.endCursor ||
      query.paginatorInfo?.count ||
      query.edges
    ) {
      rawResults = await this.getRecords({
        req,
        fieldPath,
        args,
        query: query.edges?.node ?? {},
        data,
        isAdmin,
      });
    }

    if (query.edges) {
      returnObject.edges = rawResults.map((rawNode) => {
        return {
          ...(query.edges.cursor && {
            cursor: generateCursorFromNode(rawNode),
          }),
          node: processRawNode(rawNode),
        };
      });
    }

    if (query.paginatorInfo) {
      returnObject.paginatorInfo = {};
      if (query.paginatorInfo.total) {
        returnObject.paginatorInfo.total = await this.countRecords({
          req,
          fieldPath,
          args,
          query,
          data,
          isAdmin,
        });
      }

      if (query.paginatorInfo.count) {
        returnObject.paginatorInfo.count = rawResults.length;
      }

      if (query.paginatorInfo.startCursor) {
        returnObject.paginatorInfo.startCursor = generateCursorFromNode(
          rawResults[0]
        );
      }

      if (query.paginatorInfo.endCursor) {
        returnObject.paginatorInfo.endCursor = generateCursorFromNode(
          rawResults[rawResults.length - 1]
        );
      }
    }

    return returnObject;
  }

  async getRecords({
    req,
    fieldPath,
    args,
    query,
    data,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(args.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      args.filterBy.forEach((filterByObject) => {
        const filterByAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [],
        };
        filterByOrObject.fields.push(filterByAndObject);
        Object.entries(filterByObject).forEach(
          ([filterKey, filterKeyObject]) => {
            Object.entries(<any>filterKeyObject).forEach(
              ([operationKey, operationValue]) => {
                filterByAndObject.fields.push({
                  field:
                    this.service.filterFieldsMap[filterKey].field ?? filterKey,
                  operator: <SqlWhereFieldOperator>operationKey,
                  value: operationValue,
                });
              }
            );
          }
        );
      });
    }

    // handle search fields
    if (args.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const field in this.service.searchFieldsMap) {
        // if field options has exact, ony allow eq
        if (this.service.searchFieldsMap[field].exact) {
          whereSubObject.fields.push({
            field: field,
            value: args.search,
            operator: "eq",
          });
        } else {
          whereSubObject.fields.push({
            field: this.service.searchFieldsMap[field].field ?? field,
            value: new RegExp(escapeRegExp(args.search), "i"),
            operator: "regex",
          });
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    // process sort fields
    const orderBy: SqlOrderByObject[] = [];
    const rawSelect: SqlSelectQueryObject[] = [{ field: "id", as: "$last_id" }];

    // add secondary, etc. sort parameters
    if (Array.isArray(args.sortBy)) {
      orderBy.push(...args.sortBy);
    }

    // for each sort param, add it to the rawSelect
    orderBy.forEach((orderByObject, index) => {
      rawSelect.push({
        field: orderByObject.field,
        as: `$last_value_${index}`,
      });
    });

    // always add id asc sort as final sort param
    orderBy.push({
      field: "id",
      desc: false,
    });

    // process the "after" or "before" constraint, if provided
    // only one should have been provided
    if (args.after || args.before) {
      // parse cursor
      const parsedCursor = JSON.parse(btoa(args.after || args.before));

      const whereOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      // for each orderBy statement, need to generate the required where constraints
      orderBy.forEach((orderByObject, index) => {
        const operator = (
          args.before ? !orderByObject.desc : orderByObject.desc
        )
          ? "lt"
          : "gt";

        const lastValue = parsedCursor.lastValues[index];

        // if null last value, skip
        if (lastValue === null) return;

        const whereAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [
            {
              field: orderByObject.field,
              operator,
              value:
                orderByObject.field === "id" ? parsedCursor.lastId : lastValue,
            },
          ],
        };

        // build additional cascading whereAndObjects
        orderBy.slice(0, index).forEach((orderByObject, index) => {
          const lastValue = parsedCursor.lastValues[index];
          whereAndObject.fields.push({
            field: orderByObject.field,
            operator: "eq",
            value:
              orderByObject.field === "id" ? parsedCursor.lastId : lastValue,
          });
        });

        whereOrObject.fields.push(whereAndObject);
      });

      whereObject.fields.push(whereOrObject);
    }

    // set limit to args.first or args.last, one of which must be provided
    const limit = Number(args.first ?? args.last);

    const sqlParams: Omit<SqlSelectQuery, "table" | "select"> = {
      where: [whereObject],
      orderBy,
      limit,
      specialParams: await this.service.getSpecialParams({
        req,
        fieldPath,
        args,
        query,
        data,
        isAdmin,
      }),
      distinctOn: undefined,
      groupBy: Array.isArray(args.groupBy)
        ? args.groupBy.reduce((total, item, index) => {
            if (item in this.service.groupByFieldsMap) {
              total.push({
                field: this.service.groupByFieldsMap[item].field ?? item,
              });
            }
            return total;
          }, [])
        : null,
    };

    this.service.sqlParamsModifier && this.service.sqlParamsModifier(sqlParams);

    // populate the distinctOn, in case the sqlParamsModifier modified the orderBy
    sqlParams.distinctOn = orderBy.map((ele) => ele.field).concat("id");

    const results = await getObjectType({
      typename: this.service.typename,
      req,
      fieldPath,
      externalQuery: query,
      rawSelect,
      sqlParams,
      data,
    });

    return args.reverse
      ? args.before
        ? results
        : results.reverse()
      : args.before
      ? results.reverse()
      : results;
  }

  async countRecords({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const whereObject: SqlWhereObject = {
      connective: "AND",
      fields: [],
    };

    if (Array.isArray(args.filterBy)) {
      const filterByOrObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };
      whereObject.fields.push(filterByOrObject);

      args.filterBy.forEach((filterByObject) => {
        const filterByAndObject: SqlWhereObject = {
          connective: "AND",
          fields: [],
        };
        filterByOrObject.fields.push(filterByAndObject);
        Object.entries(filterByObject).forEach(
          ([filterKey, filterKeyObject]) => {
            Object.entries(<any>filterKeyObject).forEach(
              ([operationKey, operationValue]) => {
                filterByAndObject.fields.push({
                  field:
                    this.service.filterFieldsMap[filterKey].field ?? filterKey,
                  operator: <SqlWhereFieldOperator>operationKey,
                  value: operationValue,
                });
              }
            );
          }
        );
      });
    }

    //handle search fields
    if (args.search) {
      const whereSubObject: SqlWhereObject = {
        connective: "OR",
        fields: [],
      };

      for (const field in this.service.searchFieldsMap) {
        // if field options has exact, ony allow eq
        if (this.service.searchFieldsMap[field].exact) {
          whereSubObject.fields.push({
            field: field,
            value: args.search,
            operator: "eq",
          });
        } else {
          whereSubObject.fields.push({
            field: this.service.searchFieldsMap[field].field ?? field,
            value: new RegExp(escapeRegExp(args.search), "i"),
            operator: "regex",
          });
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    const resultsCount = await countObjectType(
      this.service.typename,
      fieldPath,
      [whereObject],
      true
    );

    return resultsCount;
  }
}
