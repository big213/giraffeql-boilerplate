import { format } from 'timeago.js'
import { convertArrayToCSV } from 'convert-array-to-csv'
import { executeApiRequest, GiraffeqlError } from './api'
import {
  CrudFilterObject,
  CrudInputObject,
  CrudRawFilterObject,
} from '../types/misc'
import { Root } from '../../schema'
import {
  ArrayOptions,
  FilterInputFieldDefinition,
  InputDefinition,
  InputFieldDefinition,
  NestedInputFieldDefinition,
  NestedOptions,
  PriceObject,
  RenderDefinition,
  RenderFieldDefinition,
} from '~/types'
import { generateViewRecordRoute } from './route'
import { EntityDefinition } from '~/types/entity'
import { ViewDefinition } from '~/types/view'

type StringKeyObject = { [x: string]: any }

export function formatAsCurrency(
  input: number | null,
  currencySymbol: string | null | undefined = '$'
) {
  const validatedInput = input ?? 0

  return validatedInput < 0
    ? `-${currencySymbol}${(validatedInput * -1).toFixed(2)}`
    : `${currencySymbol}${validatedInput.toFixed(2)}`
}

export function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateTimeAgoString(unixTimestamp: number | null) {
  if (!unixTimestamp) return null

  return format(unixTimestamp * 1000)
}

// unix timestamp (seconds) to YYYY-MM-DD HH:MM:SS
export function generateDateLocaleString(
  unixTimestamp: number | null,
  truncateSeconds = false
) {
  if (!unixTimestamp) return null

  const dateObject = new Date(unixTimestamp * 1000)

  const hours = dateObject.getHours()

  return `${dateObject.getFullYear()}-${String(
    dateObject.getMonth() + 1
  ).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')} ${
    truncateSeconds
      ? `${String(hours > 12 ? hours - 12 : hours === 0 ? 12 : hours)}:${String(
          dateObject.getMinutes()
        ).padStart(2, '0')} ${hours > 11 ? 'PM' : 'AM'}`
      : dateObject.toLocaleTimeString()
  }`
}

// YYYY-MM-DD HH:MM(:SS). If only YYYY-MM-DD is provided, will automatically append the current HH:MM:SS.
// this should be IE and safari safe
export function generateParseDateTimeStringFn(
  defaultTo: 'currentTime' | 'startOfDay' | 'endOfDay' = 'startOfDay'
) {
  return function parseDateTimeString(
    val: string | number | null
  ): number | null {
    // if falsey, default to null
    if (!val) return null

    // if val is a number, it should be a unix timestamp seconds
    // number input should only be possible from a special parsed value, like __now()
    if (typeof val === 'number') {
      return val
    }

    // if the string resembles timeLanguage, parse it as such
    if (val.match(/^(now|time)/)) return parseTimeLanguage(val)

    let dateString = val

    let year, month, day, hours, minutes, seconds
    if (
      !dateString.match(
        /^\d{4}-\d{2}-\d{2}(\s\d{1,2}:\d{2}(:\d{2})?(\s(AM|PM))?)?$/
      )
    ) {
      throw new Error('Invalid date format')
    }

    const dateParts = dateString.split(/-|:|\s/)

    // required
    year = Number(dateParts[0])
    month = Number(dateParts[1]) - 1
    day = Number(dateParts[2])

    // optional
    hours = Number(dateParts[3]) || null
    minutes = Number(dateParts[4]) || null
    seconds = Number(dateParts[5]) || null

    // if PM, add 12 to hours EXCEPT if hours is already 12
    // i.e. 12:00PM -> hours: 12
    if (dateParts[dateParts.length - 1] === 'PM' && hours !== 12) hours += 12

    // if AM, set hours to 0 if hours is 12
    // i.e. 12:00AM -> hours 0
    if (dateParts[dateParts.length - 1] === 'AM' && hours === 12) hours = 0

    if (hours > 23) throw new Error('Hours cannot be more than 23')

    // if hours missing, automatically append current HH/MM/SS
    if (hours === null) {
      if (defaultTo === 'currentTime') {
        const currentDate = new Date()
        hours = currentDate.getHours()
        minutes = currentDate.getMinutes()
        seconds = currentDate.getSeconds()
      } else if (defaultTo === 'startOfDay') {
        // default to startOfDay, 12:00:00
        hours = 0
        minutes = 0
        seconds = 0
      }
    }

    const msTimestamp = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      seconds
    ).getTime()

    // date cannot be too far in the future
    /*   if (msTimestamp > new Date().getTime() + 1000 * 60 * 60 * 24) {
      throw new Error(`Date Happened cannot be in the future`)
    } */

    return msTimestamp / 1000
  }
}

export const parseDateTimeString = generateParseDateTimeStringFn('startOfDay')

/*
 ** parses stuff like now(), now(1000), now(-1000).start(), now(1000).end()
 ** time(unixTimestampMs), time(1000).start(), time(1000).end()
 ** into unixTimestamp (seconds)
 */
export function parseTimeLanguage(input: string) {
  const operations = input.split('.')

  // unix timestamp is MS
  let unixTimestamp: number | undefined

  operations.forEach((operation) => {
    const opParts = operation.split('(')
    const operator = opParts[0]
    const operand = opParts[1].replace(')', '')

    if (operator === 'now') {
      unixTimestamp = new Date().getTime()
      // apply the operand, if any
      if (operand) unixTimestamp += Number(operand)
    } else if (operator === 'time') {
      // operand required
      if (!operand) throw new Error('Operand required for time()')
      unixTimestamp = Number(operand)
    } else if (operator === 'start') {
      if (unixTimestamp === undefined)
        throw new Error('start() must be called after now() or time()')

      const date = new Date(unixTimestamp)
      unixTimestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0
      ).getTime()
    } else if (operator === 'end') {
      if (unixTimestamp === undefined)
        throw new Error('start() must be called after now() or time()')
      const date = new Date(unixTimestamp)
      unixTimestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59
      ).getTime()
    }
  })

  if (!unixTimestamp) throw new Error('Invalid unixTimestamp generated')

  return unixTimestamp / 1000
}

