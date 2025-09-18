import { nanoid } from "nanoid";
import {
  generateBaseRootResolvers,
  generateCreateRootResolver,
} from "../../core/helpers/rootResolver";
import { ValidatorGenerators } from "../../core/helpers/validator";
import { ApiKey } from "../../services";

export default {
  ...generateBaseRootResolvers({
    service: ApiKey,
    methods: [
      {
        type: "get",
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          ApiKey,
          "user.id"
        ),
      },
      {
        type: "getPaginator",
        validator: ValidatorGenerators.allowIfFilteringByCurrentUser("user.id"),
      },
      {
        type: "create",
        validator: ValidatorGenerators.allowIfArgsFieldIsCurrentUser("user"),
        resolver: generateCreateRootResolver({
          service: ApiKey,
          options: {
            getCreateFields({ inputs, transaction }) {
              return {
                code: nanoid(),
              };
            },
          },
        }),
      },
      {
        type: "update",
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          ApiKey,
          "user.id",
          "item"
        ),
      },
      {
        type: "delete",
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          ApiKey,
          "user.id"
        ),
      },
    ],
  }),
};
