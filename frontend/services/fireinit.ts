import firebase from 'firebase/app'
import { firebaseConfig } from '~/services/config'

!firebase.apps?.length && firebase.initializeApp(firebaseConfig)

// export const DB = firebase.database()

export default firebase
