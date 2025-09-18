import { PaginatedService } from "../../core/services";

export class ApiKeyService extends PaginatedService {
  defaultTypename = "apiKey";

  filterFieldsMap = {
    id: {},
    "user.id": {},
  };

  uniqueKeyMap = {
    primary: ["id"],
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  groupByFieldsMap = {};
}
