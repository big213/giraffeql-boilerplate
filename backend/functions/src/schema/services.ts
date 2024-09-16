import { userPermission, userRole } from "./enums";
import { EnumService, KenumService } from "./core/services";

import { UserService } from "./models/user/service";
import { ApiKeyService } from "./models/apiKey/service";
import { GithubService } from "./models/github/service";
import { FileService } from "./models/file/service";
import { AdminService } from "./models/admin/service";
/** END Service Import */

import { UserUserFollowLinkService } from "./links/userUserFollowLink/service";
/** END LINK Service Import */

export const User = new UserService();
export const ApiKey = new ApiKeyService();
export const File = new FileService();
export const Github = new GithubService();
export const Admin = new AdminService();
/** END Service Set */

export const UserUserFollowLink = new UserUserFollowLinkService();
/** END LINK Service Set */

export const UserRole = new KenumService(userRole);
export const UserPermission = new EnumService(userPermission);
