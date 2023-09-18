import { executeGiraffeql } from '~/services/giraffeql'
import { generateMemoizedGetter, memoize } from '~/services/base'

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

export const getUserRoles = memoize(async function (
  that,
  _forceReload = false
) {
  const data = await executeGiraffeql<'getUserRoleEnumPaginator'>(that, {
    getUserRoleEnumPaginator: {
      values: true,
    },
  })

  return data.values
})
