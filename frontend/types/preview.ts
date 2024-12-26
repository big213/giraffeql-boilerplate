import { RenderFieldDefinition } from '.'
import { EntityDefinition } from './entity'
import { FollowOptions, HeroOptions } from './view'

export type PreviewDefinition = {
  entity: EntityDefinition

  renderFields: {
    [x in string]: RenderFieldDefinition
  }

  // required: fields that can be previewed
  fields: string[]

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
