import { userRoleKenum } from "../../../src/schema/enums";
import { User } from "../../../src/schema/services";

// gets the first admin user ID
export async function getAdminUserId() {
  const adminUsers = await User.getAllSqlRecord({
    select: ["id"],
    where: {
      role: userRoleKenum.ADMIN.parsed,
    },
    orderBy: [
      {
        field: "createdAt",
        desc: false,
      },
    ],
  });

  if (!adminUsers[0]) {
    throw new Error(`No valid admin users`);
  }

  return adminUsers[0].id;
}

export function convertCSVToJSON(text: string) {
  let p = "";
  let l;
  let row = [""];
  const ret = [row];
  let i = 0;
  let r = 0;
  let s = !0;

  for (l of text) {
    if (l === '"') {
      if (s && l === p) row[i] += l;
      s = !s;
    } else if (l === "," && s) l = row[++i] = "";
    else if (l === "\n" && s) {
      if (p === "\r") row[i] = row[i].slice(0, -1);
      row = ret[++r] = [(l = "")];
      i = 0;
    } else row[i] += l;
    p = l;
  }
  const objArray: any[] = [];
  const headers = ret[0].map((ele) => ele.trim());
  for (let k = 1; k < ret.length; k++) {
    const o = {};
    let hasUndefined = false;
    let hasAllEmptyRows = true;
    for (let j = 0; j < headers.length; j++) {
      const value =
        typeof ret[k][j] === "string" ? ret[k][j].trim() : ret[k][j];
      o[headers[j]] = value;
      if (value === undefined) hasUndefined = true;
      else if (value !== "") hasAllEmptyRows = false;
    }
    // not pushing rows where at least one column is undefined
    // also not pushing rows where all rows are empty
    if (!hasUndefined && !hasAllEmptyRows) objArray.push(o);
  }

  return objArray;
}
