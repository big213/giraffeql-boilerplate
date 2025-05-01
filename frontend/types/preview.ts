import { RenderDefinition, RenderFieldDefinition } from '.'
import { EntityDefinition } from './entity'
import { FollowOptions, HeroOptions } from './view'

export type PreviewDefinition = {
  entity: EntityDefinition

  // required: fields that can be previewed -- no lookups allowed
  fields: PreviewRenderFieldDefinition[]

  // should the previewOptions interface show a hero image/text at the top
  heroOptions?: HeroOptions

  // hides the "view" button
  hideViewButton?: boolean

  // actions
  actions?: {
    text: string
    icon: string
    handleClick: (that, item: any) => void
  }[]

  followOptions?: {} & FollowOptions
}

export type PreviewRenderFieldDefinition = {
  // renderDefinition is always required in this case
  renderDefinition: RenderDefinition
} & RenderFieldDefinition
