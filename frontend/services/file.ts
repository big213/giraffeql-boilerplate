import { nanoid } from 'nanoid'
import prettyBytes from 'pretty-bytes'
import axios from 'axios'
import { handleError } from '~/services/base'
import { executeGiraffeql } from '~/services/giraffeql'
import { isDev, tempStoragePath } from './config'
import { UploadTask, ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from './fireinit'

type FileUploadObject = {
  name: string
  url: string | null
  progress: number
  size: number
  bytesSent: number
  servingUrl: string | null
  fileRecord: any
  uploadTask: UploadTask | null
  file: File
}

type FileDownloadObject = {
  url: string
  name: string
  progress: number
  bytesSent: number
  bytesTotal: number | undefined
  isDownloading: boolean
  promise: Promise<true>
}

export function initializeFileUploadObject(file: File): FileUploadObject {
  return {
    name: file.name,
    url: null,
    progress: 0,
    size: file.size,
    bytesSent: 0,
    servingUrl: null,
    fileRecord: null,
    uploadTask: null,
    file,
  }
}

export function uploadFile(
  that,
  fileUploadObject: FileUploadObject,
  fetchFirebaseUrl: boolean,
  onFinishedUploading?: (fileUploadObject) => any
) {
  // if dev mode, add a prefix
  const subPath = `${isDev ? 'dev/' : ''}${
    that.$store.getters['auth/firebaseUser'].uid
  }/${nanoid()}/${fileUploadObject.file.name}`

  const path = `${tempStoragePath}/${subPath}`

  const metadata = {}

  // create the upload task
  const uploadTask = uploadBytesResumable(
    ref(storage, path),
    fileUploadObject.file,
    metadata
  )

  fileUploadObject.uploadTask = uploadTask

  // handle upload events
  uploadTask.on(
    'state_changed',
    (snapshot) => {
      fileUploadObject.progress =
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      fileUploadObject.bytesSent = snapshot.bytesTransferred
    },
    null,
    async () => {
      try {
        // finished uploading. register file with API.
        const fileRecord = await executeGiraffeql<'createFile'>(that, {
          createFile: {
            id: true,
            name: true,
            size: true,
            location: true,
            contentType: true,
            ...(fetchFirebaseUrl && {
              downloadUrl: true,
            }),
            __args: {
              name: fileUploadObject.name,
              location: subPath,
            },
          },
        })

        fileUploadObject.servingUrl = generateFileServingUrl({
          bucketPath: subPath,
        })

        if (fileRecord.downloadUrl) {
          fileUploadObject.url = fileRecord.downloadUrl
        }

        fileUploadObject.fileRecord = fileRecord

        onFinishedUploading && onFinishedUploading(fileUploadObject)
      } catch (err) {
        handleError(that, err)
      }
    }
  )

  return fileUploadObject
}

export function generateFileServingUrl({
  bucketPath,
  width,
  height,
}: {
  bucketPath: string
  width?: number
  height?: number
}) {
  let modifierStatements: string[] = [
    `${width ? `w_${String(width)}` : ''}`,
    `${height ? `h_${String(height)}` : ''}`,
  ].filter((e) => e)

  return encodeURI(
    `${process.env.imageServingUrl}/${
      modifierStatements.length ? `${modifierStatements.join(',')}/` : ''
    }${bucketPath}`
  )
}

export function formatBytes(bytes: number) {
  return prettyBytes(bytes)
}

export function forceFileDownload(response, title) {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', title)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function downloadFile(that, fileUrl, title) {
  try {
    const data = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'arraybuffer',
    })

    forceFileDownload(data, title)
  } catch (err) {
    handleError(that, err)
  }
}

export const contentTypeIconMap = {
  'image/png': 'mdi-file-image',
  'image/jpg': 'mdi-file-image',
}

export function downloadWithProgress(that, fileUrl, name) {
  const downloadObject: FileDownloadObject = {
    url: fileUrl,
    name,
    progress: 0,
    bytesSent: 0,
    bytesTotal: undefined,
    isDownloading: true, // automatically set to downloading
    promise: new Promise((resolve, reject) => {
      const startTime = new Date().getTime()

      const request = new XMLHttpRequest()

      request.responseType = 'blob'
      request.open('get', fileUrl, true)
      request.send()

      request.onreadystatechange = function () {
        // this means the file was not found. throw err (reject the promise)
        if (this.status !== 200) {
          // set the downloading state
          downloadObject.isDownloading = false
          reject(new Error('File not found'))
        }

        if (this.readyState === 4 && this.status === 200) {
          const imageUrl = window.URL.createObjectURL(this.response)

          const anchor = document.createElement('a')
          anchor.href = imageUrl
          anchor.download = name
          document.body.appendChild(anchor)
          anchor.click()

          // done downloading
          downloadObject.isDownloading = false

          // clean up
          document.body.removeChild(anchor)
          window.URL.revokeObjectURL(imageUrl)

          // resolve the promise
          resolve(true)
        }
      }

      request.onprogress = function (e) {
        if (downloadObject.bytesTotal === undefined)
          downloadObject.bytesTotal = e.total

        downloadObject.bytesSent = e.loaded
        downloadObject.progress =
          (downloadObject.bytesSent / downloadObject.bytesTotal) * 100

        // extra stuff
        /*
        const percentCompleted = Math.floor((e.loaded / e.total) * 100)
        const duration = (new Date().getTime() - startTime) / 1000
        const bps = e.loaded / duration
        const kbps = Math.floor(bps / 1024)
        const time = (e.total - e.loaded) / bps
        const seconds = Math.floor(time % 60)
        const minutes = Math.floor(time / 60)

        console.log(
          `${percentCompleted}% - ${kbps} Kbps - ${minutes} min ${seconds} sec remaining`
        )
        */
      }
    }),
  }

  return downloadObject
}