export function timeLanguageToLocaleString(input: string) {
  return generateDateLocaleString(parseTimeLanguage(input))
}

export function capitalizeString(str: string | undefined): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

export async function copyToClipboard(that, content) {
  await navigator.clipboard.writeText(content)
  that.$root.$emit('showSnackbar', {
    message: 'Copied to Clipboard',
    color: 'success',
  })
}

export function serializeNestedProperty(
  obj: StringKeyObject,
  path: string,
  serializeFn: (value) => unknown
): void {
  const pathArray = path.split(/\./)
  const finalField = pathArray.pop()
  // if no final field, must be a malformed path
  if (!finalField) return
  let currentValue = obj
  for (const prop of pathArray) {
    // if not object, end early
    if (!(currentValue && typeof currentValue === 'object')) {
      return
    }
    currentValue = currentValue[prop]
  }

  if (currentValue) {
    currentValue[finalField] = serializeFn(currentValue[finalField])
  }
}

export function getNestedProperty(obj: StringKeyObject, path: string) {
  const pathArray = path.split(/\./)
  let currentValue: any = obj
  for (const prop of pathArray) {
    // if not object, return null;
    if (!(currentValue && typeof currentValue === 'object')) {
      return null
    }
    currentValue = currentValue[prop]
  }
  return currentValue
}

export function setNestedProperty(
  obj: StringKeyObject,
  path: string,
  value: unknown
): void {
  const pathArray = path.split(/\./)
  const finalField = pathArray.pop()
  // if no final field, must be a malformed path
  if (!finalField) return
  let currentValue = obj
  for (const prop of pathArray) {
    // if not object, end early
    if (!(currentValue && typeof currentValue === 'object')) {
      return
    }
    currentValue = currentValue[prop]
  }
  currentValue[finalField] = value
}

export function isObject(ele: unknown): ele is StringKeyObject {
  return Object.prototype.toString.call(ele) === '[object Object]'
}

export function isId(ele: unknown) {
  return typeof ele === 'string' || typeof ele === 'number'
}

export function collapseObject(obj: StringKeyObject): StringKeyObject | null {
  const returnObject = {}
  const nestedFieldsSet: Set<string> = new Set()

  for (const field in obj) {
    // if the field is undefined, skip
    if (obj[field] === undefined) continue

    if (field.match(/\./)) {
      const firstPart = field.substr(0, field.indexOf('.'))
      const secondPart = field.substr(field.indexOf('.') + 1)

      // if field is set as null, skip
      if (returnObject[firstPart] === null) continue

      // if field not in return object as object, set it
      if (!isObject(returnObject[firstPart])) {
        returnObject[firstPart] = {}
        nestedFieldsSet.add(firstPart)
      }

      // if secondPart is "id", set it to null
      if (secondPart === 'id' && obj[field] === null) {
        returnObject[firstPart] = null
        nestedFieldsSet.delete(firstPart)
        continue
      }

      returnObject[firstPart][secondPart] = obj[field]
      // leaf field, add to obj if not already set
    } else if (!(field in returnObject)) {
      returnObject[field] = obj[field]
    }
  }

  // process the fields that are nested
  nestedFieldsSet.forEach((field) => {
    returnObject[field] = collapseObject(returnObject[field])
  })
  return returnObject
}

// accepts dot notation, outputs collapsed object
export function buildQueryFromFieldPathArray(fieldPathArray: string[]) {
  return collapseObject(
    fieldPathArray.reduce((total, val) => {
      total[val] = true
      return total
    }, {})
  )
}

export function collapseObjectArray(objArray: StringKeyObject[]) {
  return objArray.map((obj) => collapseObject(obj))
}

export function openLink(url: string, newWindow = true): void {
  newWindow ? window.open(url) : (window.location.href = url)
}

// returns date in YYYY-MM-DD format
export function getCurrentDate(): string {
  return new Date().toISOString().substring(0, 10)
}

export function downloadCSV(
  that,
  dataArray: StringKeyObject[],
  name = 'file'
): void {
  try {
    that.$root.$emit('showSnackbar', {
      message: 'File download started',
      color: 'success',
    })

    const csvString = convertArrayToCSV(dataArray)

    const link = document.createElement('a')
    const blob = new Blob(['\uFEFF', csvString])
    link.href = window.URL.createObjectURL(blob)
    link.download = name + '.csv'
    link.click()
  } catch (err) {
    handleError(that, err)
  }
}

export function getBuildVersion() {
  return process.env.VER ? process.env.VER.split('/').pop() : 'DEV'
}

export function handleError(that, err) {
  if (that) {
    // error thrown by server
    if (err instanceof GiraffeqlError) {
      that.$root.$emit('showSnackbar', {
        message: `${err.message}${
          err.data.fieldPath
            ? ` at [${err.data.fieldPath
                .filter((ele) => ele !== '__args')
                .join('-')}]`
            : ''
        }`,
        color: 'error',
        copyableText: JSON.stringify(
          {
            ...err.data,
            query: err.query,
            build: getBuildVersion(),
            apiVersion: err.apiVersion,
          },
          null,
          2
        ),
      })
      console.log(err)
    } else {
      // error thrown on client side
      that.$root.$emit('showSnackbar', {
        message: err.message,
        color: 'error',
        copyableText: JSON.stringify(
          {
            message: err.message,
            type: 'clientError',
            build: getBuildVersion(),
            stack: err.stack,
          },
          null,
          2
        ),
      })
      console.log(err)
    }
  } else {
    console.log(err)
  }
}

