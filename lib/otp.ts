import { prisma } from './prisma'
import crypto from 'crypto'
import { staticOtps } from './static-data'
import { Resend } from 'resend'

const OTP_EXPIRY_MINUTES = 10

async function sendOTPEmail(email: string, otp: string): Promise<void> {
  // Hardcoded Resend API key and email
  const resendApiKey = 're_9yQ4yVuX_MT1MTmhBbSsB2m6soEBmVxXQ'
  const fromEmail = 'onboarding@resend.dev'

  console.log(`[OTP] Attempting to send email to ${email} using Resend API`)
  console.log(`[OTP] From: ${fromEmail}, API Key: ${resendApiKey.substring(0, 10)}...`)

  try {
    const resend = new Resend(resendApiKey)
    
    console.log(`[OTP] Calling Resend API...`)
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Justice Hire Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Justice Hire - Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    })
    
    console.log(`[OTP] Resend API response:`, JSON.stringify(result, null, 2))
    
    if (result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error)
      console.error('[OTP] Resend API returned an error:', JSON.stringify(result.error, null, 2))
      console.error(`[OTP] Error details for ${email}:`, errorMessage)
      
      // Provide more specific error messages based on Resend error types
      if (errorMessage.includes('rate_limit') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new Error('Too many emails sent. Please wait a few minutes and try again.')
      } else if (errorMessage.includes('invalid') || errorMessage.includes('rejected') || errorMessage.includes('bounce')) {
        throw new Error(`Email address may be invalid or blocked: ${errorMessage}`)
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('exceeded')) {
        throw new Error('Email service limit reached. Please try again later.')
      } else {
        throw new Error(`Failed to send verification email: ${errorMessage}`)
      }
    }
    
    if (!result.data) {
      console.error('[OTP] Resend API returned no data:', result)
      throw new Error(`Failed to send OTP email: No data returned from Resend API`)
    }
    
    console.log(`[OTP] ✅ Email sent successfully to ${email}, ID: ${result.data.id}`)
  } catch (error: any) {
    console.error('[OTP] ❌ Failed to send email to', email)
    console.error('[OTP] Error type:', error?.constructor?.name)
    console.error('[OTP] Error message:', error?.message)
    console.error('[OTP] Error stack:', error?.stack)
    if (error?.response) {
      console.error('[OTP] Error response:', JSON.stringify(error.response, null, 2))
    }
    
    // Extract more detailed error information
    let errorDetails = error?.message || 'Unknown error'
    if (error?.response?.data) {
      errorDetails = JSON.stringify(error.response.data)
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = JSON.stringify(error)
    }
    
    console.error(`[OTP] Detailed error for ${email}:`, errorDetails)
    
    // Fallback: log to console if email sending fails
    console.log(`[OTP] ⚠️  FALLBACK - Email: ${email}, OTP: ${otp}, Expires: ${new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()}`)
    
    // Provide more specific error message
    let userFriendlyError = 'Failed to send verification email. Please try again.'
    if (errorDetails.includes('rate_limit') || errorDetails.includes('rate limit')) {
      userFriendlyError = 'Too many emails sent. Please wait a few minutes and try again.'
    } else if (errorDetails.includes('invalid') || errorDetails.includes('rejected')) {
      userFriendlyError = 'Email address may be invalid or blocked. Please try a different email address.'
    } else if (errorDetails.includes('quota') || errorDetails.includes('limit')) {
      userFriendlyError = 'Email service limit reached. Please try again later.'
    }
    
    // Re-throw the error so calling code knows it failed
    throw new Error(userFriendlyError)
  }
}

export async function generateOTP(email: string): Promise<string> {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Hash the OTP
    const hash = crypto.createHash('sha256').update(otp).digest('hex')
    
    // Store hash and expiry
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    
    // Delete old OTPs for this email
    await prisma.otps.deleteMany({ email })
    
    // Store in database
    await prisma.otps.create({
      email,
      hash,
      expiresAt: expiresAt.toISOString(),
    })
    
    console.log(`[OTP] Generated and stored OTP for ${email}`)
    
    // Send OTP via email
    await sendOTPEmail(email, otp)
    
    return otp
  } catch (error: any) {
    console.error(`[OTP] Error in generateOTP for ${email}:`, error)
    throw error
  }
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  // Special test OTP for development
  if (otp === '000000') {
    // Find the OTP for this email
    const otpRecord = await prisma.otps.findFirst({ email })
    if (otpRecord) {
      // Delete the OTP after verification
      await prisma.otps.delete({ email })
      return true
    }
    // If no OTP record exists, still allow 000000 for testing
    return true
  }
  
  // Find the OTP for this email
  const otpRecord = await prisma.otps.findFirst({ email })
  
  if (!otpRecord) {
    return false
  }
  
  // Check expiry
  if (new Date(otpRecord.expiresAt) < new Date()) {
    await prisma.otps.delete({ email })
    return false
  }
  
  // Verify the OTP hash
  const hash = crypto.createHash('sha256').update(otp).digest('hex')
  const isValid = hash === otpRecord.hash
  
  // Delete the OTP after verification (one-time use)
  if (isValid) {
    await prisma.otps.delete({ email })
  }
  
  return isValid
}
