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

function generateMemoizedGetter(operation: string, fields: string[]) {
  return <any>(
    memoize(function (
      that,
      _forceReload,
      filterBy: any[] = [],
      sortBy: any[] = []
    ) {
      return collectPaginatorData(
        that,
        operation,
        fields.reduce((total, field) => {
          total[field] = true
          return total
        }, {}),
        {
          filterBy,
          sortBy,
        }
      )
    })
  )
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

export const getUsers = generateMemoizedGetter('getUserPaginator', [
  'id',
  'name',
  'avatar',
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
