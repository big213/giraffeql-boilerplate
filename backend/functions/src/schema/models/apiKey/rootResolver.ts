import {
  generateBaseRootResolvers,
  generateCreateRootResolver,
} from "../../core/helpers/rootResolver";
import { ValidatorGenerators } from "../../core/helpers/validator";
import { ApiKey } from "../../services";
import { generateId } from "../../core/helpers/shared";

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
