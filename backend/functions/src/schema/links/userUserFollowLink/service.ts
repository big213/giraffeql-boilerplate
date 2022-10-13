import { LinkService } from "../../core/services";
import { AccessControlMap } from "../../../types";
import { isCurrentUser } from "../../helpers/permissions";

export class UserUserFollowLinkService extends LinkService {
  defaultTypename = "userUserFollowLink";

  filterFieldsMap = {};

  uniqueKeyMap = {
    primary: ["id"],
  };

  sortFieldsMap = {
    createdAt: {},
  };

  searchFieldsMap = {};

  groupByFieldsMap = {};

  accessControl: AccessControlMap = {
    /*
    Allow if:
    - user.id is currentUser
    */
    get: async ({ req, args }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["user.id"],
          where: args,
        },
        true
      );
      if (isCurrentUser(req, record["user.id"])) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - user.id is currentUser
    */
    delete: async ({ req, args }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["user.id"],
          where: args,
        },
        true
      );
      if (isCurrentUser(req, record["user.id"])) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - args.user is currentUser
    */
    create: async ({ req, args }) => {
      // handle lookupArgs, convert lookups into ids
      await this.handleLookupArgs(args);

      if (isCurrentUser(req, args.user)) return true;

      return false;
    },
  };
}
