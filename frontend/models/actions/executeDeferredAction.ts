import { ActionOptions } from '~/types'

export const executeDeferredAction: ActionOptions = {
  operationName: 'executeDeferredAction',
  title: 'Execute Deferred Action',
  icon: 'mdi-code-tags',
  inputs: [
    {
      field: 'code',
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
