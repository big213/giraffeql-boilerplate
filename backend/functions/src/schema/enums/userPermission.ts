import { Enum } from "../core/helpers/enum";

export class userPermissionEnum extends Enum {
  // * allows global access
  static readonly "*/*" = new userPermissionEnum("*/*");

  // entity/* allows access to any permission starting with entity/
  static readonly "user/*" = new userPermissionEnum("user/*");

  static readonly "user/get" = new userPermissionEnum("user/get");
  static readonly "user/getPaginator" = new userPermissionEnum(
    "user/getPaginator"
  );
  static readonly "user/update" = new userPermissionEnum("user/update");
  static readonly "user/create" = new userPermissionEnum("user/create");
  static readonly "user/delete" = new userPermissionEnum("user/delete");

  static readonly "file/getPaginator" = new userPermissionEnum(
    "file/getPaginator"
  );

  // other permissions should *not* contain "/"
}
