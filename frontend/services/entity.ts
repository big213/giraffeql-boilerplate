import * as entities from '~/models/entities'
import { capitalizeString } from './base'

export function getIcon(typename: string | undefined) {
  if (!typename) return null

  return entities[`${capitalizeString(typename)}Entity`]?.icon ?? null
}
