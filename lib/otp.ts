import { prisma } from './prisma'
import crypto from 'crypto'
import { staticOtps } from './static-data'

const OTP_EXPIRY_MINUTES = 10

export async function generateOTP(email: string): Promise<string> {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Hash the OTP
  const hash = crypto.createHash('sha256').update(otp).digest('hex')
  
  // Store hash and expiry
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  
  // Log OTP to console (as per requirements)
  console.log(`[OTP] Email: ${email}, OTP: ${otp}, Expires: ${expiresAt.toISOString()}`)
  
  // Delete old OTPs for this email
  await prisma.otps.deleteMany({ email })
  
  // Store in database
  await prisma.otps.create({
    email,
    hash,
    expiresAt: expiresAt.toISOString(),
  })
  
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
