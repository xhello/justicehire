// Firebase Client SDK for client-side phone authentication
'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

let firebaseApp: FirebaseApp | null = null

export function getFirebaseClient(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp
  }

  // Check if Firebase is already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]
    return firebaseApp
  }

  // Initialize Firebase Client
  // You'll need to set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, etc.
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error('Firebase client configuration is missing. Please set NEXT_PUBLIC_FIREBASE_* environment variables.')
  }

  firebaseApp = initializeApp(firebaseConfig)
  return firebaseApp
}

export function getFirebaseAuthClient(): Auth {
  const app = getFirebaseClient()
  return getAuth(app)
}
