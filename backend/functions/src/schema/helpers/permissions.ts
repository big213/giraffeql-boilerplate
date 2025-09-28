import { userPermissionEnum, userRoleKenum } from "../enums";

export const userRoleToPermissionsMap = {
  [userRoleKenum.ADMIN.name]: [userPermissionEnum["*/*"]],
  [userRoleKenum.NORMAL.name]: [],
};
