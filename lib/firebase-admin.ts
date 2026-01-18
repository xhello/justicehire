// Firebase Admin SDK for server-side phone authentication
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let firebaseAdminApp: App | null = null

export function getFirebaseAdmin(): App {
  if (firebaseAdminApp) {
    return firebaseAdminApp
  }

  // Check if Firebase Admin is already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    firebaseAdminApp = existingApps[0]
    return firebaseAdminApp
  }

  // Initialize Firebase Admin
  // You'll need to set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment variables
  // Or use a service account JSON file
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.')
  }

  firebaseAdminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })

  return firebaseAdminApp
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin()
  return getAuth(app)
}
