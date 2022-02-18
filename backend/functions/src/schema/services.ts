import { userRoleKenum } from "./enums";
import { KenumService } from "./core/services";

import { UserService } from "./models/user/service";
import { ApiKeyService } from "./models/apiKey/service";
import { GithubService } from "./models/github/service";
import { FileService } from "./models/file/service";
import { AdminService } from "./models/admin/service";
/** END Service Import */

/** END LINK Service Import */

export const User = new UserService();
export const ApiKey = new ApiKeyService();
export const File = new FileService();
export const Github = new GithubService();
export const Admin = new AdminService();
/** END Service Set */

/** END LINK Service Set */

export const UserRole = new KenumService("userRole", userRoleKenum);
