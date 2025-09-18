import {
  CreateInputFieldDefinition,
  ExportFieldDefinition,
  FilterInputFieldDefinition,
  ImportFieldDefinition,
  RenderDefinition,
  EditInputFieldDefinition,
  ViewRenderFieldDefinition,
  HeaderRenderFieldDefinition,
  SortFieldDefinition,
  InputDefinition,
  BatchUpdateFieldDefinition,
} from '.'
import { ActionDefinition } from './action'
import { EntityDefinition } from './entity'
import { CrudPageOptions, CrudRawFilterObject } from './misc'
import { PreviewDefinition } from './preview'

export type PageOptions = {
  // required fields for the page, if any
  requiredFields?: string[]

  // custom function that will return the lookup params, if any. like { id: 123 }
  getLookupParams?: (that) => any

  // whether or not to render the record as a full page (12 cols), rather than centered with an offset
  fullPageMode?: boolean

  // the expand types to automatically render below (as previews)
  // string corresponds to the key
  previewExpandTypes?: string[]

  // custom page component
  component?: any

  // should there be a dedicated share button? (requires shareOptions)
  dedicatedShareButton?: boolean

  // should the actions be hidden?
  hideActions?: boolean
  // should the refresh button be hidden?
  hideRefresh?: boolean
  // should the minimize button be hidden?
  hideMinimize?: boolean
}

export type DialogOptions = {
  // should the actions be hidden?
  hideActions?: boolean
  // should the refresh button be hidden?
  hideRefresh?: boolean
  // should the title and icon be hidden?
  hideTitle?: boolean
}

export type CreateOptions = {
  // required: fields that can be added
  // a function can be provided instead, which will determine the fields dynamically based on that and parentItem
  fields:
    | (string | CreateInputFieldDefinition)[]
    | ((that, parentItem) => (string | CreateInputFieldDefinition)[])

  // custom component
  component?: any
  // if not createX, the custom create operation name
  operationName?: string

  // custom function to modify the inputs in-place before they get sent as args
  inputsModifier?: (that, inputs) => void

  // fields to return after editing (for use in onSuccess, etc) -- array in dot notation
  returnFields?: string[]

  // function that runs when record is successfully added
  onSuccess?: (that, item, returnData) => void

  // post-processing of inputs, if any
  afterLoaded?: (that, inputsArray) => Promise<void>

  // under what conditions will the button be hidden?
  hideIf?: (that) => boolean

  // if a custom title, what should it be?
  title?: string

  // if a custom icon, what should it be?
  icon?: string
}

// a way to create stuff using an actionDefinition, instead of using preset fields
export type GenerateOptions = {
  action: ActionDefinition

  // under what conditions will the button be hidden?
  hideIf?: (that) => boolean

  buttonText?: string
  buttonIcon?: string
}

export type UpdateOptions = {
  // required: fields that can be added
  // a function can be provided instead, which will determine the fields dynamically based on that/item
  fields:
    | (string | EditInputFieldDefinition)[]
    | ((that, item) => (string | EditInputFieldDefinition)[])
  // custom component
  component?: any
  // if not createX, the custom create operation name
  operationName?: string

  // custom function to modify the inputs in-place before they get sent as args
  inputsModifier?: (that, inputs) => void

  // fields to return after editing (for use in onSuccess, etc) -- array in dot notation
  returnFields?: string[]

  // function that runs when recorded is successfully edited
  onSuccess?: (that, item, returnData) => void

  // post-processing of inputs, if any
  afterLoaded?: (that, inputsArray) => Promise<void>

  // under what conditions will the button be hidden?
  hideIf?: (that, item) => boolean

  // if a custom title, what should it be?
  title?: string

  // if a custom icon, what should it be?
  icon?: string
}

export type DeleteOptions = {
  // no fields when deleting
  // custom component
  component?: any
  // if not createX, the custom create operation name
  operationName?: string

  // fields to return after deleting (for use in onSuccess, etc) -- array in dot notation
  returnFields?: string[]

  // function that runs when recorded is successfully deleted
  onSuccess?: (that, item, returnData) => void

  // under what conditions will the button be hidden?
  hideIf?: (that, item) => boolean

  // if a custom title, what should it be?
  title?: string

  // if a custom icon, what should it be?
  icon?: string
}

export type ViewOptions = {
  // required: fields that can be viewed
  fields: (string | ViewRenderFieldDefinition)[]

  // additional fields required (but not shown)
  requiredFields?: string[]

  // custom component
  component?: any

  // function that runs when recorded is successfully viewed
  onSuccess?: (that, parentItem, returnData) => void

  // should the viewOptions interface show a hero image/text at the top
  heroOptions?: {
    // function that will get the preview image from the item
    getPreviewImage?: (item: any) => any

    // function that will get the preview name from the item
    getPreviewName?: (item: any) => any

    // should the v-img component be contained?
    containMode?: boolean

    // custom component that should be rendered, which will override the above 2 options
    component?: any
  }

  // if a custom title, what should it be?
  title?: string

  // if a custom icon, what should it be?
  icon?: string
}

