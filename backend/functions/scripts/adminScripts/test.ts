import { getAdminUserId } from "./helpers";

(async function () {
  const adminUserId = await getAdminUserId();

  console.log(adminUserId);
})();
