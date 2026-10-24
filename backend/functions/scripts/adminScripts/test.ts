import { pgDatabase } from "../../lib/config";
import { getAdminUserId } from "./helpers";

(async function () {
  console.log(pgDatabase.value());
})();
