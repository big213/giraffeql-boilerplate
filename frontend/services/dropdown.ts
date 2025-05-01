import {
  generateMemoizedEntityGetter,
  generateMemoizedEnumGetter,
  memoize,
} from '~/services/base'
import { executeApiRequest } from './api'
import { UserEntity } from '~/models/entities'

export const getCurrentUser = function (that) {
  const user = that.$store.getters['auth/user']

  return Promise.resolve(
    user
      ? [
          {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
          },
        ]
      : []
  )
}

export async function getCurrentUserAvailablePermissions(that) {
  const data = await executeApiRequest({
    getCurrentUserAvailablePermissions: true,
  })

  return data
}

export const getUsers = generateMemoizedEntityGetter(UserEntity)

/** START Enum Getters */
export const getUserRoleEnumValues = generateMemoizedEnumGetter(
  'getUserRoleEnumPaginator'
)
export const getUserPermissionEnumValues = generateMemoizedEnumGetter(
  'getUserPermissionEnumPaginator'
)
/** END Enum Getters */
