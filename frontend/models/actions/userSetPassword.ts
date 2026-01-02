import { generateJoinableInputField } from '~/services/view'
import { ActionDefinition } from '~/types/action'
import { UserEntity } from '../entities'

export const userSetPassword: ActionDefinition = {
  routeKey: 'userSetPassword',
  operationName: 'userSetPassword',
  title: 'Set Password',
  icon: 'mdi-asterisk',
  fields: [
    {
      fieldKey: 'item',
      inputDefinition: generateJoinableInputField({
        entity: UserEntity,
      }),
      hideIfLocked: true,
    },
    {
      fieldKey: 'password',
      inputDefinition: {},
    },
  ],

  getLockedFields: (that, item) => {
    return {
      item: item.id,
    }
  },

  onSuccess: (that, item) => {
    that.$root.$emit('showSnackbar', {
      message: `Password successfuly set`,
      color: 'success',
    })
  },
}
