import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from '../config'

export const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const firestoreDb = getFirestore(app)
