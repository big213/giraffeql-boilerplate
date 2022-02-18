import { executeGiraffeql } from '~/services/giraffeql'
import { collectPaginatorData } from '~/services/base'

function memoize(memoizedFn) {
  const cache = {}

  return function () {
    // first arg is always gonna be that, so we will exclude it
    const [that, forceReload, ...otherArgs] = arguments
    const args = JSON.stringify(otherArgs)
    cache[args] = forceReload
      ? memoizedFn(that, false, ...otherArgs)
      : cache[args] || memoizedFn(that, false, ...otherArgs)
    return cache[args]
  }
}

export const getCurrentUser = function (that) {
  const user = that.$store.getters['auth/user']

  return Promise.resolve(
    user
      ? [
          {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
        ]
      : []
  )
}

export const getUsers = <any>(
  memoize(function (that, _forceReload = false, filterBy = []) {
    return collectPaginatorData(
      that,
      'getUserPaginator',
      {
        id: true,
        name: true,
        avatar: true,
      },
      {
        filterBy,
      }
    )
  })
)

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
