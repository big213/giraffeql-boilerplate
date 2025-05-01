import { userRole } from "../../../src/schema/enums";
import { User } from "../../../src/schema/services";

// gets the first admin user ID
export async function getAdminUserId() {
  const adminUsers = await User.getAllSqlRecord({
    select: ["id"],
    where: {
      role: userRole.ADMIN.parsed,
    },
    orderBy: [
      {
        field: "createdAt",
        desc: false,
      },
    ],
  });

  if (!adminUsers[0]) {
    throw new Error(`No valid admin users`);
  }

  return adminUsers[0].id;
}
