import { executeGiraffeql } from '~/services/giraffeql'
import CircularLoader from '~/components/common/circularLoader.vue'
import {
  getNestedProperty,
  handleError,
  capitalizeString,
  generateTimeAgoString,
  generateFilterByObjectArray,
} from '~/services/base'
import EditRecordInterface from '~/components/interface/crud/editRecordInterface.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import PreviewRecordMenu from '~/components/menu/previewRecordMenu.vue'

export default {
  components: {
    CircularLoader,
    EditRecordInterface,
    PreviewableFilesColumn,
    PreviewRecordMenu,
  },

  props: {
    recordInfo: {
      type: Object,
      required: true,
    },

    lockedFilters: {
      type: Array,
      default: () => [],
    },

    // not currently implemented - type: CrudPageOptions | null
    /*
    pageOptions: {
      type: Object,
      default: null,
    },
    */

    generation: {
      type: Number,
      default: 0,
    },
    // is this component being rendered inside a dialog
    isDialog: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      loading: {
        loadMore: false,
      },

      records: [],
      totalRecords: 0,
      endCursor: null,

      returnFields: {
        content: true,
        files: true,
      },
    }
  },

  computed: {
    isLoading() {
      return this.loading.loadMorePosts || this.loading.loadRecord
    },

    capitalizedType() {
      return capitalizeString(this.recordInfo.typename)
    },

    selectedItem() {
      return this.lockedFilters.reduce((total, crudFilterObject) => {
        total[crudFilterObject.field] = crudFilterObject.value
        return total
      }, {})
    },
  },

  watch: {
    generation() {
      this.reset()
    },
  },

  created() {
    this.reset()

    // run any onSuccess functions
    const onSuccess = this.recordInfo.paginationOptions.onSuccess
    if (onSuccess) {
      onSuccess(this)
    }
  },

  methods: {
    getNestedProperty,
    generateTimeAgoString,

    handlePostSubmit() {
      this.reset()
    },

    handlePostUpdate(props, updatedPost) {
      props.item.content = updatedPost.content
      props.item.files = updatedPost.files
      props.isEditing = false
    },

    async deletePost(props) {
      try {
        await executeGiraffeql(this, {
          [`delete${this.capitalizedType}`]: {
            __args: {
              id: props.item.id,
            },
          },
        })

        // snackbar and then reload comments
        this.$notifier.showSnackbar({
          message: `${this.recordInfo.name} deleted`,
          variant: 'success',
        })

        // remove comment directly from the records
        const index = this.records.indexOf(props)

        if (index !== -1) {
          this.records.splice(index, 1)
        }

        // decrement the number of records to keep it in sync
        this.totalRecords--
      } catch (err) {
        handleError(this, err)
      }
    },

    // the query can be overriden and customized based on the requirements
    fetchMorePosts() {
      return executeGiraffeql(this, {
        [`get${this.capitalizedType}Paginator`]: {
          paginatorInfo: {
            endCursor: true,
            total: true,
          },
          edges: {
            node: {
              id: true,
              __typename: true,
              content: true,
              files: true,
              type: true,
              data: true,
              createdAt: true,
              updatedAt: true,
              createdBy: {
                id: true,
                name: true,
                avatar: true,
                __typename: true,
              },
            },
          },
          __args: {
            first: 10,
            ...(this.endCursor && {
              after: this.endCursor,
            }),
            filterBy: generateFilterByObjectArray(
              this.lockedFilters,
              this.recordInfo
            ),
            sortBy: [
              {
                field: 'createdAt',
                desc: true,
              },
            ],
          },
        },
      })
    },

    async loadMorePosts() {
      this.loading.loadMore = true
      try {
        const data = await this.fetchMorePosts()

        // parse the JSON in data field, if any
        data.edges.forEach((ele) => {
          if (ele.node.data) {
            ele.node.data = JSON.parse(ele.node.data)
          }
        })

        this.records.push(
          ...data.edges.map((ele) => ({
            item: ele.node,
            isEditing: false,
          }))
        )

        this.endCursor = data.paginatorInfo.endCursor
        this.totalRecords = data.paginatorInfo.total
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadMore = false
    },

    reset() {
      this.endCursor = null
      this.records = []
      this.totalRecords = 0
      this.loadMorePosts()
    },
  },
}
