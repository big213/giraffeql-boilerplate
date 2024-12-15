import { ApiKey, User } from "../schema/services";
import { auth } from "firebase-admin";
import { userRole, userPermission } from "../schema/enums";
import { userRoleToPermissionsMap } from "../schema/helpers/permissions";
import type { ContextUser } from "../types";
import { AuthenticationError } from "../schema/core/helpers/error";
import { timeout } from "../schema/core/helpers/shared";

export async function validateToken(bearerToken: string): Promise<ContextUser> {
  try {
    if (!bearerToken.match(/^Bearer\s/)) {
      throw new Error("Invalid bearer token");
    }

    const token = bearerToken.split(" ")[1];

    // const decoded: string = await jwt.verify(token, env.general.jwt_secret);
    const decodedToken = await auth().verifyIdToken(token);

    // check if firebase_uid exists
    // fetch role from database
    let userRecord = await User.getFirstSqlRecord({
      select: ["id", "role", "permissions"],
      where: {
        firebaseUid: decodedToken.uid,
      },
    });

    const permissions: userPermission[] = [];

    // user not exists in db
    if (!userRecord) {
      // user not exists, must create

      // get the displayName, photoURL from firebase
      let firebaseUserRecord = await auth().getUser(decodedToken.uid);

      // if firebaseUserRecord.displayName is undefined, try waiting 1 second and then trying again
      if (firebaseUserRecord.displayName === undefined) {
        await timeout(1000);
        firebaseUserRecord = await auth().getUser(decodedToken.uid);
      }

      const addUserResults = await User.createSqlRecord({
        fields: {
          // if after 2 tries it is still null, just fall back to empty str
          name: firebaseUserRecord.displayName ?? "",
          avatarUrl: firebaseUserRecord.photoURL,
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          createdBy: 0,
        },
      });

      // set createdBy to id
      await User.updateSqlRecord({
        fields: {
          createdBy: addUserResults.id,
        },
        where: {
          id: addUserResults.id,
        },
      });

      // fetch the user
      userRecord = await User.getFirstSqlRecord({
        select: ["id", "role", "permissions"],
        where: {
          id: addUserResults.id,
        },
      });
    }

    const id = userRecord.id;
    const role = userRole.fromUnknown(userRecord.role);

    if (userRoleToPermissionsMap[role.name]) {
      permissions.push(...userRoleToPermissionsMap[role.name]);
    }

    // if any extra permissions, also add those
    let parsedPermissions = userRecord.permissions
      ? userRecord.permissions
      : [];

    // convert permissions to enums
    parsedPermissions = parsedPermissions.map((ele) =>
      userPermission.fromName(ele)
    );
    permissions.push(...parsedPermissions);

    const contextUser: ContextUser = {
      id,
      role,
      permissions,
      isApiKey: false,
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
    const apiKey = await ApiKey.getFirstSqlRecord(
      {
        select: ["createdBy.id", "createdBy.role", "createdBy.permissions"],
        where: {
          code,
        },
      },
      true
    );

    let parsedPermissions = apiKey["createdBy.permissions"] ?? [];

    // convert permissions to enums
    parsedPermissions = parsedPermissions.map((ele) =>
      userPermission.fromName(ele)
    );

    const role = userRole.fromUnknown(apiKey["createdBy.role"]);

    return {
      id: apiKey["createdBy.id"],
      role,
      permissions: (userRoleToPermissionsMap[role.name] ?? []).concat(
        parsedPermissions
      ),
      isApiKey: true,
    };
  } catch (err: unknown) {
    throw new AuthenticationError({
      message: err instanceof Error ? err.message : undefined,
    });
  }
}
