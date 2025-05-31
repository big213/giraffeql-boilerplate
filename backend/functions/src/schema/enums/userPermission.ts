import { Enum } from "../core/helpers/enum";

export class userPermission extends Enum {
  // * allows global access
  static readonly "*/*" = new userPermission("*/*");

  // entity/* allows access to any permission starting with entity/
  static readonly "user/*" = new userPermission("user/*");

  static readonly "user/get" = new userPermission("user/get");
  static readonly "user/getPaginator" = new userPermission("user/getPaginator");
  static readonly "user/update" = new userPermission("user/update");
  static readonly "user/create" = new userPermission("user/create");
  static readonly "user/delete" = new userPermission("user/delete");

  static readonly "file/getPaginator" = new userPermission("file/getPaginator");

  // other permissions should *not* contain "/"
}
