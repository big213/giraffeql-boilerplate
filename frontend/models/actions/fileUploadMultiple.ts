import { generateFilesInputColumn } from '~/services/view'
import { ActionDefinition } from '~/types/action'

export const fileUploadMultiple: ActionDefinition = {
  routeKey: 'fileUploadMultiple',
  title: 'File Upload Multiple',
  icon: 'mdi-upload-multiple',
  fields: [
    {
      fieldKey: 'files',
      inputDefinition: generateFilesInputColumn(),
      handleFileAdded(that, inputsArray, inputObject, fileRecord) {},
    },
  ],

  onSubmit: (that, item, args) => {
    // do nothing (to go to onSuccess logic)
  },
  submitButtonText: 'Done',

  onSuccess: (that, item) => {
    that.$root.$emit('refresh-interface', 'file')
  },
}
