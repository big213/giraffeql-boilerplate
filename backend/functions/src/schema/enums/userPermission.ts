import { Enum } from "../core/helpers/enum";

export class userPermission extends Enum {
  static readonly A_A = new userPermission("A_A");
  static readonly user_x = new userPermission("user_x");
  static readonly user_get = new userPermission("user_get");
  static readonly user_getMultiple = new userPermission("user_getMultiple");
  static readonly user_update = new userPermission("user_update");
  static readonly user_create = new userPermission("user_create");
  static readonly user_delete = new userPermission("user_delete");

  static readonly file_getMultiple = new userPermission("file_getMultiple");
}
