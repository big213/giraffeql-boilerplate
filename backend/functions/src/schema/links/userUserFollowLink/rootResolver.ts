import { UserUserFollowLink } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import { ValidatorGenerators } from "../../core/helpers/validator";

export default {
  ...generateBaseRootResolvers({
    service: UserUserFollowLink,
    methods: [
      {
        type: "get",
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          UserUserFollowLink,
          "user.id"
        ),
      },
      { type: "getPaginator" },
      {
        type: "create",
        validator: ValidatorGenerators.allowIfArgsFieldIsCurrentUser("user"),
      },
      { type: "update" },
      {
        type: "delete",
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          UserUserFollowLink,
          "user.id"
        ),
      },
    ],
  }),
};
