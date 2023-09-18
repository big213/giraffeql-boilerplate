import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { firebaseConfig } from '~/services/config'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

export const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

auth.onAuthStateChanged
