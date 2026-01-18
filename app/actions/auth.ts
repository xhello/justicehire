'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession, getCurrentUser, hashPassword, verifyPassword, createPasswordResetToken, verifyPasswordResetToken, deletePasswordResetToken } from '@/lib/auth'
import { generateOTP, verifyOTP } from '@/lib/otp'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const signupEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  photoUrl: z.string().min(1, 'Photo is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const signupEmployerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  state: z.enum(['CA', 'OR']),
  city: z.string().min(1),
  businessId: z.string().min(1),
  position: z.enum(['owner', 'manager', 'supervisor on duty']),
  photoUrl: z.string().min(1, 'Photo is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function signupEmployee(formData: FormData) {
  const data = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    phoneNumber: formData.get('phoneNumber') as string,
    photoUrl: formData.get('photoUrl') as string,
  }

  const validated = signupEmployeeSchema.parse(data)

  // Check if user already exists
  const existing = await prisma.users.findUnique({ email: validated.email })

  if (existing) {
    return { error: 'Email already registered' }
  }

  // Hash password
  const hashedPassword = await hashPassword(validated.password)

  // Create user
  // Note: Storing phoneNumber in socialUrl field for now (would need migration for new field)
  const user = await prisma.users.create({
    role: 'EMPLOYEE',
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
    password: hashedPassword,
    socialUrl: validated.phoneNumber,
    photoUrl: validated.photoUrl,
    verified: false,
  })

  // Generate and send OTP
  await generateOTP(validated.email)

  return { success: true, userId: user.id }
}

export async function signupEmployer(formData: FormData) {
  const data = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    state: formData.get('state') as string,
    city: formData.get('city') as string,
    businessId: formData.get('businessId') as string,
    position: formData.get('position') as string,
    photoUrl: formData.get('photoUrl') as string,
  }

  const validated = signupEmployerSchema.parse(data)

  // Check if user already exists
  const existing = await prisma.users.findUnique({ email: validated.email })

  if (existing) {
    return { error: 'Email already registered' }
  }

  // Verify business exists
  const business = await prisma.businesses.findUnique({ id: validated.businessId })

  if (!business) {
    return { error: 'Business not found' }
  }

  // Hash password
  const hashedPassword = await hashPassword(validated.password)

  // Create user
  const user = await prisma.users.create({
    role: 'EMPLOYER',
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
    password: hashedPassword,
    state: validated.state,
    city: validated.city,
    position: validated.position,
    photoUrl: validated.photoUrl,
    verified: false,
    employerProfile: {
      businessId: validated.businessId,
    },
  } as any)

  // Generate and send OTP
  await generateOTP(validated.email)

  return { success: true, userId: user.id }
}

export async function requestEmailOtp(formData: FormData) {
  const email = formData.get('email') as string

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'Invalid email' }
  }

  // Check if user exists
  const user = await prisma.users.findUnique({ email })

  if (!user) {
    return { error: 'User not found' }
  }

  // Generate OTP
  await generateOTP(email)

  return { success: true }
}

export async function verifyEmailOtp(formData: FormData) {
  const email = formData.get('email') as string
  const otp = formData.get('otp') as string

  if (!email || !otp) {
    return { error: 'Email and OTP are required' }
  }

  // Verify OTP
  const isValid = await verifyOTP(email, otp)

  if (!isValid) {
    return { error: 'Invalid or expired OTP' }
  }

  // Update user as verified
  const user = await prisma.users.update({ email }, { verified: true })

  // Create session
  await createSession(user.id)

  // Redirect to success page first, then to dashboard
  redirect(`/verify/success?role=${user.role}`)
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'Invalid email' }
  }

  if (!password) {
    return { error: 'Password is required' }
  }

  const user = await prisma.users.findUnique({ email })

  if (!user) {
    return { error: 'Invalid email or password' }
  }

  if (!user.verified) {
    return { error: 'Please verify your email first' }
  }

  // Verify password
  if (!user.password) {
    return { error: 'Please reset your password. Account was created before password authentication was added.' }
  }

  const isPasswordValid = await verifyPassword(password, user.password)

  if (!isPasswordValid) {
    return { error: 'Invalid email or password' }
  }

  // Create session
  await createSession(user.id)

  // Redirect based on role
  if (user.role === 'EMPLOYEE') {
    redirect('/dashboard/employee')
  } else {
    redirect('/dashboard/employer')
  }
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'Invalid email' }
  }

  const user = await prisma.users.findUnique({ email })

  if (!user) {
    // Don't reveal if user exists for security
    return { success: true }
  }

  try {
    // Create password reset token
    const token = await createPasswordResetToken(user.id)

    // Send password reset email
    const resend = new Resend('re_9yQ4yVuX_MT1MTmhBbSsB2m6soEBmVxXQ')
    // Use VERCEL_URL in production, localhost in development
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`
    
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset Your Justice Hire Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Justice Hire - Password Reset</h2>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <div style="margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send password reset email:', error)
    console.error('Error details:', error?.message, error?.stack)
    // Return error so user knows something went wrong
    return { error: `Failed to send reset email: ${error?.message || 'Please try again later.'}` }
  }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token) {
    return { error: 'Invalid reset token' }
  }

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  // Verify token
  const userId = await verifyPasswordResetToken(token)

  if (!userId) {
    return { error: 'Invalid or expired reset token' }
  }

  // Hash new password
  const hashedPassword = await hashPassword(password)

  // Update user password
  await prisma.users.update({ id: userId }, { password: hashedPassword })

  // Delete used token
  await deletePasswordResetToken(token)

  return { success: true }
}

export async function logout() {
  const { deleteSession } = await import('@/lib/auth')
  await deleteSession()
  redirect('/')
}
