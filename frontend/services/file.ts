import { nanoid } from 'nanoid'
import prettyBytes from 'pretty-bytes'
import axios from 'axios'
import { handleError } from '~/services/base'
import firebase from '~/services/fireinit'
import 'firebase/storage'
import { executeGiraffeql } from '~/services/giraffeql'

type FileUploadObject = {
  name: string
  url: string | null
  progress: number
  size: number
  bytesSent: number
  servingUrl: string | null
  fileRecord: any
  uploadTask: firebase.storage.UploadTask
}

export function uploadFile(
  that,
  file,
  onFinishedUploading?: (file, fileRecord) => any
) {
  const subPath =
    that.$store.getters['auth/firebaseUser'].uid +
    '/' +
    nanoid() +
    '/' +
    file.name
  const path = 'temp/' + subPath

  const storageRef = firebase.storage().ref()

  const metadata = {}

  // create the upload task
  const uploadTask = storageRef.child(path).put(file, metadata)

  // create new fileObject with relevant listing info
  const fileUploadObject: FileUploadObject = {
    name: file.name,
    url: null,
    progress: 0,
    size: file.size,
    bytesSent: 0,
    servingUrl: null,
    fileRecord: null,
    uploadTask,
  }

  that.$set(file, 'fileUploadObject', fileUploadObject)

  // handle upload events
  uploadTask.on(
    firebase.storage.TaskEvent.STATE_CHANGED,
    function (snapshot) {
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
            __args: {
              name: file.name,
              location: subPath,
            },
          },
        })

        fileUploadObject.servingUrl = generateFileServingUrl(subPath)
        // const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
        // changes the spaces to url safe
        // fileUploadObject.url = encodeURI(downloadURL)
        fileUploadObject.fileRecord = fileRecord

        onFinishedUploading && onFinishedUploading(file, fileRecord)
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
