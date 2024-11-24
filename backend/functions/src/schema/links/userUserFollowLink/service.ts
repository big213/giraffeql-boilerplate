import { LinkService } from "../../core/services";
import { AccessControlMap } from "../../../types";
import {
  allowIfArgsFieldIsCurrentUserFn,
  allowIfRecordFieldIsCurrentUserFn,
} from "../../helpers/permissions";

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
    - args.user is currentUser
    */

    create: allowIfArgsFieldIsCurrentUserFn("user"),

    /*
    Allow if:
    - user.id is currentUser
    */
    get: allowIfRecordFieldIsCurrentUserFn(this, "user.id"),

    // getPaginator not allowed

    // update not allowed

    /*
    Allow if:
    - user.id is currentUser
    */
    delete: allowIfRecordFieldIsCurrentUserFn(this, "user.id"),
  };
}
