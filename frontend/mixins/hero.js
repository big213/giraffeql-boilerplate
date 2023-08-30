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
  },

  computed: {
    previewImageUrl() {
      return (
        this.recordInfo.paginationOptions.heroOptions.getPreviewImage?.(item) ??
        this.item.avatarUrl
      )
    },

    previewName() {
      return (
        this.recordInfo.paginationOptions.heroOptions.getPreviewName?.(item) ??
        this.item.name
      )
    },
  },
}
