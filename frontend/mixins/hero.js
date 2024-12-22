export default {
  props: {
    item: {
      type: Object,
      required: true,
    },

    heroOptions: {
      type: Object,
      required: true,
    },

    entity: {
      type: Object,
    },
  },

  computed: {
    previewImageUrl() {
      return this.heroOptions.getPreviewImage
        ? this.heroOptions.getPreviewImage(this.item)
        : this.item.avatarUrl
    },

    previewName() {
      return this.heroOptions.getPreviewName
        ? this.heroOptions.getPreviewName(this.item)
        : this.item.name
    },

    containMode() {
      return !!this.heroOptions.containMode
    },
  },
}
