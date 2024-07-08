import { format } from 'timeago.js'
import { convertArrayToCSV } from 'convert-array-to-csv'
import { executeGiraffeql } from '~/services/giraffeql'
import * as models from '~/models/base'
import { CrudInputObject, CrudRawFilterObject } from '~/types/misc'
import { Root } from '../../schema'
import { PriceObject } from '~/types'

type StringKeyObject = { [x: string]: any }

export function getIcon(typename: string | undefined) {
  return typename ? models[capitalizeString(typename)]?.icon ?? null : null
}

export function formatAsCurrency(input: number | null) {
  const validatedInput = input ?? 0

  return validatedInput < 0
    ? `-$${(validatedInput * -1).toFixed(2)}`
    : `$${validatedInput.toFixed(2)}`
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
  that.$notifier.showSnackbar({
    message: 'Copied to Clipboard',
    variant: 'success',
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
  let currentValue = obj
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

export function collapseObject(obj: StringKeyObject): StringKeyObject | null {
  const returnObject = {}
  const nestedFieldsSet: Set<string> = new Set()

  for (const field in obj) {
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
    that.$notifier.showSnackbar({
      message: 'File download started',
      variant: 'success',
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
    if (err.response && err.response.data.error.message) {
      that.$notifier.showSnackbar({
        message: `${
          err.response.data.error.message
        } at [${err.response.data.error.fieldPath
          .filter((ele) => ele !== '__args')
          .join('-')}]`,
        variant: 'error',
        copyableMessage: JSON.stringify(
          {
            ...err.response.data.error,
            payload: err.response.config.data,
            build: getBuildVersion(),
            apiVersion: err.response.headers['x-api-version'],
          },
          null,
          2
        ),
      })
      console.log(err.response.data.error)
    } else {
      // error thrown on client side
      that.$notifier.showSnackbar({
        message: err.message,
        variant: 'error',
        copyableMessage: JSON.stringify(
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

export function generateNavRouteObject(
  that,
  {
    recordInfo,
    path,
    pageOptions,
  }: {
    recordInfo: any
    path?: string
    pageOptions?: any
  }
) {
  return {
    icon: recordInfo.icon,
    title: recordInfo.title ?? recordInfo.pluralName,
    to: generateCrudRecordRoute(that, {
      path,
      typename: recordInfo.typename,
      routeType: recordInfo.routeType,
      pageOptions:
        pageOptions === null
          ? null
          : {
              search: '',
              filters: [],
              sort: {
                field: 'updatedAt',
                desc: true,
              },
              ...pageOptions,
            },
    }),
  }
}

export function generateCrudRecordRoute(
  that,
  {
    path,
    typename,
    routeType,
    queryParams,
    pageOptions,
  }: {
    path?: string
    typename?: string
    routeType?: string
    queryParams?: any
    pageOptions?: any
  }
) {
  // either path or typename/routeType required
  if (!path && !(typename && routeType)) {
    throw new Error('One of path or typename/routeType required')
  }

  return that.$router.resolve({
    path: path ?? `/${routeType!}/${camelToKebabCase(typename!)}`,
    query: {
      ...queryParams,
      ...(pageOptions && {
        pageOptions: encodeURIComponent(btoa(JSON.stringify(pageOptions))),
      }),
    },
  }).href
}

// either path or routeKey/routeType required
export function generateViewRecordRoute(
  that,
  {
    path,
    routeKey,
    routeType,
    queryParams,
    id,
    expandKey,
    miniMode,
    showComments = false,
  }: {
    path?: string
    routeKey?: string
    routeType?: string
    queryParams?: any
    id?: string
    expandKey?: string | null
    miniMode?: boolean
    showComments?: boolean
  }
) {
  // either path or typename/routeType required
  if (!path && !(routeKey && routeType)) {
    throw new Error('One of path or typename/routeType required')
  }

  return that.$router.resolve({
    path: path ?? `/${routeType!}/view/${camelToKebabCase(routeKey!)}`,
    query: {
      id,
      e: expandKey,
      c: showComments ? null : undefined,
      m: miniMode ? '1' : undefined,
      ...queryParams,
    },
  }).href
}

export function enterRoute(that, route: string, openInNew = false) {
  if (!route) return

  if (openInNew) {
    window.open(route, '_blank')
  } else {
    that.$router.push(route)
  }
}

export function getPaginatorData(that, operation, query, args) {
  return executeGiraffeql(that, <any>{
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
  that,
  operation,
  query,
  args = {},
  fetchRows = 100
) {
  let afterCursor: string | undefined

  const allResults: any[] = []

  let hasMore = true
  while (hasMore) {
    const data = <any>await getPaginatorData(that, operation, query, {
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
  const headers = ret[0]
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

export function lookupFieldInfo(recordInfo, field: string) {
  const fieldInfo = recordInfo.fields[field]

  // field unknown, abort
  if (!fieldInfo)
    throw new Error(`Unknown field on ${recordInfo.typename}: '${field}'`)

  return fieldInfo
}

export function populateInputObject(
  that,
  {
    inputObject,
    selectedItem,
    item,
    loadOptions = true,
  }: {
    inputObject: CrudInputObject
    selectedItem: any | undefined
    item: any | undefined
    loadOptions?: boolean
  }
) {
  const promisesArray: Promise<any>[] = []
  if (inputObject.inputType === 'value-array') {
    // if it is a value-array, recursively process the nestedValueArray
    inputObject.nestedInputsArray.forEach((nestedInputArray) => {
      nestedInputArray.forEach((nestedInputObject) => {
        promisesArray.push(
          ...populateInputObject(that, {
            inputObject: nestedInputObject.inputObject,
            selectedItem,
            item,
            loadOptions,
          })
        )
      })
    })
  } else {
    // for stripe-pi, need to fetch the stripeAccount and clientSecret
    if (
      inputObject.inputType === 'stripe-pi' ||
      inputObject.inputType === 'stripe-pi-editable'
    ) {
      if (!inputObject.inputOptions?.paymentOptions) {
        throw new Error(`Stripe payments misconfigured`)
      }

      const initialQuantity =
        inputObject.inputOptions.paymentOptions.quantityOptions?.default?.()

      const initialPriceObject =
        inputObject.inputOptions.paymentOptions.getPriceObject?.(
          that,
          item,
          initialQuantity,
          inputObject.inputOptions.paymentOptions.quantityOptions?.getDiscountScheme?.(
            that,
            item
          )
        )

      const finalPrice =
        initialPriceObject.price - (initialPriceObject.discount ?? 0)

      promisesArray.push(
        inputObject.inputOptions.paymentOptions
          .getPaymentIntent(
            that,
            inputObject,
            selectedItem,
            initialQuantity,
            finalPrice
          )
          .then((res) => (inputObject.inputData = res))
      )

      // also set the initial value
      inputObject.inputValue = finalPrice

      inputObject.secondaryInputValue = initialQuantity
    }

    if (loadOptions && inputObject.getOptions) {
      inputObject.loading = true
      promisesArray.push(
        inputObject.getOptions(that).then((res) => {
          // set the options
          inputObject.options = res

          // if autocomplete or combobox, attempt to translate the inputObject.value based on the options
          if (
            inputObject.inputType === 'autocomplete' ||
            inputObject.inputType === 'combobox'
          ) {
            inputObject.value =
              inputObject.options.find((ele) => ele.id === inputObject.value) ??
              null
          }

          inputObject.loading = false
        })
      )
    }

    // if no getOptions and has a typename, populate the options/value with the specific entry
    if (inputObject.inputOptions?.typename && !inputObject.getOptions) {
      const originalFieldValue = inputObject.value
      inputObject.value = null // set this to null initially while the results load, to prevent console error

      // if input is both hidden AND readonly, must be due to locked and hidden input. Can safely skip the lookup
      if (inputObject.hidden && inputObject.readonly) {
        inputObject.value = {
          id: originalFieldValue,
        }
      } else {
        if (originalFieldValue && originalFieldValue !== '__undefined') {
          promisesArray.push(
            executeGiraffeql(that, <any>{
              [`get${capitalizeString(inputObject.inputOptions?.typename)}`]: {
                id: true,
                name: true,
                ...(inputObject.inputOptions?.hasAvatar && {
                  avatarUrl: true,
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
  parentInputObject,
  inputValue: any = null
) {
  parentInputObject.nestedInputsArray.push(
    parentInputObject.inputOptions.nestedFields.map((nestedFieldInfo) => {
      return {
        nestedFieldInfo,
        inputObject: {
          fieldInfo: nestedFieldInfo,
          hint: nestedFieldInfo.hint,
          clearable: true,
          closeable: false,
          optional: nestedFieldInfo.optional,
          inputRules: nestedFieldInfo.inputRules,
          label: nestedFieldInfo.text ?? nestedFieldInfo.key,
          inputType: nestedFieldInfo.inputType,
          inputOptions: nestedFieldInfo.inputOptions,
          value: (inputValue ? inputValue[nestedFieldInfo.key] : null) ?? null,
          getOptions: nestedFieldInfo.getOptions,
          options: [],
          cols: nestedFieldInfo.inputOptions?.cols,
          nestedInputsArray: [],
        },
      }
    })
  )
}

export async function processQuery(
  that,
  recordInfo,
  fields: string[],
  firstFieldOnly = false
) {
  // create a map field -> serializeFn for fast serialization
  const serializeMap = new Map()

  // build the query async
  const query = { id: true, __typename: true }
  for (const field of fields) {
    // skip if key is __typename
    if (field === '__typename') continue

    const fieldInfo = lookupFieldInfo(recordInfo, field)

    // skip if args.loadIf provided and it returns false
    if (fieldInfo.args?.loadIf && !fieldInfo.args.loadIf(that)) {
      continue
    }

    const fieldsToAdd: Set<string> = new Set()

    // in export mode, generally will only be fetching the first field
    if (fieldInfo.fields) {
      if (firstFieldOnly) {
        fieldsToAdd.add(fieldInfo.fields[0])
      } else {
        fieldInfo.fields.forEach((field) => fieldsToAdd.add(field))
      }
    } else {
      fieldsToAdd.add(field)
    }

    // process fields
    fieldsToAdd.forEach(async (field) => {
      const currentFieldInfo = recordInfo.fields[field]

      // add a serializer if there is one for the field
      if (currentFieldInfo) {
        // skip if args.loadIf provided and it returns false
        if (
          currentFieldInfo.args?.loadIf &&
          !currentFieldInfo.args.loadIf(that)
        ) {
          return
        }

        if (currentFieldInfo.serialize) {
          serializeMap.set(field, currentFieldInfo.serialize)
        }

        // if field has args, process them
        if (
          currentFieldInfo.args &&
          (!currentFieldInfo.args.loadIf || currentFieldInfo.args.loadIf(that))
        ) {
          query[`${currentFieldInfo.args.path}.__args`] =
            await currentFieldInfo.args.getArgs(that)
        }
      }

      query[field] = true
    })

    // if main fieldInfo has args and passes loadIf, process them
    if (
      fieldInfo.args &&
      (!fieldInfo.args.loadIf || fieldInfo.args.loadIf(that))
    ) {
      query[`${fieldInfo.args.path}.__args`] = await fieldInfo.args.getArgs(
        that
      )
    }
  }

  return {
    serializeMap,
    query: {
      ...collapseObject(query),
    },
  }
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
  crudFilterObjects: CrudRawFilterObject[],
  recordInfo: any
) {
  const filterByObject = crudFilterObjects.reduce((total, rawFilterObject) => {
    const fieldInfo = lookupFieldInfo(recordInfo, rawFilterObject.field)

    const primaryField = fieldInfo.fields
      ? fieldInfo.fields[0]
      : rawFilterObject.field

    if (!total[primaryField]) total[primaryField] = {}

    // if value is '__undefined', exclude it entirely
    if (rawFilterObject.value === '__undefined') return total

    let value

    const timeLanguageMatch =
      typeof rawFilterObject.value === 'string' &&
      rawFilterObject.value.match(/^__t:(.*)/)

    // if value matches __t:now(), parse the time language
    if (timeLanguageMatch) {
      if (timeLanguageMatch) {
        value = parseTimeLanguage(timeLanguageMatch[1])
      }
    } else if (rawFilterObject.value === '__null') {
      // parse '__null' to null
      value = null
    } else {
      value = rawFilterObject.value
    }

    // apply parseValue function, if any
    total[primaryField][rawFilterObject.operator] = fieldInfo.parseValue
      ? fieldInfo.parseValue(value)
      : value

    // always delete if n(in) an empty array, which would throw an API error
    if (
      rawFilterObject.operator === 'in' ||
      rawFilterObject.operator === 'nin'
    ) {
      const finalValue = total[primaryField][rawFilterObject.operator]

      if (Array.isArray(finalValue) && !finalValue.length) {
        delete total[primaryField][rawFilterObject.operator]
      }
    }

    return total
  }, {})

  return Object.keys(filterByObject).length > 0 ? [filterByObject] : []
}

export async function processInputObject(that, inputObject, inputObjectArray) {
  let value

  if (inputObject.inputType === 'value-array') {
    // if it is a value array, need to assemble the value as an array
    value = []
    for (const nestedInputArray of inputObject.nestedInputsArray) {
      const obj = {}
      for (const nestedInputObject of nestedInputArray) {
        obj[nestedInputObject.nestedFieldInfo.key] = await processInputObject(
          that,
          nestedInputObject.inputObject,
          inputObjectArray
        )
      }
      value.push(obj)
    }
  } else {
    // if the fieldInfo.inputType === 'combobox' | 'server-combobox', it came from a combo box. need to handle accordingly
    if (
      (inputObject.inputType === 'combobox' ||
        inputObject.inputType === 'server-combobox') &&
      inputObject.inputOptions?.typename
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
        const results = <any>await executeGiraffeql(null, <any>{
          ['create' + capitalizeString(inputObject.inputOptions.typename)]: {
            id: true,
            name: true,
            __args: {
              name:
                typeof inputObject.value === 'string'
                  ? inputObject.value
                  : inputObject.inputValue,
              ...(inputObject.inputOptions.getCreateArgs &&
                inputObject.inputOptions.getCreateArgs(that, inputObjectArray)),
            },
          },
        })

        // force reload of memoized options, if any
        inputObject.getOptions &&
          inputObject
            .getOptions(that, true)
            .then((res) => (inputObject.options = res))

        value = results.id
      } else if (inputObject.value === null) {
        value = inputObject.value
      } else {
        value = inputObject.value.id
      }
    } else if (
      inputObject.inputType === 'autocomplete' ||
      inputObject.inputType === 'server-autocomplete' ||
      inputObject.inputType === 'select'
    ) {
      // as we are using return-object option, the entire object will be returned for autocompletes/selects, unless it is null or a number
      value = isObject(inputObject.value)
        ? inputObject.value.id
        : Number.isNaN(inputObject.value)
        ? null
        : inputObject.value
    } else {
      value = inputObject.value
    }

    // convert '__null' to null
    if (value === '__null') value = null
  }

  return inputObject.fieldInfo?.parseValue
    ? inputObject.fieldInfo.parseValue(value)
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
    const [that, forceReload, ...otherArgs] = arguments
    const args = JSON.stringify(otherArgs)
    cache[args] = forceReload
      ? memoizedFn(that, false, ...otherArgs)
      : cache[args] || memoizedFn(that, false, ...otherArgs)
    return cache[args]
  }
}

export function generateMemoizedGetter(operation: string, fields: string[]) {
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
}

export function generateMemoizedEnumGetter(operation: keyof Root) {
  return <any>memoize(async function (that, _forceReload) {
    return executeGiraffeql<any>(that, {
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

  // if user has A_A permissions, automatically allow
  if (that.$store.getters['auth/user'].allPermissions.includes('A_A'))
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

export function loadTypeSearchResults(that, inputObject) {
  return executeGiraffeql(that, <any>{
    [`get${capitalizeString(inputObject.inputOptions.typename)}Paginator`]: {
      edges: {
        node: {
          id: true,
          name: true,
          ...(inputObject.inputOptions?.hasAvatar && {
            avatarUrl: true,
          }),
        },
      },
      __args: {
        first: 20,
        search: {
          query: inputObject.inputValue,
          params: inputObject.fieldInfo.inputOptions?.searchParams?.(
            that,
            that.allItems
          ),
        },
        filterBy: [],
        sortBy: [],
        ...inputObject.fieldInfo.inputOptions?.lookupParams?.(
          that,
          that.allItems
        ),
      },
    },
  }).then((results: any) => results.edges.map((edge) => edge.node))
}

export function generateShareUrl(
  that,
  {
    routeKey,
    routeType = 'i',
    id,
    showComments,
    miniMode,
  }: {
    routeKey: string
    routeType?: string
    id: string
    showComments?: boolean
    miniMode?: boolean
  }
) {
  return (
    window.location.origin +
    generateViewRecordRoute(that, {
      routeKey,
      routeType,
      id,
      showComments,
      miniMode,
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