export function generateLoginError(setRedirect = true) {
  if (setRedirect)
    localStorage.setItem(
      'redirectPath',
      window.location.pathname + window.location.search
    )

  return new Error('Login required')
}

export function getPaginatorData(operation, query, args) {
  return executeApiRequest(<any>{
    [operation]: {
      paginatorInfo: {
        total: true,
        startCursor: true,
        endCursor: true,
      },
      edges: {
        node: query,
        cursor: true,
      },
      __args: args,
    },
  })
}

// executes a giraffeql paginated operation 100 rows at a time until no more results are returned
export async function collectPaginatorData(
  operation,
  query,
  args = {},
  fetchRows = 100
) {
  let afterCursor: string | undefined

  const allResults: any[] = []

  let hasMore = true
  while (hasMore) {
    const data = <any>await getPaginatorData(operation, query, {
      ...args,
      first: fetchRows,
      after: afterCursor,
    })

    afterCursor = data.paginatorInfo.endCursor

    // if results returned is less than fetchRows, no more results
    if (data.edges.length < fetchRows) hasMore = false

    allResults.push(...data.edges.map((ele) => ele.node))
  }

  return allResults
}

export function setInputValue(inputObjectsArray, key, value) {
  const inputObject = inputObjectsArray.find((ele) => ele.fieldKey === key)
  if (!inputObject) throw new Error(`Input key not found: '${key}'`)

  inputObject.value = value
}

export function getInputValue(inputObjectsArray, key, throwErr = false) {
  const inputObject = inputObjectsArray.find((ele) => ele.fieldKey === key)
  if (!inputObject && throwErr) throw new Error(`Input key not found: '${key}'`)
  return inputObject?.value ?? null
}

export function getInputObject(inputObjectsArray, key) {
  const inputObject = inputObjectsArray.find((ele) => ele.fieldKey === key)
  // if (!inputObject) throw new Error(`Input key not found: '${key}'`)

  return inputObject ?? null
}

// must be inserted into a context where this.getInputValue is defined
export function mapInputGetters(fieldsArray) {
  return fieldsArray.reduce((total, val) => {
    total[val] = function () {
      return this.getInputValue(val)
    }
    return total
  }, {})
}

export function convertCSVToJSON(text: string) {
  let p = ''
  let l
  let row = ['']
  const ret = [row]
  let i = 0
  let r = 0
  let s = !0

  for (l of text) {
    if (l === '"') {
      if (s && l === p) row[i] += l
      s = !s
    } else if (l === ',' && s) l = row[++i] = ''
    else if (l === '\n' && s) {
      if (p === '\r') row[i] = row[i].slice(0, -1)
      row = ret[++r] = [(l = '')]
      i = 0
    } else row[i] += l
    p = l
  }
  const objArray: StringKeyObject[] = []
  const headers = ret[0].map((ele) => ele.trim())
  for (let k = 1; k < ret.length; k++) {
    const o = {}
    let hasUndefined = false
    let hasAllEmptyRows = true
    for (let j = 0; j < headers.length; j++) {
      o[headers[j]] = ret[k][j]
      if (ret[k][j] === undefined) hasUndefined = true
      else if (ret[k][j] !== '') hasAllEmptyRows = false
    }
    // not pushing rows where at least one column is undefined
    // also not pushing rows where all rows are empty
    if (!hasUndefined && !hasAllEmptyRows) objArray.push(o)
  }
  return objArray
}

export const viewportToPixelsMap = {
  xs: 600,
  sm: 960,
  md: 1264,
  lg: 1904,
  xl: +Infinity,
}

export function lookupInputDefinition(
  viewDefinition: ViewDefinition,
  fieldKey: string
): InputDefinition {
  const validatedInputDefinition = viewDefinition.inputFields[fieldKey]

  // field unknown, abort
  if (!validatedInputDefinition)
    throw new Error(
      `Unknown input field on ${viewDefinition.entity.typename}: '${fieldKey}'`
    )

  return validatedInputDefinition
}

export function lookupRenderDefinition(
  viewDefinition: ViewDefinition,
  fieldKey: string
): RenderDefinition {
  const validatedRenderDefinition = viewDefinition.renderFields[fieldKey]

  // field unknown, abort
  if (!validatedRenderDefinition)
    throw new Error(
      `Unknown render field on ${viewDefinition.entity.typename}: '${fieldKey}'`
    )

  return validatedRenderDefinition
}

