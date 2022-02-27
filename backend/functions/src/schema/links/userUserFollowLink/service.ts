import { LinkService } from "../../core/services";
import { AccessControlMap } from "../../../types";
import { isCurrentUser, isUserLoggedIn } from "../../helpers/permissions";

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
    get: async ({ req, args, fieldPath }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["user.id"],
          where: args,
        },
        fieldPath
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
    delete: async ({ req, args, fieldPath }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["user.id"],
          where: args,
        },
        fieldPath
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
    create: async ({ req, args, fieldPath }) => {
      // handle lookupArgs, convert lookups into ids
      await this.handleLookupArgs(args, fieldPath);

      if (isCurrentUser(req, args.user)) return true;

      return false;
    },
  };
}
