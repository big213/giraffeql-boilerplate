import { ServiceFunctionInputs } from "../../../types";
import { linkDefs } from "../../links";
import { permissionsCheck } from "../helpers/permissions";
import { createObjectType } from "../helpers/resolver";
import { camelToSnake } from "../helpers/shared";
import { ServicesObjectMap } from "../helpers/typeDef";
import { PaginatedService } from "./paginated";

export class LinkService extends PaginatedService {
  // must be set via generateLinkTypeDef
  servicesObjectMap!: ServicesObjectMap;

  constructor(name?: string) {
    super(name);

    // register linkDef
    linkDefs.set(this.typename, this);
  }

  @permissionsCheck("create")
  async createRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    await this.handleLookupArgs(args);

    const fields = Object.keys(this.servicesObjectMap);

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        // only add the id field if the id field is a string (not auto-increment)
        ...(!this.primaryKeyAutoIncrement && {
          id: await this.generateRecordId(),
        }),
        ...args,
        createdBy: req.user!.id,
      },
      extendFn: (knexObject) => {
        knexObject
          .onConflict(fields.map((field) => camelToSnake(field)))
          .ignore();
      },
      req,
      fieldPath,
    });

    // if addResults falsey, there was a conflict
    if (!addResults) {
      throw new Error(
        `An entry with this ${fields.join("-")} combination already exists`
      );
    }

    // do post-create fn, if any
    await this.afterCreateProcess(
      {
        req,
        fieldPath,
        args,
        query,
        data,
        isAdmin,
      },
      addResults.id
    );

    return this.getRecord({
      req,
      args: { id: addResults.id },
      query,
      fieldPath,
      isAdmin,
      data,
    });
  }
}
