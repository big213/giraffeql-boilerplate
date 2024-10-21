import {
  generateMemoizedEnumGetter,
  generateMemoizedGetter,
} from '~/services/base'

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

export const getUsers = generateMemoizedGetter('getUserPaginator', [
  'id',
  'name',
  'avatarUrl',
  '__typename',
])

/** START Enum Getters */
export const getUserRoleEnumValues = generateMemoizedEnumGetter(
  'getUserRoleEnumPaginator'
)
export const getUserPermissionEnumValues = generateMemoizedEnumGetter(
  'getUserPermissionEnumPaginator'
)
/** END Enum Getters */
