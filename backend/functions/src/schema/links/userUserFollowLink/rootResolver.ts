import { UserUserFollowLink } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import { Validators } from "../../helpers/validator";

export default {
  ...generateBaseRootResolvers({
    service: UserUserFollowLink,
    methods: [
      {
        type: "get",
        validator: Validators.allowIfRecordFieldIsCurrentUser(
          UserUserFollowLink,
          "user.id"
        ),
      },
      { type: "getPaginator" },
      {
        type: "create",
        validator: Validators.allowIfArgsFieldIsCurrentUser("user"),
      },
      { type: "update" },
      {
        type: "delete",
        validator: Validators.allowIfRecordFieldIsCurrentUser(
          UserUserFollowLink,
          "user.id"
        ),
      },
    ],
  }),
};