export function populateInputObject(
  that,
  {
    inputObject,
    parentItem,
    fetchEntities = false,
  }: {
    inputObject: CrudInputObject
    parentItem: any | undefined
    fetchEntities?: boolean
  }
) {
  const promisesArray: Promise<any>[] = []
  if (inputObject.inputDefinition.inputType === 'value-array') {
    // if it is a value-array, recursively process the nestedValueArray
    inputObject.nestedInputsArray.forEach((nestedInputElement) => {
      const nestedInputObjects = Array.isArray(nestedInputElement)
        ? nestedInputElement
        : [nestedInputElement]

      nestedInputObjects.forEach((nestedInputObject) => {
        promisesArray.push(
          ...populateInputObject(that, {
            inputObject: nestedInputObject.inputObject,
            parentItem,
            fetchEntities: true, // for nested inputs, always fetch the entities
          })
        )
      })
    })
  } else {
    // for stripe-pi, need to fetch the stripeAccount and clientSecret
    if (
      inputObject.inputDefinition.inputType === 'stripe-pi' ||
      inputObject.inputDefinition.inputType === 'stripe-pi-editable'
    ) {
      if (!inputObject.inputDefinition.paymentOptions) {
        throw new Error(`Stripe payments misconfigured`)
      }

      const initialQuantity =
        inputObject.inputDefinition.paymentOptions.quantityOptions?.default?.() ??
        0

      const initialPriceObject =
        inputObject.inputDefinition.paymentOptions.getPriceObject?.(
          that,
          parentItem,
          initialQuantity,
          inputObject.inputDefinition.paymentOptions.quantityOptions?.getDiscountScheme?.(
            that,
            parentItem
          )
        )

      const finalPrice = calculateFinalPrice(initialPriceObject)

      promisesArray.push(
        inputObject.inputDefinition.paymentOptions
          .getPaymentIntent(
            that,
            inputObject,
            parentItem,
            initialQuantity,
            finalPrice
          )
          .then((res) => (inputObject.inputData = res))
      )

      // also set the initial value
      inputObject.inputValue = finalPrice

      inputObject.secondaryInputValue = initialQuantity
    }

    // if there are options to be loaded, fetch the options and convert any strings to objects *if it's not a text-combobox, which could load values that aren't in the options*
    // also only process this if not hidden and readonly
    if (
      inputObject.inputDefinition.getOptions &&
      !(inputObject.hidden && inputObject.readonly)
    ) {
      inputObject.loading = true
      promisesArray.push(
        inputObject.inputDefinition.getOptions(that).then((res) => {
          // set the options
          inputObject.options = res

          // if it's a text-combobox, skip converting the strings to objects
          if (inputObject.inputDefinition.inputType !== 'text-combobox') {
            // if it's an array of Ids, or an ID, look it up
            if (Array.isArray(inputObject.value)) {
              inputObject.value = inputObject.value.map((value) => {
                // if it's an entity, do the lookup of the id, translating id to obj. but if it's not an ID, assume it's already an obj
                if (inputObject.inputDefinition.entity) {
                  return isId(value)
                    ? inputObject.options.find((ele) => ele.id === value)
                    : value
                } else {
                  // if it's not an entity, it should be a string
                  return inputObject.options.find((ele) => ele === value)
                }
              })
            } else if (isId(inputObject.value)) {
              if (inputObject.inputDefinition.entity) {
                inputObject.value =
                  inputObject.options.find(
                    (ele) => ele.id === inputObject.value
                  ) ?? null
              } else {
                inputObject.value =
                  inputObject.options.find(
                    (ele) => ele === inputObject.value
                  ) ?? null
              }
            }
          }

          inputObject.loading = false
        })
      )
    }

    // if it's an entity but no getOptions, need to manually fetch the options one at a time
    if (
      inputObject.inputDefinition.entity &&
      !inputObject.inputDefinition.getOptions
    ) {
      const originalFieldValue = inputObject.value

      const entity = inputObject.inputDefinition.entity

      // if no name or avatar, just use the id
      if (!entity.nameField && !entity.avatarField) {
        inputObject.value = {
          id: originalFieldValue,
        }
      } else if (fetchEntities) {
        if (Array.isArray(originalFieldValue)) {
          originalFieldValue.forEach((value, index) => {
            if (isId(value)) {
              promisesArray.push(
                executeApiRequest(<any>{
                  [`${entity.typename}Get`]: {
                    id: true,
                    ...(entity.nameField && {
                      [entity.nameField]: true,
                    }),
                    ...(entity.avatarField && {
                      [entity.avatarField]: true,
                    }),
                    __args: {
                      id: value,
                    },
                  },
                })
                  .then((res) => {
                    // change value to object (at index)
                    inputObject.value[index] = res
                    inputObject.options.push(res)
                  })
                  .catch((e) => e)
              )
            }
          })
        } else if (isId(originalFieldValue)) {
          promisesArray.push(
            executeApiRequest(<any>{
              [`${entity.typename}Get`]: {
                id: true,
                ...(entity.nameField && {
                  [entity.nameField]: true,
                }),
                ...(entity.avatarField && {
                  [entity.avatarField]: true,
                }),
                __args: {
                  id: originalFieldValue,
                },
              },
            })
              .then((res) => {
                // change value to object
                inputObject.value = res
                inputObject.options = [res]
              })
              .catch((e) => e)
          )
        }
      }
    }
  }

  return promisesArray
}

export function addNestedInputObject(
  that,
  parentInputObject: CrudInputObject,
  parentItem: any,
  inputValue?: any
) {
  if (!parentInputObject.inputDefinition.arrayOptions) {
    throw new Error(`inputDefinition.arrayOptions not defined`)
  }

  const nestedInputObjects = (
    Array.isArray(parentInputObject.inputDefinition.arrayOptions.type)
      ? parentInputObject.inputDefinition.arrayOptions.type
      : [parentInputObject.inputDefinition.arrayOptions.type]
  ).map((nestedFieldDefinition) => {
    // if the nested type is not an array (i.e. single element), make the label empty
    const inputObject = generateInputObject(
      that,
      nestedFieldDefinition,
      Array.isArray(parentInputObject.inputDefinition.arrayOptions!.type)
        ? undefined
        : {
            label:
              parentInputObject.inputDefinition.arrayOptions?.entryName ?? '',
          }
    )

    // populate the value if there is an inputValue
    inputObject.value =
      (Array.isArray(parentInputObject.inputDefinition.arrayOptions!.type)
        ? inputValue
          ? getNestedProperty(inputValue, inputObject.fieldPath)
          : null
        : inputValue) ??
      nestedFieldDefinition.inputDefinition.getInitialValue?.(
        that,
        parentItem
      ) ??
      null

    // if it is an entity, populate the value and options fields
    if (inputObject.inputDefinition.entity) {
      inputObject.value = getNestedProperty(inputValue, inputObject.fieldKey)

      // if the value is defined and there is no getOptions fn, populate it as the only option
      if (inputObject.value && !inputObject.inputDefinition.getOptions) {
        inputObject.options = [inputObject.value]
      }
    }

    return {
      nestedInputFieldDefinition: nestedFieldDefinition,
      inputObject,
    }
  })

  // if it's an array, it corresponds to an object of keys
  parentInputObject.nestedInputsArray.push(
    Array.isArray(parentInputObject.inputDefinition.arrayOptions.type)
      ? nestedInputObjects
      : nestedInputObjects[0]
  )
}

