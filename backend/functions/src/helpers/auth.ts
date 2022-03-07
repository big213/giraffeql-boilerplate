import { ApiKey, User } from "../schema/services";
import * as admin from "firebase-admin";
import { userRoleKenum, userPermissionEnum } from "../schema/enums";
import { userRoleToPermissionsMap } from "../schema/helpers/permissions";
import type { ContextUser } from "../types";
import { AuthenticationError } from "../schema/core/helpers/error";

export async function validateToken(bearerToken: string): Promise<ContextUser> {
  try {
    if (bearerToken.split(" ")[0] !== "Bearer") {
      throw new Error("Invalid bearer token");
    }

    const token = bearerToken.split(" ")[1];

    // const decoded: string = await jwt.verify(token, env.general.jwt_secret);
    const decodedToken = await admin.auth().verifyIdToken(token);

    // check if firebase_uid exists
    // fetch role from database
    let userRecord = await User.getFirstSqlRecord(
      {
        select: ["id", "role", "permissions"],
        where: {
          firebaseUid: decodedToken.uid,
        },
      },
      undefined,
      false
    );

    const permissions: userPermissionEnum[] = [];

    // user not exists in db
    if (!userRecord) {
      // user not exists, must create

      // get the displayName, photoURL from firebase
      const firebaseUserRecord = await admin.auth().getUser(decodedToken.uid);

      const addUserResults = await User.createSqlRecord({
        fields: {
          name: firebaseUserRecord.displayName,
          avatar: firebaseUserRecord.photoURL,
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          createdBy: 0,
        },
      });

      // set createdBy to id
      await User.updateSqlRecord({
        fields: {
          createdBy: addUserResults[0].id,
        },
        where: {
          id: addUserResults[0].id,
        },
      });

      // fetch the user
      userRecord = await User.getFirstSqlRecord({
        select: ["id", "role", "permissions"],
        where: {
          id: addUserResults[0].id,
        },
      });
    }

    const id = userRecord.id;
    const role = userRoleKenum.fromUnknown(userRecord.role);

    if (userRoleToPermissionsMap[role.name]) {
      permissions.push(...userRoleToPermissionsMap[role.name]);
    }

    // if any extra permissions, also add those
    let parsedPermissions = userRecord.permissions
      ? userRecord.permissions
      : [];

    // convert permissions to enums
    parsedPermissions = parsedPermissions.map((ele) =>
      userPermissionEnum.fromName(ele)
    );
    permissions.push(...parsedPermissions);

    const contextUser: ContextUser = {
      id,
      role,
      permissions,
    };

    return contextUser;
  } catch (err) {
    throw new AuthenticationError({
      message: err instanceof Error ? err.message : undefined,
    });
  }
}

export async function validateApiKey(code: string): Promise<ContextUser> {
  try {
    // lookup user by API key
    const apiKey = await ApiKey.getFirstSqlRecord({
      select: ["createdBy.id", "createdBy.role", "createdBy.permissions"],
      where: {
        code,
      },
    });

    let parsedPermissions = apiKey["createdBy.permissions"] ?? [];

    // convert permissions to enums
    parsedPermissions = parsedPermissions.map((ele) =>
      userPermissionEnum.fromName(ele)
    );

    const role = userRoleKenum.fromUnknown(apiKey["createdBy.role"]);

    return {
      id: apiKey["createdBy.id"],
      role,
      permissions: (userRoleToPermissionsMap[role.name] ?? []).concat(
        parsedPermissions
      ),
    };
  } catch (err: unknown) {
    throw new AuthenticationError({
      message: err instanceof Error ? err.message : undefined,
    });
  }
}
