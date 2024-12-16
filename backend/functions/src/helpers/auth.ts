import { ApiKey, User } from "../schema/services";
import { auth } from "firebase-admin";
import { userRole } from "../schema/enums";
import {
  parsePermissions,
  userRoleToPermissionsMap,
} from "../schema/helpers/permissions";
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
    let user = await User.getFirstSqlRecord({
      select: ["id", "role", "permissions"],
      where: {
        firebaseUid: decodedToken.uid,
      },
    });

    // user not exists in db
    if (!user) {
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
      user = await User.getFirstSqlRecord({
        select: ["id", "role", "permissions"],
        where: {
          id: addUserResults.id,
        },
      });
    }

    const id = user.id;
    const role = userRole.fromUnknown(user.role);

    const userPermissions = (userRoleToPermissionsMap[role.name] ?? []).concat(
      parsePermissions(user.permissions)
    );

    const contextUser: ContextUser = {
      id,
      role,
      permissions: userPermissions,
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
    const apiKey = await ApiKey.getFirstSqlRecord(
      {
        select: ["user.id", "user.role", "user.permissions", "permissions"],
        where: {
          code,
        },
      },
      true
    );

    const role = userRole.fromUnknown(apiKey["user.role"]);

    // calculate the user's permissions
    const userPermissions = (userRoleToPermissionsMap[role.name] ?? []).concat(
      parsePermissions(apiKey["user.permissions"])
    );

    // calculate the permissions associated with the apiKey
    const apiKeyPermissions = parsePermissions(apiKey.permissions);

    return {
      id: apiKey["user.id"],
      role,
      // the api key's permissions is a subset of the apiKey.permissions
      permissions: apiKeyPermissions
        ? userPermissions.filter((ele) => apiKeyPermissions.includes(ele))
        : userPermissions,
      isApiKey: true,
    };
  } catch (err: unknown) {
    throw new AuthenticationError({
      message: err instanceof Error ? err.message : undefined,
    });
  }
}
