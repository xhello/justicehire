# Firebase Authentication Setup for Phone OTP

This application uses Firebase Authentication for phone number verification via SMS OTP.

## Prerequisites

1. A Firebase project with Authentication enabled
2. Phone Authentication enabled in Firebase Console
3. Firebase Admin SDK credentials

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** in the Firebase Console
4. Enable **Phone** as a sign-in method

### 2. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click on the web app icon (</>) or add a web app
4. Copy the Firebase configuration object

### 3. Set Environment Variables

Add the following to your `.env.local` file:

```bash
# Firebase Client Configuration (for browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

### 4. Get Firebase Admin SDK Credentials

1. In Firebase Console, go to Project Settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract the following from the JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

### 5. Enable Phone Authentication

1. In Firebase Console, go to Authentication → Sign-in method
2. Enable "Phone" as a sign-in provider
3. Configure reCAPTCHA settings (Firebase handles this automatically)

## How It Works

1. **User enters phone number** in the signup form
2. **Client-side verification**: Firebase sends SMS OTP to the phone number
3. **User enters OTP code**: Verified client-side using Firebase Auth
4. **Form submission**: Once phone is verified, user can submit the signup form
5. **User creation**: Server creates user account directly (phone already verified)

## Testing

For testing purposes, Firebase provides test phone numbers that don't require actual SMS:
- Use Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing
- Add test phone numbers with verification codes

## Notes

- Phone numbers must be in E.164 format (e.g., +1234567890)
- The app automatically formats US phone numbers to include +1
- reCAPTCHA is handled automatically by Firebase (invisible)
- Phone verification happens entirely client-side for security