export async function processRenderQuery(
  that,
  {
    renderFieldDefinitions,
    rawFields,
  }: {
    renderFieldDefinitions: RenderFieldDefinition[]
    rawFields?: string[]
  }
) {
  // always fetch id and typename fields, and any raw fields
  const requiredFields = ['id', '__typename'].concat(rawFields ?? [])

  const query = requiredFields.reduce((total, field) => {
    total[field] = true
    return total
  }, {})

  for (const { fieldKey, renderDefinition } of renderFieldDefinitions) {
    // skip if key is __typename
    if (fieldKey === '__typename') continue

    // renderDefinition should always be defined by this point
    if (!renderDefinition) throw new Error(`renderDefinition not defined`)

    // skip if loadIf provided and it returns false
    if (renderDefinition.loadIf?.(that)) {
      continue
    }

    // if main fieldInfo has args and passes loadIf, process them
    if (renderDefinition.args) {
      for (const argObject of renderDefinition.args) {
        query[`${argObject.path}.__args`] = await argObject.getArgs(that)
      }
    }

    const fieldsToAdd: Set<string> = new Set()

    // in export mode, generally will only be fetching the first field
    if (renderDefinition.fields) {
      renderDefinition.fields.forEach((field) => fieldsToAdd.add(field))
    } else {
      fieldsToAdd.add(fieldKey)
    }

    // process fields
    fieldsToAdd.forEach(async (field) => {
      query[field] = true
    })
  }

  return collapseObject(query)
}

function getAllNestedFields(
  arrayOptions: ArrayOptions,
  parentPath: string[] = []
) {
  const nestedFields: string[] = []
  if (Array.isArray(arrayOptions.type)) {
    arrayOptions.type.forEach((nestedFieldDefinition) => {
      // if it has more nested options, go deeper. else add it to nestedFields
      if (nestedFieldDefinition.inputDefinition?.arrayOptions) {
        nestedFields.push(
          ...getAllNestedFields(
            nestedFieldDefinition.inputDefinition.arrayOptions,
            parentPath.concat(nestedFieldDefinition.fieldKey)
          )
        )
      } else {
        const currentPath = parentPath
          .concat(nestedFieldDefinition.fieldKey)
          .join('.')
        // if it is an entity, append 'id', __typename, and other relevant fields
        if (nestedFieldDefinition.inputDefinition?.entity) {
          nestedFields.push(
            ...[
              'id',
              '__typename',
              nestedFieldDefinition!.inputDefinition.entity.nameField,
              nestedFieldDefinition.inputDefinition.entity.avatarField,
            ]
              .filter((e) => e)
              .map((nestedField) => `${currentPath}.${nestedField}`)
          )
        } else {
          nestedFields.push(currentPath)
        }
      }
    })
  } else {
    // if it is an entity, append 'id', __typename, and other relevant fields
    if (arrayOptions.type.inputDefinition.entity) {
      if (arrayOptions.type.inputDefinition.entity) {
        nestedFields.push(
          ...[
            'id',
            '__typename',
            arrayOptions.type.inputDefinition.entity.nameField,
            arrayOptions.type.inputDefinition.entity.avatarField,
          ]
            .filter((e) => e)
            .map((nestedField) => `${parentPath.join('.')}.${nestedField}`)
        )
      }
    }
  }

  return nestedFields
}

export function processInputDefinitions(
  viewDefinition: ViewDefinition,
  fields: (string | InputFieldDefinition)[]
) {
  return fields.map((fieldElement) => {
    // if it's a string, convert it to a light version of the inputFieldDefinition
    const inputFieldDefinition =
      typeof fieldElement === 'string'
        ? {
            fieldKey: fieldElement,
          }
        : fieldElement

    // set the inputDefinition in the object if it is not defined
    if (!inputFieldDefinition.inputDefinition) {
      inputFieldDefinition.inputDefinition = lookupInputDefinition(
        viewDefinition,
        inputFieldDefinition.fieldKey
      )
    }

    return inputFieldDefinition
  })
}

export function processRenderDefinitions(
  viewDefinition: ViewDefinition,
  fields: (string | RenderFieldDefinition)[]
) {
  return fields.map((fieldElement) => {
    // if it's a string, convert it to a light version of the renderFieldDefinition
    const renderFieldDefinition =
      typeof fieldElement === 'string'
        ? {
            fieldKey: fieldElement,
          }
        : fieldElement

    // set the renderDefinition in the object if it is not defined
    if (!renderFieldDefinition.renderDefinition) {
      renderFieldDefinition.renderDefinition = lookupRenderDefinition(
        viewDefinition,
        renderFieldDefinition.fieldKey
      )
    }

    return renderFieldDefinition
  })
}

