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
  SqlSelectQuery,
  SqlSimpleOrderByObject,
  SqlSimpleRawSelectObject,
  SqlSimpleSelectObject,
  SqlWhereFieldOperator,
  SqlWhereObject,
  isKnexRawStatement,
} from "../helpers/sql";
import { countObjectType, getObjectType } from "../helpers/resolver";
import { generateSqlSingleFieldObject } from "../helpers/sqlHelper";
import { knex } from "../../../utils/knex";
import Knex = require("knex");

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

    // raw select statements (i.e. Knex.Raw)
    const rawSelect: SqlSimpleRawSelectObject[] = [];

    // additional select statements that should be added for scaffolding
    const additionalSelect: SqlSimpleSelectObject[] = [
      { field: "id", as: "$last_id" },
    ];

    // this helper function processes the args.filterBy, args.search, and args.distance
    this.processArgs(args, whereObject, rawSelect);

    // process sort fields
    const orderBy: SqlSimpleOrderByObject[] = [];

    // add secondary, etc. sort parameters
    if (Array.isArray(args.sortBy)) {
      orderBy.push(
        ...args.sortBy.map((sortByObject) => {
          if (this.service.distanceFieldsMap[sortByObject.field]) {
            // if it is a distanceField, confirm that the distance field was specified
            if (!args.distance?.[sortByObject.field]) {
              throw new Error(
                `If sorting by '${sortByObject.field}', distance parameters must be provided for this field`
              );
            }
            return {
              ...sortByObject,
              field: knex.raw(sortByObject.field),
            };
          } else {
            return sortByObject;
          }
        })
      );
    }

    // for each sort param, add it to the rawSelect (if it is not a knex.raw type
    orderBy.forEach((orderByObject, index) => {
      if (!isKnexRawStatement(orderByObject.field)) {
        additionalSelect.push({
          field: orderByObject.field,
          as: `$last_value_${index}`,
        });
      }
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
        // if it is a raw filter field, skip
        if (isKnexRawStatement(orderByObject.field)) return;

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
          // if it is a raw filter field, skip
          if (isKnexRawStatement(orderByObject.field)) return;

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
      rawSelect,
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
    sqlParams.distinctOn = orderBy.reduce((total, ele) => {
      total.push(ele.field);
      return total;
    }, <(string | Knex.Raw)[]>[]);

    const results = await getObjectType({
      typename: this.service.typename,
      additionalSelect,
      req,
      fieldPath,
      externalQuery: query,
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

    // this helper function processes the args.filterBy, args.search, and args.distance
    this.processArgs(args, whereObject);

    const resultsCount = await countObjectType(
      this.service.typename,
      fieldPath,
      [whereObject],
      true
    );

    return resultsCount;
  }

  processArgs(
    args: any,
    whereObject: SqlWhereObject,
    rawSelect?: SqlSimpleRawSelectObject[]
  ) {
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
              ([operationKey, operationValue]: [string, any]) => {
                filterByAndObject.fields.push({
                  field: generateSqlSingleFieldObject(
                    this.service.filterFieldsMap[filterKey].field ?? filterKey
                  ),
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
        const fieldPath = this.service.searchFieldsMap[field].field ?? field;

        // if there is a custom handler on the options, use that
        const customProcessor =
          this.service.searchFieldsMap[field].customProcessor;
        if (customProcessor) {
          customProcessor(
            whereSubObject,
            args.search,
            this.service.searchFieldsMap[field],
            fieldPath
          );
        } else {
          // if field options has exact, ony allow eq
          if (this.service.searchFieldsMap[field].exact) {
            whereSubObject.fields.push({
              field: fieldPath,
              value: args.search.query,
              operator: "eq",
            });
          } else {
            whereSubObject.fields.push({
              field: fieldPath,
              value: new RegExp(escapeRegExp(args.search.query), "i"),
              operator: "regex",
            });
          }
        }
      }

      whereObject.fields.push(whereSubObject);
    }

    // handle distance fields
    if (args.distance) {
      const whereSubObject: SqlWhereObject = {
        connective: "AND",
        fields: [],
      };

      Object.entries(args.distance).forEach(([key, val]) => {
        const latitudeField = this.service.distanceFieldsMap[key].latitude;
        const longitudeField = this.service.distanceFieldsMap[key].longitude;

        const latitude = (val as any).from.latitude;
        const longitude = (val as any).from.longitude;

        const ltDistance = (val as any).lt;
        const gtDistance = (val as any).gt;

        if (ltDistance === undefined && gtDistance === undefined) {
          throw new Error(
            `At least one of lt or gt required for distance operations`
          );
        }

        if (ltDistance !== undefined) {
          whereSubObject.fields.push({
            statement: `earth_box(ll_to_earth (${latitude}, ${longitude}), ${ltDistance}) @> ll_to_earth (${latitudeField}, ${longitudeField})`,
            fields: [latitudeField, longitudeField],
          });

          whereSubObject.fields.push({
            statement: `earth_distance(ll_to_earth (${latitude}, ${longitude}), ll_to_earth (${latitudeField}, ${longitudeField})) < ${ltDistance}`,
            fields: [latitudeField, longitudeField],
          });
        }

        // this approach does not appear to be indexed and may be slow
        if (gtDistance !== undefined) {
          whereSubObject.fields.push({
            statement: `earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(${latitudeField}, ${longitudeField})) > ${gtDistance}`,
            fields: [latitudeField, longitudeField],
          });
        }

        // if also sorting by this distance field, need to add it to the raw selects
        if (rawSelect) {
          if (
            args.sortBy &&
            args.sortBy.some((sortByObject) => sortByObject.field === key)
          ) {
            rawSelect.push({
              statement: knex.raw(
                `earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(${latitudeField}, ${longitudeField}))`
              ),
              as: key,
            });
          }
        }
      });

      whereObject.fields.push(whereSubObject);
    }
  }
}
