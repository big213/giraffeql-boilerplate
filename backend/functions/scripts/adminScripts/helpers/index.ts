import { userRole } from "../../../src/schema/enums";
import { User } from "../../../src/schema/services";

// gets the first admin user ID
export async function getAdminUserId() {
  const adminUser = await User.getFirstSqlRecord(
    {
      select: ["id"],
      where: {
        role: userRole.ADMIN,
      },
      orderBy: [
        {
          field: "createdAt",
          desc: false,
        },
      ],
    },
    true
  );

  return adminUser.id;
}
