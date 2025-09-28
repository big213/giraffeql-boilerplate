import { ActionDefinition } from '~/types/action'

export const deferredActionExecute: ActionDefinition = {
  routeKey: 'deferredActionExecute',
  operationName: 'deferredActionExecute',
  title: 'Execute Deferred Action',
  icon: 'mdi-code-tags',
  fields: [
    {
      fieldKey: 'code',
      inputDefinition: {
        text: 'Code',
      },
    },
  ],
  getReturnQuery: (_that, _item) => {
    return {
      id: true,
      successMessage: true,
    }
  },
  onSuccess: (that, item, returnData) => {
    that.$root.$emit('showSnackbar', {
      message: `${returnData.successMessage}`,
      color: 'success',
    })
  },
}
