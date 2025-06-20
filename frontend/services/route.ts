import type { ViewDefinition } from '~/types/view'
import { routeTypesMap } from '../config'
import { camelToKebabCase } from './base'

export type RouteObject = { routeKey: string; routeType: string }

export function generateNavRouteObject(
  that,
  {
    viewDefinition,
    pageOptions,
    title,
    exactUrl,
  }: {
    viewDefinition: ViewDefinition
    pageOptions?: any
    title?: string
    exactUrl?: boolean
  }
) {
  return {
    icon: viewDefinition.entity.icon,
    title: title ?? viewDefinition.title ?? viewDefinition.entity.pluralName,
    to: generateCrudRecordRoute(that, {
      viewDefinition,
      pageOptions:
        pageOptions === null
          ? null
          : {
              search: '',
              filters: [],
              sort: 'updatedAt-desc',
              ...pageOptions,
            },
    }),
    exactUrl,
  }
}

export function generateCrudRecordRoute(
  that,
  {
    viewDefinition,
    routeObject,
    queryParams,
    pageOptions,
  }: {
    viewDefinition?: ViewDefinition
    routeObject?: RouteObject
    queryParams?: any
    pageOptions?: any
  }
) {
  // either viewDefinition or routeObject required
  if (!viewDefinition && !routeObject) {
    throw new Error('One of viewDefinition or routeObject required')
  }

  const routeType = viewDefinition
    ? viewDefinition.routeType
    : routeObject!.routeType

  const routeKey = viewDefinition
    ? viewDefinition.routeKey
    : routeObject!.routeKey

  // ensure that routeType exists in the map, and then map it to routePath
  const { routePath } = routeTypesMap[routeType]

  if (!routePath) {
    throw new Error(`routeType not found in map: ${routeType}`)
  }

  return that.$router.resolve({
    path: `/${routePath!}/${camelToKebabCase(routeKey!)}`,
    query: {
      ...queryParams,
      ...(pageOptions && {
        o: encodeURIComponent(btoa(JSON.stringify(pageOptions))),
      }),
    },
  }).href
}

// either path or routeKey/routeType required
export function generateViewRecordRoute(
  that,
  {
    viewDefinition,
    routeObject,
    queryParams,
    id,
    expandKey,
    miniMode,
    showComments = false,
  }: {
    viewDefinition?: ViewDefinition
    routeObject?: RouteObject
    queryParams?: any
    id?: string
    expandKey?: string | null
    miniMode?: boolean
    showComments?: boolean
  }
) {
  // either viewDefinition or routeObject required
  if (!viewDefinition && !routeObject) {
    throw new Error('One of viewDefinition or routeObject required')
  }

  const routeType = viewDefinition
    ? viewDefinition.routeType
    : routeObject!.routeType

  const routeKey = viewDefinition
    ? viewDefinition.routeKey
    : routeObject!.routeKey

  // ensure that routeType exists in the map, and then map it to routePath
  const { routePath } = routeTypesMap[routeType]

  if (!routePath) {
    throw new Error(`routeType not found in map: ${routeType}`)
  }

  return that.$router.resolve({
    path: `/${routePath}/view/${camelToKebabCase(routeKey)}`,
    query: {
      id,
      e: expandKey,
      c: showComments ? null : undefined,
      m: miniMode ? '1' : undefined,
      ...queryParams,
    },
  }).href
}
