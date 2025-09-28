import { PaginatedService } from "../../core/services";

export class ApiKeyService extends PaginatedService {
  defaultTypename = "apiKey";

  filterFieldsMap = {
    "user.id": {},
  };

  uniqueKeyMap = {
    primary: ["id"],
  };

  sortFieldsMap = {
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  groupByFieldsMap = {};
}
