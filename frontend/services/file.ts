import { nanoid } from 'nanoid'
import prettyBytes from 'pretty-bytes'
import axios from 'axios'
import { handleError } from '~/services/base'
import firebase from '~/services/fireinit'
import 'firebase/storage'
import { executeGiraffeql } from '~/services/giraffeql'
import { isDev, tempStoragePath } from './config'

type FileUploadObject = {
  name: string
  url: string | null
  progress: number
  size: number
  bytesSent: number
  servingUrl: string | null
  fileRecord: any
  uploadTask: firebase.storage.UploadTask | null
  file: File
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

  const storageRef = firebase.storage().ref()

  const metadata = {}

  // create the upload task
  const uploadTask = storageRef.child(path).put(fileUploadObject.file, metadata)

  fileUploadObject.uploadTask = uploadTask

  // handle upload events
  uploadTask.on(
    firebase.storage.TaskEvent.STATE_CHANGED,
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

        fileUploadObject.servingUrl = generateFileServingUrl(subPath)

        if (fileRecord.downloadUrl) {
          fileUploadObject.url = fileRecord.downloadUrl
        }

        /* 
        if (fetchFirebaseUrl) {
          const downloadURL = await storageRef
            .child('source/' + subPath)
            .getDownloadURL()

          fileUploadObject.url = downloadURL
        }
        */

        fileUploadObject.fileRecord = fileRecord

        onFinishedUploading && onFinishedUploading(fileUploadObject)
      } catch (err) {
        handleError(that, err)
      }
    }
  )

  return fileUploadObject
}

export function generateFileServingUrl(bucketPath: string) {
  return encodeURI(process.env.imageServingUrl + '/' + bucketPath)
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
