'use client'

import { useState, useEffect } from 'react'
import { getFirebaseAuthClient } from '@/lib/firebase-client'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'

interface PhoneVerificationProps {
  phoneNumber: string
  onVerificationSuccess: (phoneNumber: string) => void
  onError: (error: string) => void
}

export default function PhoneVerification({ phoneNumber, onVerificationSuccess, onError }: PhoneVerificationProps) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [recaptchaContainerId] = useState(`recaptcha-${Math.random().toString(36).substring(7)}`)

  useEffect(() => {
    // Initialize reCAPTCHA verifier
    const auth = getFirebaseAuthClient()
    
    // Clean up previous verifier if exists
    if (recaptchaVerifier) {
      recaptchaVerifier.clear()
    }

    // Create container for reCAPTCHA if it doesn't exist
    let container = document.getElementById(recaptchaContainerId)
    if (!container) {
      container = document.createElement('div')
      container.id = recaptchaContainerId
      container.style.display = 'none'
      document.body.appendChild(container)
    }

    const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, will allow sendSMS
      },
      'expired-callback': () => {
        onError('reCAPTCHA expired. Please try again.')
      },
    })

    setRecaptchaVerifier(verifier)

    return () => {
      if (verifier) {
        verifier.clear()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber])

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // If it doesn't start with +, assume US number and add +1
    if (digits.length === 10) {
      return `+1${digits}`
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    }
    
    return phone.startsWith('+') ? phone : `+${digits}`
  }

  const handleSendOTP = async () => {
    if (!phoneNumber || !recaptchaVerifier) {
      onError('Phone number is required')
      return
    }

    setSending(true)
    setError(null)

    try {
      const auth = getFirebaseAuthClient()
      const formattedPhone = formatPhoneNumber(phoneNumber)
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
      setConfirmationResult(confirmation)
      setSending(false)
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      setSending(false)
      onError(error?.message || 'Failed to send OTP. Please try again.')
    }
  }

  const handleVerifyOTP = async () => {
    if (!confirmationResult || !otp || otp.length !== 6) {
      onError('Please enter a valid 6-digit OTP code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await confirmationResult.confirm(otp)
      
      if (result.user) {
        // Phone number verified successfully
        onVerificationSuccess(phoneNumber)
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      setLoading(false)
      onError(error?.message || 'Invalid OTP code. Please try again.')
    }
  }

  // Show error if set
  useEffect(() => {
    if (error) {
      onError(error)
      setError(null) // Clear after reporting
    }
  }, [error, onError])

  return (
    <div className="space-y-4">
      {/* reCAPTCHA container (invisible) */}
      <div id={recaptchaContainerId}></div>

      {!confirmationResult ? (
        <div>
          <p className="text-sm text-gray-700 mb-4">
            We'll send a verification code to {phoneNumber}
          </p>
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={sending || !phoneNumber}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Enter Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmationResult(null)
              setOtp('')
              if (recaptchaVerifier) {
                recaptchaVerifier.clear()
                // Re-initialize
                const auth = getFirebaseAuthClient()
                let container = document.getElementById(recaptchaContainerId)
                if (!container) {
                  container = document.createElement('div')
                  container.id = recaptchaContainerId
                  container.style.display = 'none'
                  document.body.appendChild(container)
                }
                const newVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
                  size: 'invisible',
                })
                setRecaptchaVerifier(newVerifier)
              }
            }}
            className="w-full text-sm text-blue-600 hover:text-blue-500"
          >
            Change Phone Number
          </button>
        </div>
      )}
    </div>
  )
}
