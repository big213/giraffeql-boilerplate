import { userPermission, userRole } from "../enums";

export const userRoleToPermissionsMap = {
  [userRole.ADMIN.name]: [userPermission["*/*"]],
  [userRole.NORMAL.name]: [],
};
