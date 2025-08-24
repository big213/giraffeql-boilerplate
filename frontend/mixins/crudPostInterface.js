import { executeApiRequest } from '~/services/api'
import CircularLoader from '~/components/common/circularLoader.vue'
import {
  getNestedProperty,
  handleError,
  collectPaginatorData,
  generateTimeAgoString,
  generateFilterByObjectArray,
} from '~/services/base'
import EditRecordInterface from '~/components/interface/crud/editRecordInterface.vue'
import PreviewableFilesColumn from '~/components/table/previewableFilesColumn.vue'
import PreviewRecordMenu from '~/components/menu/previewRecordMenu.vue'
import PreviewRecordChip from '~/components/chip/previewRecordChip.vue'

export default {
  components: {
    CircularLoader,
    EditRecordInterface,
    PreviewableFilesColumn,
    PreviewRecordMenu,
    PreviewRecordChip,
  },

  props: {
    viewDefinition: {
      type: Object,
      required: true,
    },

    lockedFilters: {
      type: Array,
      default: () => [],
    },

    // only implemented to extract the initialSortKey, if any - type: CrudPageOptions | null
    pageOptions: {
      type: Object,
      default: null,
    },

    // additional fields to hide
    hiddenFields: {
      type: Array,
      default: () => [],
    },

    generation: {
      type: Number,
      default: 0,
    },
    // is this component being rendered inside a dialog
    isDialog: {
      type: Boolean,
      default: false,
    },

    // if it is a child component, the parent component with at least id
    parentItem: {
      type: Object,
    },

    readonly: {
      type: Boolean,
    },

    maxContentHeight: {},
  },

  data() {
    return {
      loading: {
        loadMore: false,
      },

      records: [],
      totalRecords: 0,
      endCursor: null,

      // should be overriden depending on the use case
      /*
      fields: array of fields to fetch
      generateFilterArray: (idsArray) => filterObjectArray
      values: Map<id,value>
      */
      knownTypesInfo: {},

      returnFields: {
        id: true,
        __typename: true,
        content: true,
        files: {
          id: true,
          name: true,
          size: true,
          contentType: true,
          location: true,
        },
        // type: true,
        // data: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          id: true,
          name: true,
          avatarUrl: true,
          __typename: true,
        },
      },

      // type: CrudSortObject | null
      currentSortObject: null,
    }
  },

  computed: {
    isLoading() {
      return this.loading.loadMorePosts || this.loading.loadRecord
    },

    lockedFields() {
      return this.lockedFilters.reduce((total, crudFilterObject) => {
        total[crudFilterObject.field] = crudFilterObject.value
        return total
      }, {})
    },

    // SortObject
    sortFields() {
      return this.viewDefinition.paginationOptions.sortFields ?? []
    },

    // extracted from the pageOptions object, if any
    initialSortKey() {
      return this.pageOptions?.sort
    },

    additionalFilters() {
      return []
    },
  },

  watch: {
    generation() {
      this.reset()
    },

    additionalFilters() {
      this.reset()
    },
  },

  created() {
    this.reset({ resetSort: true })

    // run any onSuccess functions
    const onSuccess = this.viewDefinition.paginationOptions.onSuccess
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

    handleReplyClick(props) {
      try {
        if (!this.$store.getters['auth/user']?.id) {
          throw new Error(`Login required`)
        }

        props.isReplying = true
      } catch (err) {
        handleError(this, err)
      }
    },

    userHasEditPermissions(props) {
      // user has edit permissions if item was created by the current user, if any
      const userId = this.$store.getters['auth/user']?.id

      return userId && userId === props.item.createdBy.id
    },

    handlePostUpdate(props, updatedPost) {
      props.item.content = updatedPost.content
      props.item.files = updatedPost.files
      props.item.updatedAt = new Date().getTime() / 1000
      props.isEditing = false
    },

    handlePostReply(props, addedPost) {
      this.records.splice(this.records.indexOf(props) + 1, 0, {
        item: addedPost,
        isEditing: false,
        isReplying: false,
      })

      // keep the total number of records in sync
      this.totalRecords++

      props.isReplying = false
    },

    // retrieves a known type by id
    getTypeFromMap(type, id) {
      return this.knownTypesInfo[type].values?.get(id)
    },

    async deletePost(props) {
      try {
        await executeApiRequest({
          [`${this.viewDefinition.entity.typename}Delete`]: {
            __args: {
              id: props.item.id,
            },
          },
        })

        // snackbar and then reload comments
        this.$root.$emit('showSnackbar', {
          message: `${this.viewDefinition.entity.name} deleted`,
          color: 'success',
        })

        // remove comment directly from the records
        const index = this.records.indexOf(props)

        if (index !== -1) {
          this.records.splice(index, 1)
        }

        // perform onSuccess function for deleteOptions
        const onSuccess = this.viewDefinition.deleteOptions?.onSuccess

        if (onSuccess) {
          onSuccess(this)
        } else {
          // else emit the generic refresh-interface event
          this.$root.$emit(
            'refresh-interface',
            this.viewDefinition.entity.typename
          )
        }

        // decrement the number of records to keep it in sync
        this.totalRecords--
      } catch (err) {
        handleError(this, err)
      }
    },

    // the query can be overriden and customized based on the requirements
    fetchMorePosts() {
      return executeApiRequest({
        [`${this.viewDefinition.entity.typename}GetPaginator`]: {
          paginatorInfo: {
            endCursor: true,
            total: true,
          },
          edges: {
            node: this.returnFields,
          },
          __args: {
            first: 10,
            ...(this.endCursor && {
              after: this.endCursor,
            }),
            filterBy: generateFilterByObjectArray(
              this.lockedFilters.concat(this.additionalFilters),
              []
            ),
            sortBy: this.currentSortObject
              ? [
                  {
                    field: this.currentSortObject.fieldPath,
                    desc: this.currentSortObject.desc,
                  },
                ]
              : [],
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

        // for any known types that exist in data as data[type], fetch them
        const knownTypesArray = Object.keys(this.knownTypesInfo)

        const typesToFetch = knownTypesArray.reduce((total, val) => {
          total[val] = new Set()
          return total
        }, {})

        if (knownTypesArray.length) {
          data.edges.forEach((ele) => {
            knownTypesArray.forEach((type) => {
              if (!ele.node.data) return

              if (ele.node.data[type]) {
                typesToFetch[type].add(ele.node.data[type])
              }
            })
          })

          for (const type in typesToFetch) {
            const fieldsToFetch = this.knownTypesInfo[type].fields ?? [
              'id',
              '__typename',
              'name',
              'avatarUrl',
            ]

            if (typesToFetch[type].size) {
              const results = await collectPaginatorData(
                `${type}GetPaginator`,
                fieldsToFetch.reduce((total, val) => {
                  total[val] = true
                  return total
                }, {}),
                {
                  filterBy: this.knownTypesInfo[type].generateFilterArray
                    ? this.knownTypesInfo[type].generateFilterArray([
                        ...typesToFetch[type],
                      ])
                    : [
                        {
                          id: {
                            in: [...typesToFetch[type]],
                          },
                        },
                      ],
                }
              )

              results.forEach((ele) => {
                if (!this.knownTypesInfo[type].values) {
                  this.knownTypesInfo[type].values = new Map()
                }
                this.knownTypesInfo[type].values.set(ele.id, ele)
              })
            }
          }
        }

        this.records.push(
          ...data.edges.map((ele) => ({
            item: ele.node,
            isEditing: false,
            isReplying: false,
          }))
        )

        this.endCursor = data.paginatorInfo.endCursor
        this.totalRecords = data.paginatorInfo.total
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadMore = false
    },

    setCurrentSort(sortObject) {
      this.currentSortObject = sortObject
      this.reset()
    },

    reset({ resetSort = false } = {}) {
      this.endCursor = null
      this.records = []
      this.totalRecords = 0

      // set the currentSortObject to the parentRecordInfo.initialSortKey if any
      if (resetSort && this.initialSortKey) {
        this.currentSortObject =
          this.sortFields.find((ele) => ele.key === this.initialSortKey) ?? null
      }

      this.loadMorePosts()
    },
  },
}