export type ChipOptions = {
  fields: string[]
  // the function to derive the name on the chip. else defaults to name
  getName?: (item: any) => any
  // the function to derive the image on the chip. else defaults to avatar
  getImage?: (item: any) => any
}

export type PostOptions = {
  viewDefinition: ViewDefinition

  // are the posts readonly?
  readonly?: boolean

  // custom component
  component?: any

  // fields to hide
  hiddenFields?: string[]

  // initial sort options that should be applied to nested component
  initialSortKey?: string

  // custom function for generating the lockedFilters for filtering the posts, if any
  getLockedFilters?: (that, item) => any
}

// requires CreateOptions to be defined
export type CopyOptions = {
  // required: fields that should be copied
  fields: string[]
  // custom component
  component?: any

  // replacement icon
  icon?: string
  // replacement text
  text?: string
}

export type ShareOptions = {
  // custom component
  component?: any

  // get a custom share URL
  getUrl?: (that, viewDefinition, id) => string

  // if a custom title, what should it be?
  title?: string

  // if a custom icon, what should it be?
  icon?: string
}

export type EnterOptions = {}

export type ExpandTypeObject = {
  // the key that will be associated with this in the URL
  key: string
  // viewDefinition is required unless it is a custom component (currently required because custom components are not supported)
  view: ViewDefinition
  // component?: any // not currently implemented
  // name for the expandType, otherwise viewDefinition.entity.name will be used
  name?: string
  // icon for the expandType, otherwise viewDefinition.entity.icon will be used
  icon?: string
  // function that will replace the lockedSubFilters() computed property in crud.js if provided
  // if not provided, will default to something based on the parent item (parent item.id eq value)
  lockedFilters?: (that, item) => CrudRawFilterObject[]
  // headers fields that should not be shown
  excludeHeaders?: string[]
  // filter fields that should not be shown (however, they can still be manipulated in a custom component file)
  excludeFilters?: string[]
  // initial filters that should be loaded into the nested component
  initialFilters?: CrudRawFilterObject[]

  // initial sort options that should be applied to nested component
  initialSortKey?: string

  // force use of dialog for this expandType. default false.
  forceDialog?: boolean

  // show any preset filters that may be on the viewDefinition (default no)
  showPresets?: boolean

  // number of results to show per page for this expand option. else, defaults to 12
  resultsPerPage?: number

  // open the expand in the same interface instead of expanding or opening a dialog, and related options
  breadcrumbOptions?: {
    hideBreadcrumbs?: boolean
  }

  // show this option as its own block/row if it is rendered as a grid
  showRowIfGrid?: boolean

  // hide the expand type if true
  hideIf?: (that, item) => boolean
}

export type ActionObject = {
  text?: string
  icon?: string
  showIf?: (that, item) => boolean
  // if this is specified, it will open a dialog that will allow the user to complete the action (with inputs, if necessary)
  action?: ActionDefinition

  // if this above is not specified, this must be specified
  simpleActionOptions?: {
    handleClick: (that, item) => void
    isAsync?: boolean // should the button have a loader and not be clickable while the operation is processing?
    // should a confirmation dialog trigger when clicking this action
    confirmOptions?: {
      text?: string
    }
  }
}

export type HeroOptions = {
  // function that will get the preview image from the item
  getPreviewImage?: (item: any) => any

  // function that will get the preview name from the item
  getPreviewName?: (item: any) => any

  // fallback icon if no image is found
  fallbackIcon?: string

  // should the v-img component be contained?
  containMode?: boolean

  // custom component that should be rendered, which will override the above 2 options
  component?: any
}

export type FollowOptions = {
  // entity for "following" this type
  entity: EntityDefinition
}

export type ViewDefinition = {
  entity: EntityDefinition
  preview?: PreviewDefinition
  inputFields: {
    [x in string]: InputDefinition
  }
  renderFields: {
    [x in string]: RenderDefinition
  }
  pageOptions?: {} & PageOptions
  paginationOptions?: {} & PaginationOptions
  dialogOptions?: {} & DialogOptions

  createOptions?: {} & CreateOptions
  generateOptions?: {} & GenerateOptions
  updateOptions?: {} & UpdateOptions
  deleteOptions?: {} & DeleteOptions
  viewOptions?: {} & ViewOptions
  chipOptions?: {} & ChipOptions
  postOptions?: {} & PostOptions
  copyOptions?: {} & CopyOptions
  shareOptions?: {} & ShareOptions
  enterOptions?: {} & EnterOptions
  actions?: ({} & ActionObject)[]
  childTypes?: ({} & ExpandTypeObject)[]

  // extra fields
  routeType: string
  routeKey: string

  // override title for this view (defaults to entity.typename)
  title?: string
  // override the icon for this view (defaults to entity.icon)
  icon?: string

  // fields that must always be requested when fetching the specific item and multiple items, along with the id field. could be for certain rendering purposes
  requiredFields?: string[]
}

