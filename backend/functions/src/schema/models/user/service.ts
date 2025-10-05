import { ServiceFunctionInputs } from "../../../types";
import { PaginatedService } from "../../core/services";

export class UserService extends PaginatedService {
  defaultTypename = "user";

  filterFieldsMap = {
    "createdBy.name": {},
    isPublic: {},
    role: {},
  };

  uniqueKeyMap = {
    primary: ["id"],
    email: ["email"],
  };

  sortFieldsMap = {
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
