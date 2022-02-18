import * as allServices from "./services";
import "./scalars"; // initialize scalars
export * as Scalars from "./scalars";

import user from "./models/user/typeDef";
import apiKey from "./models/apiKey/typeDef";
import file from "./models/file/typeDef";
/** END TypeDef Import */

/** END LINK TypeDef Import */

// add the objectTypeDefs for the services with objectTypeDefs
allServices.User.setTypeDef(user);
allServices.ApiKey.setTypeDef(apiKey);
allServices.File.setTypeDef(file);
/** END TypeDef Set */

/** END LINK TypeDef Set */

import User from "./models/user/rootResolver";
import ApiKey from "./models/apiKey/rootResolver";
import Github from "./models/github/rootResolver";
import File from "./models/file/rootResolver";
import Admin from "./models/admin/rootResolver";
/** END RootResolver Import */

/** END LINK RootResolver Import */

allServices.User.setRootResolvers(User);
allServices.ApiKey.setRootResolvers(ApiKey);
allServices.Github.setRootResolvers(Github);
allServices.File.setRootResolvers(File);
allServices.Admin.setRootResolvers(Admin);
/** END RootResolver Set */

/** END LINK RootResolver Set */
