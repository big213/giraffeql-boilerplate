import { executeGiraffeql } from '~/services/giraffeql'
import CircularLoader from '~/components/common/circularLoader.vue'
import {
  getNestedProperty,
  handleError,
  collectPaginatorData,
  capitalizeString,
  generateTimeAgoString,
  generateFilterByObjectArray,
  lookupFieldInfo,
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
    recordInfo: {
      type: Object,
      required: true,
    },

    lockedFilters: {
      type: Array,
      default: () => [],
    },

    // only implemented to extract the initialSortOptions, if any - type: CrudPageOptions | null
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
      currentSort: null,
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

    // transforms SortObject[] to CrudSortObject[]
    // type: CrudSortObject[]
    sortOptions() {
      return this.recordInfo.paginationOptions.sortOptions.map((sortObject) => {
        const fieldInfo = lookupFieldInfo(this.recordInfo, sortObject.field)

        return {
          text:
            sortObject.text ??
            `${fieldInfo.text ?? sortObject.field} (${
              sortObject.desc ? 'Desc' : 'Asc'
            })`,
          field: sortObject.field,
          desc: sortObject.desc,
        }
      })
    },

    // extracted from the pageOptions object, if any
    initialSortOptions() {
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
        await executeGiraffeql({
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

        // perform onSuccess function for deleteOptions
        const onSuccess = this.recordInfo.deleteOptions?.onSuccess

        if (onSuccess) {
          onSuccess(this)
        } else {
          // else emit the generic refresh-interface event
          this.$root.$emit('refresh-interface', this.recordInfo.typename)
        }

        // decrement the number of records to keep it in sync
        this.totalRecords--
      } catch (err) {
        handleError(this, err)
      }
    },

    // the query can be overriden and customized based on the requirements
    fetchMorePosts() {
      return executeGiraffeql({
        [`get${this.capitalizedType}Paginator`]: {
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
              this.recordInfo
            ),
            sortBy: this.currentSort
              ? [{ field: this.currentSort.field, desc: this.currentSort.desc }]
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
                this,
                `get${capitalizeString(type)}Paginator`,
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
      this.currentSort = sortObject
      this.reset()
    },

    reset({ resetSort = false } = {}) {
      this.endCursor = null
      this.records = []
      this.totalRecords = 0

      // set the currentSort to the parentRecordInfo.initialSortOptions if any
      if (resetSort && this.initialSortOptions) {
        this.currentSort =
          this.sortOptions.find(
            (ele) =>
              ele === this.initialSortOptions ||
              (ele.field === this.initialSortOptions.field &&
                ele.desc === this.initialSortOptions.desc)
          ) ?? null
      }

      this.loadMorePosts()
    },
  },
}
