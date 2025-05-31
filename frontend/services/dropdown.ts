import {
  generateMemoizedEntityGetter,
  generateMemoizedEnumGetter,
  memoize,
} from '~/services/base'
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

export const getCurrentUserAllPermissions = (that) =>
  Promise.resolve(that.$store.getters['auth/user']?.allPermissions ?? [])

/** START Entity Getters */
export const getUserOptions = generateMemoizedEntityGetter(UserEntity)
/** END Entity Getters */

/** START Enum Getters */
export const getUserRoleEnumValues = generateMemoizedEnumGetter(
  'getUserRoleEnumPaginator'
)
export const getUserPermissionEnumValues = generateMemoizedEnumGetter(
  'getUserPermissionEnumPaginator'
)
/** END Enum Getters */
