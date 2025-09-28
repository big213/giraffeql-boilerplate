import * as enums from "./enums";
import { EnumService } from "./core/services";

import { UserService } from "./models/user/service";
import { ApiKeyService } from "./models/apiKey/service";
import { FileService } from "./models/file/service";
import { AdminService } from "./models/admin/service";
/** END Service Import */

import { UserUserFollowLinkService } from "./links/userUserFollowLink/service";
/** END LINK Service Import */

export const User = new UserService();
export const ApiKey = new ApiKeyService();
export const File = new FileService();
export const Admin = new AdminService();
/** END Service Set */

export const UserUserFollowLink = new UserUserFollowLinkService();
/** END LINK Service Set */

export const UserRole = new EnumService(enums.userRoleKenum);
export const UserPermission = new EnumService(enums.userPermissionEnum);
export const ActionType = new EnumService(enums.actionTypeKenum);
/** END ENUM Service Set */
