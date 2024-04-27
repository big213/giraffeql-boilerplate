export default {
  props: {
    item: {
      type: Object,
      required: true,
    },
    // could have dot notation for nested properties
    recordInfo: {
      type: Object,
    },

    // must be view or pagination
    mode: {
      type: String,
      validator: (value) => {
        return ['view', 'pagination'].includes(value)
      },
      default: () => 'view',
    },
  },

  computed: {
    previewImageUrl() {
      const getPreviewImage =
        this.recordInfo[
          this.mode === 'view' ? 'viewOptions' : 'paginationOptions'
        ]?.heroOptions?.getPreviewImage

      return getPreviewImage ? getPreviewImage(this.item) : this.item.avatarUrl
    },

    previewName() {
      const getPreviewName =
        this.recordInfo[
          this.mode === 'view' ? 'viewOptions' : 'paginationOptions'
        ]?.heroOptions?.getPreviewName

      return getPreviewName ? getPreviewName(this.item) : this.item.name
    },

    containMode() {
      return !!this.recordInfo[
        this.mode === 'view' ? 'viewOptions' : 'paginationOptions'
      ]?.heroOptions?.containMode
    },
  },
}
