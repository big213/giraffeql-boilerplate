import { format } from 'timeago.js'
import { convertArrayToCSV } from 'convert-array-to-csv'
import { executeGiraffeql } from '~/services/giraffeql'
import * as models from '~/models/base'
import { CrudInputObject } from '~/types/misc'

type StringKeyObject = { [x: string]: any }

export function getIcon(typename: string | undefined) {
  return typename ? models[capitalizeString(typename)]?.icon ?? null : null
}

export function generateTimeAgoString(unixTimestamp: number | null) {
  if (!unixTimestamp) return null

  return format(unixTimestamp * 1000)
}

// unix timestamp (seconds) to YYYY-MM-DD HH:MM:SS
export function generateDateLocaleString(unixTimestamp: number | null) {
  if (!unixTimestamp) return null

  const dateObject = new Date(unixTimestamp * 1000)

  return `${dateObject.getFullYear()}-${String(
    dateObject.getMonth() + 1
  ).padStart(2, '0')}-${String(dateObject.getDate()).padStart(
    2,
    '0'
  )} ${dateObject.toLocaleTimeString()}`
}

// YYYY-MM-DD HH:MM(:SS). If only YYYY-MM-DD is provided, will automatically append the current HH:MM:SS.
// this should be IE and safari safe
export function generateParseDateTimeStringFn(
  defaultTo: 'currentTime' | 'startOfDay' | 'endOfDay' = 'startOfDay'
) {
  return function parseDateTimeString(val: string): number | null {
    // if falsey, default to null
    if (!val) return null

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
    if (dateParts[dateParts.length - 1] === 'AM') hours = 0

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

    // date cannot be to far in the future
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
  currentValue[finalField] = serializeFn(currentValue[finalField])
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

export function openLink(url: string): void {
  window.open(url)
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

export function generateCrudRecordRoute(
  that,
  {
    typename,
    routeType,
    queryParams,
    pageOptions,
  }: {
    typename: string
    routeType: 'i' | 'a' | 'my' | 's'
    queryParams?: any
    pageOptions?: any
  }
) {
  return that.$router.resolve({
    path: `/${routeType}/${camelToKebabCase(typename)}`,
    query: {
      ...queryParams,
      ...(pageOptions && {
        pageOptions: encodeURIComponent(btoa(JSON.stringify(pageOptions))),
      }),
    },
  }).href
}

export function generateViewRecordRoute(
  that,
  {
    typename,
    routeType,
    queryParams,
    id,
    expand = 0,
  }: {
    typename: string
    routeType: 'i' | 'a' | 'my' | 's'
    queryParams?: any
    id: string
    expand?: number
  }
) {
  return that.$router.resolve({
    path: `/${routeType}/view/${camelToKebabCase(typename)}`,
    query: {
      id,
      expand,
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

export function getInputValue(inputObjectsArray, key) {
  const inputObject = inputObjectsArray.find((ele) => ele.fieldKey === key)
  if (!inputObject) throw new Error(`Input key not found: '${key}'`)
  return inputObject.value
}

export function getInputObject(inputObjectsArray, key) {
  const inputObject = inputObjectsArray.find((ele) => ele.fieldKey === key)
  if (!inputObject) throw new Error(`Input key not found: '${key}'`)
  return inputObject
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
    for (let j = 0; j < headers.length; j++) {
      o[headers[j]] = ret[k][j]
      if (ret[k][j] === undefined) hasUndefined = true
    }
    // not pushing rows where at least one column is undefined
    if (!hasUndefined) objArray.push(o)
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
  inputObject: CrudInputObject,
  loadOptions = true
) {
  const promisesArray: Promise<any>[] = []
  if (inputObject.inputType === 'value-array') {
    // if it is a value-array, recursively process the nestedValueArray
    inputObject.nestedInputsArray.forEach((nestedInputArray) => {
      nestedInputArray.forEach((nestedInputObject) => {
        promisesArray.push(
          ...populateInputObject(that, nestedInputObject.inputObject)
        )
      })
    })
  } else {
    if (loadOptions && inputObject.getOptions) {
      promisesArray.push(
        inputObject.getOptions(that).then((res) => {
          // set the options
          inputObject.options = res

          // if autocomplete, attempt to translate the inputObject.value based on the options
          if (inputObject.inputType === 'autocomplete') {
            inputObject.value = inputObject.options.find(
              (ele) => ele.id === inputObject.value
            )
          }
        })
      )
    }

    // if no getOptions and has a typename, populate the options/value with the specific entry
    if (inputObject.inputOptions?.typename && !inputObject.getOptions) {
      const originalFieldValue = inputObject.value
      inputObject.value = null // set this to null initially while the results load, to prevent console error

      if (originalFieldValue && originalFieldValue !== '__undefined') {
        promisesArray.push(
          executeGiraffeql(that, <any>{
            [`get${capitalizeString(inputObject.inputOptions?.typename)}`]: {
              id: true,
              name: true,
              ...(inputObject.inputOptions?.hasAvatar && {
                avatar: true,
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

export function processQuery(
  that,
  recordInfo,
  fields: string[],
  firstFieldOnly = false
) {
  // create a map field -> serializeFn for fast serialization
  const serializeMap = new Map()

  return {
    serializeMap,
    query: {
      ...collapseObject(
        fields.reduce(
          (total, field) => {
            const fieldInfo = lookupFieldInfo(recordInfo, field)

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
            fieldsToAdd.forEach((field) => {
              total[field] = true

              // add a serializer if there is one for the field
              const currentFieldInfo = recordInfo.fields[field]
              if (currentFieldInfo) {
                if (currentFieldInfo.serialize) {
                  serializeMap.set(field, currentFieldInfo.serialize)
                }

                // if field has args, process them
                if (currentFieldInfo.args) {
                  total[currentFieldInfo.args.path + '.__args'] =
                    currentFieldInfo.args.getArgs(that)
                }
              }
            })

            // if main fieldInfo has args, process them
            if (fieldInfo.args) {
              total[fieldInfo.args.path + '.__args'] =
                fieldInfo.args.getArgs(that)
            }

            return total
          },
          { id: true, __typename: true } // always add id and typename
        )
      ),
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
