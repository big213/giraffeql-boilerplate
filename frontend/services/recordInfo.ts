import { InputFieldDefinition, InputType, NestedOptions } from '~/types'

export function generateKeyValueArrayField({
  fieldname,
  text,
  fieldOptions = {},
}: {
  fieldname: string
  text: string
  fieldOptions?: Omit<InputFieldDefinition, 'text'>
}) {
  return {
    [fieldname]: {
      text,
      fields: [`${fieldname}`, `${fieldname}.key`, `${fieldname}.value`],
      inputOptions: {
        inputType: 'value-array',
        nestedOptions: {
          fields: [
            {
              key: 'key',
              text: 'Key',
              inputOptions: {
                inputType: 'text',
                cols: 6,
              },
            },
            {
              key: 'value',
              text: 'Value',
              inputOptions: {
                inputType: 'text',
                cols: 6,
              },
            },
          ],
        },
      },
      // filter out empty keys
      parseValue: (val) => {
        if (!Array.isArray(val)) throw new Error('Array expected')

        return val.filter((ele) => ele.key)
      },
      ...fieldOptions,
    },
  }
}

export function generateSimpleValueArrayField({
  fieldname,
  text,
  fieldOptions = {},
}: {
  fieldname: string
  text: string
  fieldOptions?: Omit<InputFieldDefinition, 'text'>
}) {
  return {
    [fieldname]: {
      text,
      inputOptions: {
        inputType: 'value-array',
        nestedOptions: {
          fields: [
            {
              key: 'value',
              text: 'Value',
              inputOptions: {
                inputType: 'text',
              },
            },
          ],
        },
      },
      parseValue: (val) => {
        if (!Array.isArray(val)) return []

        return val.map((ele) => ele.value)
      },
      serialize: (val) => {
        return val.map((ele) => ({ value: ele }))
      },
      ...fieldOptions,
    },
  }
}

export function generateValueArrayField({
  fieldname,
  text,
  nestedOptions,
  fieldOptions = {},
}: {
  fieldname: string
  text: string
  nestedOptions: NestedOptions
  fieldOptions?: Omit<InputFieldDefinition, 'text'>
}) {
  return {
    text,
    fields: [fieldname].concat(
      nestedOptions.fields.map(
        (nestedField) => `${fieldname}.${nestedField.key}`
      )
    ),
    ...fieldOptions,
    inputOptions: {
      ...fieldOptions.inputOptions,
      inputType: 'value-array' as InputType,
      nestedOptions,
    },
  }
}
