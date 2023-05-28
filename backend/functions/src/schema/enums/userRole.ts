import { Kenum } from "../core/helpers/enum";

export class userRole extends Kenum {
  static readonly NONE = new userRole("NONE", 1);
  static readonly NORMAL = new userRole("NORMAL", 2);
  static readonly ADMIN = new userRole("ADMIN", 3);
  static readonly CUSTOM = new userRole("CUSTOM", 4);
  static readonly MODERATOR = new userRole("MODERATOR", 5);
}
