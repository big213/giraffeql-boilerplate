import { ActionDefinition } from '~/types/action'

export const executeDeferredAction: ActionDefinition = {
  title: 'Execute Deferred Action',
  icon: 'mdi-code-tags',
  operationName: 'executeDeferredAction',
  inputFields: [
    {
      fieldPath: 'code',
      definition: {
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
  onSuccess: (that, item) => {
    that.$notifier.showSnackbar({
      message: `${item.successMessage}`,
      variant: 'success',
    })
  },
}
