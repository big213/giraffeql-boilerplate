import { ActionDefinition } from '~/types/action'
import { getActionTypeEnumValues } from '~/services/dropdown'

export const actionExecute: ActionDefinition = {
  routeKey: 'actionExecute',
  operationName: 'actionExecute',
  title: 'Execute Action',
  icon: 'mdi-code-tags',
  persistent: true,

  fields: [
    {
      fieldKey: 'type',
      inputDefinition: {
        inputType: 'select',
        getOptions: getActionTypeEnumValues,
      },
    },
    {
      fieldKey: 'params',
      inputDefinition: {
        inputType: 'value-array',
        arrayOptions: {
          type: [
            {
              fieldKey: 'key',
              cols: 6,
              inputDefinition: {},
            },
            {
              fieldKey: 'value',
              cols: 6,
              inputDefinition: {},
            },
          ],
        },
        getInitialValue: () => [null],
        parseValue: (val) => {
          // convert into a JSON object
          if (!Array.isArray(val)) return {}

          return val.reduce((total, ele) => {
            if (ele.key) {
              total[ele.key] = ele.value
            }

            return total
          }, {})
        },
      },
    },
  ],

  onSuccess: (that, item, returnData) => {
    that.$root.$emit('showSnackbar', {
      message: `Action succeeded. Data: ${JSON.stringify(returnData)}`,
      color: 'success',
    })
  },
}
