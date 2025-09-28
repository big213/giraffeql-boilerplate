import { Kenum } from "../core/helpers/enum";

export class userRoleKenum extends Kenum {
  static readonly NONE = new userRoleKenum("NONE", 1);
  static readonly NORMAL = new userRoleKenum("NORMAL", 2);
  static readonly ADMIN = new userRoleKenum("ADMIN", 3);
  static readonly CUSTOM = new userRoleKenum("CUSTOM", 4);
  static readonly MODERATOR = new userRoleKenum("MODERATOR", 5);
}
