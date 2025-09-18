import { ServiceFunctionInputs } from "../../../types";
import { PaginatedService } from "../../core/services";

export class UserService extends PaginatedService {
  defaultTypename = "user";

  filterFieldsMap = {
    id: {},
    "createdBy.name": {},
    isPublic: {},
    role: {},
  };

  uniqueKeyMap = {
    primary: ["id"],
    email: ["email"],
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
    email: {},
  };

  async getSpecialParams({ req }: ServiceFunctionInputs) {
    return {
      currentUserId: req.user?.id ?? null,
    };
  }
}
