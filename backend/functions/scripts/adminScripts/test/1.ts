import { User } from "../../../src/schema/services";
import { getAdminUserId } from "../helpers";

(async function () {
  // const adminUserId = await getAdminUserId();

  await User.updateSqlRecord({
    fields: {
      avatar: null,
    },
    where: true,
  });

  // console.log(adminUserId);
})();
