import { prisma } from './prisma'
import crypto from 'crypto'
import { staticOtps } from './static-data'
import { Resend } from 'resend'

const OTP_EXPIRY_MINUTES = 10

async function sendOTPEmail(email: string, otp: string): Promise<void> {
  // Hardcoded Resend API key and email
  const resendApiKey = 're_9yQ4yVuX_MT1MTmhBbSsB2m6soEBmVxXQ'
  const fromEmail = 'onboarding@resend.dev'

  try {
    const resend = new Resend(resendApiKey)
    
    await resend.emails.send({
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
    
    console.log(`[OTP] Email sent successfully to ${email}`)
  } catch (error) {
    console.error('[OTP] Failed to send email:', error)
    // Fallback: log to console if email sending fails
    console.log(`[OTP] Email: ${email}, OTP: ${otp}, Expires: ${new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()}`)
  }
}

export async function generateOTP(email: string): Promise<string> {
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
  
  // Send OTP via email
  await sendOTPEmail(email, otp)
  
  return otp
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