export async function processInputQuery(
  inputFieldDefinitions: InputFieldDefinition[]
) {
  // always fetch id and typename fields
  const query = { id: true, __typename: true }

  // fields must be raw fields
  for (const { fieldKey, inputDefinition } of inputFieldDefinitions) {
    // skip if key is __typename
    if (fieldKey === '__typename') continue

    // inputDefinition should always be defined by this point
    if (!inputDefinition) throw new Error(`inputDefinition not defined`)

    // recursively check for nested fields, and add those to query too
    if (inputDefinition.arrayOptions) {
      const allNestedFields = getAllNestedFields(inputDefinition.arrayOptions, [
        fieldKey,
      ])

      allNestedFields.forEach((nestedField) => {
        query[nestedField] = true
      })
    }

    // if it's a multiple-file type, add certain fields
    if (inputDefinition.inputType === 'multiple-file') {
      ;[
        'id',
        'name',
        'size',
        'contentType',
        'location',
        'servingUrl',
        inputDefinition.useFirebaseUrl ? 'downloadUrl' : null,
      ]
        .filter((e) => e)
        .forEach((nestedField) => {
          query[`${fieldKey}.${nestedField}`] = true
        })
    }

    // if it's an entity, add certain nested fields
    if (inputDefinition.entity) {
      ;[
        'id',
        '__typename',
        inputDefinition.entity.nameField,
        inputDefinition.entity.avatarField,
      ]
        .filter((e) => e)
        .forEach((nestedField) => {
          query[`${fieldKey}.${nestedField}`] = true
        })
    }

    // add the requested field
    query[fieldKey] = true
  }

  return collapseObject(query)
}

// apiKey -> api-key
export function camelToKebabCase(str: string) {
  return str
    .split('')
    .map((letter, idx) => {
      return letter.toUpperCase() === letter
        ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
        : letter
    })
    .join('')
}

export function kebabToCamelCase(str: string) {
  return str.replace(/-./g, (x) => x[1].toUpperCase())
}

export function generateFilterByObjectArray(
  crudRawFilterObjects: CrudRawFilterObject[],
  crudFilterObjects: CrudFilterObject[]
) {
  const filterByObject = crudFilterObjects.reduce((total, crudFilterObject) => {
    const fieldPath = crudFilterObject.inputObject.fieldPath

    // if value is undefined or null, exclude it entirely
    if (
      crudFilterObject.inputObject.value === undefined ||
      crudFilterObject.inputObject.value === null
    ) {
      return total
    }

    if (!total[fieldPath]) total[fieldPath] = {}

    let value

    const timeLanguageMatch =
      typeof crudFilterObject.inputObject.value === 'string' &&
      crudFilterObject.inputObject.value.match(/^__t:(.*)/)

    // if value matches __t:now(), parse the time language
    if (timeLanguageMatch) {
      value = parseTimeLanguage(timeLanguageMatch[1])
    } else if (
      (crudFilterObject.filterInputFieldDefinition.operator === 'in' ||
        crudFilterObject.filterInputFieldDefinition.operator === 'nin') &&
      Array.isArray(crudFilterObject.inputObject.value)
    ) {
      // if the operator is in/nin, need to properly map inputs into an array of ids
      value = crudFilterObject.inputObject.value.map((ele) =>
        typeof ele === 'string' ? ele : ele.id
      )
    } else if (isObject(crudFilterObject.inputObject.value)) {
      // if it's an object, fetch the id field
      value = crudFilterObject.inputObject.value.id
    } else {
      value = crudFilterObject.inputObject.value
    }

    // do final parseValue before passing to function
    total[fieldPath][crudFilterObject.filterInputFieldDefinition.operator] =
      crudFilterObject.inputObject.inputDefinition.parseValue
        ? crudFilterObject.inputObject.inputDefinition.parseValue(value)
        : value

    // always delete if n(in) an empty array, which would throw an API error
    if (
      crudFilterObject.filterInputFieldDefinition.operator === 'in' ||
      crudFilterObject.filterInputFieldDefinition.operator === 'nin'
    ) {
      const finalValue =
        total[fieldPath][crudFilterObject.filterInputFieldDefinition.operator]

      if (Array.isArray(finalValue) && !finalValue.length) {
        delete total[fieldPath][
          crudFilterObject.filterInputFieldDefinition.operator
        ]
      }
    }

    return total
  }, {})

  crudRawFilterObjects.reduce((total, rawFilterObject) => {
    const fieldPath = rawFilterObject.field

    if (!total[fieldPath]) total[fieldPath] = {}

    let value

    const timeLanguageMatch =
      typeof rawFilterObject.value === 'string' &&
      rawFilterObject.value.match(/^__t:(.*)/)

    // if value matches __t:now(), parse the time language
    if (timeLanguageMatch) {
      value = parseTimeLanguage(timeLanguageMatch[1])
    } else {
      value = rawFilterObject.value
    }

    total[fieldPath][rawFilterObject.operator] = value

    // always delete if n(in) an empty array, which would throw an API error
    if (
      rawFilterObject.operator === 'in' ||
      rawFilterObject.operator === 'nin'
    ) {
      const finalValue = total[fieldPath][rawFilterObject.operator]

      if (Array.isArray(finalValue) && !finalValue.length) {
        delete total[fieldPath][rawFilterObject.operator]
      }
    }

    return total
  }, filterByObject)

  return Object.keys(filterByObject).length > 0 ? [filterByObject] : []
}

export async function processInputObjectArray(
  that,
  inputObjectArray: CrudInputObject[]
) {
  const inputs = {}
  for (const inputObject of inputObjectArray) {
    // special case: if it's an entity + ['type-autocomplete-multiple', 'multiple-select'] inputType, use the fieldKey instead (no trailing '.id')
    const fieldPath =
      inputObject.inputDefinition.entity &&
      inputObject.inputDefinition.inputType &&
      ['type-autocomplete-multiple', 'multiple-select'].includes(
        inputObject.inputDefinition.inputType
      )
        ? inputObject.fieldKey
        : inputObject.fieldPath

    inputs[fieldPath] = await processInputObject(
      that,
      inputObject,
      inputObjectArray
    )
  }

  return inputs
}

