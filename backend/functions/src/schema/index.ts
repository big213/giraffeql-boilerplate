import * as allServices from "./services";
import "./scalars"; // initialize scalars
export * as Scalars from "./scalars";
import { BaseService } from "./core/services";

import user from "./models/user/typeDef";
import apiKey from "./models/apiKey/typeDef";
import file from "./models/file/typeDef";
/** END TypeDef Import */

import userUserFollowLink from "./links/userUserFollowLink/typeDef"
/** END LINK TypeDef Import */

// add the objectTypeDefs for the services with objectTypeDefs
allServices.User.setTypeDef(user);
allServices.ApiKey.setTypeDef(apiKey);
allServices.File.setTypeDef(file);
/** END TypeDef Set */

allServices.UserUserFollowLink.setTypeDef(userUserFollowLink)
/** END LINK TypeDef Set */

import User from "./models/user/rootResolver";
import ApiKey from "./models/apiKey/rootResolver";
import Github from "./models/github/rootResolver";
import File from "./models/file/rootResolver";
import Admin from "./models/admin/rootResolver";
/** END RootResolver Import */

import UserUserFollowLink from "./links/userUserFollowLink/rootResolver"
/** END LINK RootResolver Import */

allServices.User.setRootResolvers(User);
allServices.ApiKey.setRootResolvers(ApiKey);
allServices.Github.setRootResolvers(Github);
allServices.File.setRootResolvers(File);
allServices.Admin.setRootResolvers(Admin);
/** END RootResolver Set */

allServices.UserUserFollowLink.setRootResolvers(UserUserFollowLink);
/** END LINK RootResolver Set */

// build and export services map
export const servicesMap: Map<string, BaseService> = new Map();

for (const prop in allServices) {
  servicesMap.set(allServices[prop].typename, allServices[prop]);
}
