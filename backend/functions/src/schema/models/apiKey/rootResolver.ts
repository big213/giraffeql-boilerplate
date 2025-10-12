import {
  generateBaseRootResolvers,
  generateCreateRootResolver,
} from "../../core/helpers/rootResolver";
import { Validators } from "../../helpers/validator";
import { ApiKey } from "../../services";
import { generateId } from "../../core/helpers/shared";

export default {
  ...generateBaseRootResolvers({
    service: ApiKey,
    methods: [
      {
        type: "get",
        validator: Validators.allowIfRecordFieldIsCurrentUser(
          ApiKey,
          "user.id"
        ),
      },
      {
        type: "getPaginator",
        validator: Validators.allowIfFilteringByCurrentUser("user.id"),
      },
      {
        type: "create",
        validator: Validators.allowIfArgsFieldIsCurrentUser("user"),
        resolver: generateCreateRootResolver({
          service: ApiKey,
          options: {
            async getCreateFields({ inputs: { processedArgs }, transaction }) {
              return {
                ...processedArgs,
                code: await generateId(21),
              };
            },
          },
        }),
      },
      {
        type: "update",
        validator: Validators.allowIfRecordFieldIsCurrentUser(
          ApiKey,
          "user.id",
          "item"
        ),
      },
      {
        type: "delete",
        validator: Validators.allowIfRecordFieldIsCurrentUser(
          ApiKey,
          "user.id"
        ),
      },
    ],
  }),
};