export type PaginationOptions = {
  // function that runs when pagination interface is opened for the first time
  onSuccess?: (that) => void

  // does the interface have the ability to search?
  searchOptions?: {
    // should the search bar show up in the presets
    preset?: boolean
    // function that will return the params to be passed with the search, if any
    getParams?: (that, searchQuery) => any
  }

  defaultPageOptions?: (that: any) => Promise<CrudPageOptions> | CrudPageOptions

  defaultLockedFilters?: (that: any) => CrudRawFilterObject[]

  // all of the possible usable filters
  filters?: FilterInputFieldDefinition[]

  distanceFilterOptions?: {
    key: string
    text: string
    defaultLocation?: (that) => Promise<any>
    defaultValue?: (that) => Promise<any>
  }[]

  sortFields?: SortFieldDefinition[]

  // fields required but not shown, such as fields needed for heroOptions
  requiredFields?: string[]

  // should a hero image be displayed? only applies to grid view
  heroOptions?: {
    // function that will get the preview image from the item
    getPreviewImage?: (item: any) => any

    // function that will get the preview name from the item
    getPreviewName?: (item: any) => any

    // should the v-img component be contained?
    containMode?: boolean

    // custom component that should be rendered, which will override the above 2 options
    component?: any
  }

  // should the entire toolbar be hidden? this will override some of the toolbar-related options below
  hideToolbar?: boolean

  // should the actions be hidden?
  hideActions?: boolean

  // should the refresh button be hidden?
  hideRefresh?: boolean

  // should the filter button be hidden?
  hideFilters?: boolean

  // the headers of the table
  headers: HeaderRenderFieldDefinition[]

  // header fields that should be hidden
  excludeHeaders?: string[]

  // special options for overriding the action header element
  headerActionOptions?: {
    text?: string
    width?: string
  }
  handleRowClick?: (that, props) => void
  handleGridElementClick?: (that, item) => void

  // options relating to the grid interface
  gridOptions?: {
    justify?: 'center' | 'left'
    colsObject?: {
      // cols, out of 12
      xs?: number
      sm?: number
      md?: number
      lg?: number
    }
  }

  // custom component
  component?: any
  // can the results be downloaded?
  downloadOptions?: {
    // fields to download
    fields: ExportFieldDefinition[]
  }

  // can results be imported?
  importOptions?: {
    // required: fields that can be added
    fields: ImportFieldDefinition[]
    // custom component
    component?: any
    // if not createX, the custom create operation name
    operationName?: string

    // custom function to modify the inputs in-place before they get sent as args
    inputsModifier?: (that, inputs) => void

    // skip the import row if this is true
    skipIf?: (that, inputs) => boolean

    // function that runs when import is successfully run on at least one record
    onSuccess?: (that) => void

    // function that runs when an import operation throws an error. it is a way to ignore (catch) the error if it should be caught
    onError?: (that, err) => void

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string

    // should the imported records be downloaded after? requires downloadOptions to be set
    allowDownloadAfterCompletion?: boolean
  }

  // can results be batch updated?
  batchUpdateOptions?: {
    // required: fields that can be updated
    fields: BatchUpdateFieldDefinition[]
    // custom component
    component?: any
    // if not updateX, the custom update operation name
    operationName?: string

    // custom function to modify the inputs in-place before they get sent as args
    inputsModifier?: (that, inputs) => void

    // skip the import row if this is true
    skipIf?: (that, inputs) => boolean

    // function that runs when import is successfully run on at least one record
    onSuccess?: (that) => void

    // function that runs when an import operation throws an error. it is a way to ignore (catch) the error if it should be caught
    onError?: (that, err) => void

    // if a custom title, what should it be?
    title?: string

    // if a custom icon, what should it be?
    icon?: string

    // should the imported records be downloaded after? requires downloadOptions to be set
    allowDownloadAfterCompletion?: boolean
  }

  // this option, if defined, will override the default grid/list option set by the user
  overrideViewMode?: 'grid' | 'list'

  // should the grid/list toggle button be hidden?
  hideGridModeToggle?: boolean

  // should the sortBy feature be hidden?
  hideSortOptions?: boolean

  // override the number of records per page
  resultsPerPage?: number

  // number of records to show initially
  maxInitialRecords?: number

  limitOptions?: {
    // what should clicking the view all button do? (if undefined, button will be left out)
    handleViewAllButtonClick?: (that) => void
  }

  // hide the view more button
  hideViewMoreOptions?: {
    // even though the view more button is hidden, should more records be allowed to load? infinite scroll must be true on paginatorOptions too.
    infiniteScroll?: boolean
  }

  // should more records be loaded when the scroll bar reaches the bottom?
  infiniteScroll?: boolean

  // hide the total number of results (showing X of Y)
  hideCount?: boolean

  // hide the title
  hideTitle?: boolean

  // show button to "view all" of this record
  showViewAll?: boolean

  // the min height of the pagination container, if any
  minHeight?: string

  // loader will be linear by default
  loaderStyle?: 'circular' | 'linear'
}
