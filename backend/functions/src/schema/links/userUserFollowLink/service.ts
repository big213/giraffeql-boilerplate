import { LinkService } from "../../core/services";

export class UserUserFollowLinkService extends LinkService {
  defaultTypename = "userUserFollowLink";

  filterFieldsMap = {};

  uniqueKeyMap = {
    primary: ["id"],
  };

  sortFieldsMap = {
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {};

  groupByFieldsMap = {};
}
