import { UserUserFollowLink, User } from "../../services";
import { GiraffeqlObjectType } from "giraffeql";
import { generateLinkTypeDef } from "../../core/generators";

export default new GiraffeqlObjectType(
  generateLinkTypeDef(
    {
      user: {
        service: User,
        allowNull: false,
      },
      target: {
        service: User,
        allowNull: false,
      },
    },
    UserUserFollowLink,
    {}
  )
);