export async function processInputObject(
  that,
  inputObject: CrudInputObject,
  inputObjectArray: CrudInputObject[]
) {
  let value

  if (inputObject.inputDefinition.inputType === 'value-array') {
    // if it is a value array, need to assemble the value as an array
    value = []
    for (const nestedInputElement of inputObject.nestedInputsArray) {
      // if the nestedInputElement is an object, extract the field from the element
      if (Array.isArray(nestedInputElement)) {
        const nestedInputs = await processInputObjectArray(
          that,
          nestedInputElement.map((ele) => ele.inputObject)
        )

        value.push(collapseObject(nestedInputs))
      } else {
        value.push(nestedInputElement.inputObject.value)
      }
    }
  } else {
    // if the fieldInfo.inputType === 'type-combobox', it came from a combo box. need to handle accordingly
    if (
      inputObject.inputDefinition.inputType === 'type-combobox' &&
      inputObject.inputDefinition.entity
    ) {
      // if value is string OR value is null and inputValue is string, create the object
      // first case happens if the user clicks away from the input before submitting
      // second case happens if the user does not click off first before submitting
      if (
        typeof inputObject.value === 'string' ||
        (inputObject.value === null &&
          typeof inputObject.inputValue === 'string')
      ) {
        // expecting either string or obj
        // create the item, get its id.
        const results = <any>await executeApiRequest(<any>{
          [`${inputObject.inputDefinition.entity.typename}Create`]: {
            id: true,
            name: true,
            __args: {
              name:
                typeof inputObject.value === 'string'
                  ? inputObject.value
                  : inputObject.inputValue,
              ...(inputObject.inputDefinition.getCreateArgs &&
                inputObject.inputDefinition.getCreateArgs(
                  that,
                  inputObjectArray
                )),
            },
          },
        })

        // force reload of memoized options, if any
        if (inputObject.inputDefinition.getOptions) {
          inputObject.inputDefinition
            .getOptions(that, true)
            .then((res) => (inputObject.options = res))
        }

        value = results.id
      } else if (inputObject.value === null) {
        value = inputObject.value
      } else {
        value = inputObject.value.id
      }
    } else if (
      inputObject.inputDefinition.inputType === 'type-autocomplete' ||
      inputObject.inputDefinition.inputType === 'type-autocomplete-multiple' ||
      inputObject.inputDefinition.inputType === 'select'
    ) {
      // as we are using return-object option, the entire object will be returned for autocompletes/selects, unless it is null or a number
      value = isObject(inputObject.value)
        ? inputObject.value.id
        : Number.isNaN(inputObject.value)
        ? null
        : inputObject.value
    } else {
      // trim input strings by default
      value =
        typeof inputObject.value === 'string'
          ? inputObject.value.trim()
          : inputObject.value
    }

    // convert '__null' to null
    if (value === '__null') value = null
  }

  return inputObject.inputDefinition.parseValue
    ? inputObject.inputDefinition.parseValue(value)
    : value
}

export function retryize(retryizedFn, maxAttempts = 3) {
  return <any>async function () {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        return await retryizedFn(...arguments)
      } catch (err) {
        // reached max number of tries, throw the err
        if (i + 1 === maxAttempts) {
          throw err
        }
      }
    }
  }
}

export function memoize(memoizedFn) {
  const cache = {}

  return function () {
    // first arg is always gonna be that, so we will exclude it
    // 2nd arg is forceReload
    const [that, forceReload, ...otherArgs] = arguments
    const args = JSON.stringify(otherArgs)
    cache[args] = forceReload
      ? memoizedFn(that, false, ...otherArgs)
      : cache[args] || memoizedFn(that, false, ...otherArgs)
    return cache[args]
  }
}

export function generateMemoizedEntityGetter(
  entity: EntityDefinition,
  additionalFields?: string[]
) {
  return <any>memoize(function (
    that,
    _forceReload,
    {
      filterBy = [],
      sortBy = [],
    }: {
      filterBy?: any[]
      sortBy?: any[]
    } = {}
  ) {
    const validatedFields = <string[]>(
      [
        'id',
        '__typename',
        ...(additionalFields ?? []),
        entity.nameField,
        entity.avatarField,
      ].filter((e) => e)
    )
    return collectPaginatorData(
      `${entity.typename}GetPaginator`,
      validatedFields.reduce((total, field) => {
        total[field] = true
        return total
      }, {}),
      {
        filterBy,
        sortBy,
      }
    )
  })
}

export function generateMemoizedEnumGetter(operation: keyof Root) {
  return <any>memoize(async function (that, _forceReload) {
    return executeApiRequest<any>({
      [operation]: {
        values: true,
      },
    }).then((data: any) => data.values)
  })
}

export function userHasPermissions(that, requiredPermissions: string[]) {
  if (!that.$store.getters['auth/user']) {
    return false
  }

  // if user has * permissions, automatically allow
  if (that.$store.getters['auth/user'].allPermissions.includes('*/*'))
    return true

  return requiredPermissions.every((permission) =>
    that.$store.getters['auth/user'].allPermissions.includes(permission)
  )
}

export function userHasRole(that, role: string) {
  if (!that.$store.getters['auth/user']) {
    return false
  }

  return that.$store.getters['auth/user'].role === role
}

