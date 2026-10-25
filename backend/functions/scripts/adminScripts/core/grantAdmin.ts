import { userRoleKenum } from "../../../src/schema/enums";
import { User } from "../../../src/schema/services";

(async function () {
  const email = "";

  const user = await User.getFirstSqlRecord(
    {
      select: ["id"],
      where: {
        email,
      },
    },
    true
  );

  await User.updateSqlRecord({
    fields: {
      role: userRoleKenum.ADMIN,
    },
    where: {
      id: user.id,
    },
  });

  console.log(`Done granting ADMIN role to '${email}'`);
})();