export function loadTypeSearchResults(that, inputObject: CrudInputObject) {
  // if no typename, abort
  if (!inputObject.inputDefinition.entity) {
    throw new Error('Entity required for type-search')
  }

  const entity = inputObject.inputDefinition.entity

  // if no nameField, abort
  if (!entity.nameField) {
    throw new Error('NameField required for type-search')
  }

  return executeApiRequest(<any>{
    [`${entity.typename}GetPaginator`]: {
      edges: {
        node: {
          id: true,
          [entity.nameField]: true,
          ...(entity.avatarField && {
            [entity.avatarField]: true,
          }),
        },
      },
      __args: {
        first: 20,
        search: {
          query: inputObject.inputValue?.trim(), // trim spaces
          params: inputObject.inputDefinition.searchParams?.(
            that,
            that.allItems
          ),
        },
        filterBy: [],
        sortBy: [],
        ...inputObject.inputDefinition.lookupParams?.(that, that.allItems),
      },
    },
  }).then((results: any) => results.edges.map((edge) => edge.node))
}

export function generateShareUrl(
  that,
  {
    routeKey,
    id,
    showComments,
    miniMode,
    expandKey,
  }: {
    routeKey: string
    id: string
    showComments?: boolean
    miniMode?: boolean
    expandKey?: string
  }
) {
  return (
    window.location.origin +
    generateViewRecordRoute(that, {
      routeObject: {
        routeKey,
        routeType: 'public',
      },
      id,
      showComments,
      miniMode,
      expandKey,
    })
  )
}

// 2_5,5_10,10_15
export function parseDiscountScheme(discountScheme: string | null | undefined) {
  if (!discountScheme) return []

  const parts = discountScheme.split(',')

  return parts.map((part) => {
    const subPart = part.split('_')
    return {
      quantity: Number(subPart[0]),
      discount: Number(subPart[1]),
    }
  })
}

export function getPriceObjectFromDiscountScheme({
  discountScheme,
  quantity,
  unitPrice,
}: {
  discountScheme?: string | null | undefined
  quantity: number
  unitPrice: number
}): PriceObject {
  const discountSchemeArray = parseDiscountScheme(discountScheme)

  const fullPrice = unitPrice * quantity

  for (const ele of discountSchemeArray.reverse()) {
    if (quantity >= ele.quantity) {
      return {
        price: fullPrice,
        discount: Math.round(100 * fullPrice * (ele.discount / 100)) / 100,
        discountPercent: ele.discount,
        quantity,
      }
    }
  }

  // if still not returned, just return the price * quantity
  return {
    price: fullPrice,
    quantity,
  }
}

export function redirectToLogin(that, redirectPath?: string) {
  that.$store.commit('auth/setRedirectPath', redirectPath ?? null)
  that.$router.push('/login')
}

export function camelCaseToCapitalizedString(camelCaseString: string) {
  // Add a space before each uppercase letter and convert all letters to lowercase
  // also ignore any trailing ".id"
  // if it is nested, fetch the last element only (after removing the .id)
  const spacedString = camelCaseString
    .replace(/\.id$/, '')
    .split('.')
    .pop()!
    .replace(/([a-z])([A-Z])/g, '$1 $2')

  // Split the string into words, capitalize the first letter of each word, and join them back
  const capitalizedString = spacedString
    .split(' ') // Split the string into an array of words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(' ') // Join the words back into a single string

  return capitalizedString
}

export function enterRoute(that, route: string, openInNew = false) {
  if (!route) return

  if (openInNew) {
    window.open(route, '_blank')
  } else {
    that.$router.push(route)
  }
}

export function getFieldPath({
  fieldKey,
  inputDefinition,
}: {
  fieldKey: string
  inputDefinition: InputDefinition
}) {
  // if it's an entity type, append the "id" part (unless it's a 'multiple' type)
  return inputDefinition.entity ? `${fieldKey}.id` : fieldKey
}

// initializes an inputObject
export function generateInputObject(
  that,
  inputFieldDefinition: InputFieldDefinition | FilterInputFieldDefinition,
  overrideProperties?: Partial<CrudInputObject>
) {
  // inputFieldDefinition.inputDefinition should be defined by this point
  if (!inputFieldDefinition.inputDefinition) {
    throw new Error(
      `inputDefinition for fieldKey: '${inputFieldDefinition.fieldKey}' not defined`
    )
  }

  const fieldPath = getFieldPath({
    fieldKey: inputFieldDefinition.fieldKey,
    inputDefinition: inputFieldDefinition.inputDefinition,
  })

  const inputObject: CrudInputObject = {
    fieldKey: inputFieldDefinition.fieldKey,
    fieldPath,
    // if text in inputFieldDefinition, it is FilterInputFieldDefinition
    label:
      ('text' in inputFieldDefinition ? inputFieldDefinition.text : null) ??
      inputFieldDefinition.inputDefinition.text ??
      camelCaseToCapitalizedString(inputFieldDefinition.fieldKey),
    closeable: false,
    inputDefinition: inputFieldDefinition.inputDefinition,
    value: null,
    inputValue: null,
    secondaryInputValue: null,
    handleFileAdded: inputFieldDefinition.handleFileAdded,
    options: [],
    readonly: false,
    hidden: false,
    loading: false,
    focused: false,
    cols: inputFieldDefinition.cols,
    generation: 0,
    parentInput: null,
    nestedInputsArray: [],
    inputData: null,
    hideIf: inputFieldDefinition.hideIf,
    watch: inputFieldDefinition.watch,
    ...overrideProperties,
  }

  return inputObject
}

export function calculateFinalPrice(priceObject: PriceObject) {
  return (
    priceObject.price - (priceObject.discount ?? 0) + (priceObject.fees ?? 0)
  )
}
