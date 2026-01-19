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
  photoUrl: z.string().optional().or(z.literal('')),
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
  photoUrl: z.string().optional().or(z.literal('')),
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
    confirmPassword: formData.get('confirmPassword') as string,
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

  try {
    // Create user immediately (no OTP required for signup)
    const user = await prisma.users.create({
      role: 'EMPLOYEE',
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      password: hashedPassword,
      socialUrl: validated.phoneNumber,
      photoUrl: validated.photoUrl || null,
      verified: false, // User needs to verify email later
    })

    // Create session and return success with redirect path
    await createSession(user.id)
    return { success: true, redirect: '/dashboard/employee' }
  } catch (error: any) {
    console.error('Error creating pending signup:', error)
    // Check if it's a table not found error
    if (error?.message?.includes('PendingSignup') || error?.message?.includes('does not exist')) {
      return { error: 'Database setup incomplete. Please contact support.' }
    }
    // Check for request body size errors
    if (error?.message?.includes('body') && error?.message?.includes('limit') || 
        error?.message?.includes('too large') ||
        error?.message?.includes('PayloadTooLargeError')) {
      return { error: 'Photo is too large. Please try a smaller photo or crop it more.' }
    }
    return { error: error?.message || 'Failed to create signup. Please try again.' }
  }
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

  try {
    // Create user immediately (no OTP required for signup)
    const user = await prisma.users.create({
      role: 'EMPLOYER',
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      password: hashedPassword,
      state: validated.state,
      city: validated.city,
      position: validated.position,
      photoUrl: validated.photoUrl || null,
      verified: false, // User needs to verify email later
      employerProfile: {
        businessId: validated.businessId,
      },
    } as any)

    // Create session and return success with redirect path
    await createSession(user.id)
    return { success: true, redirect: '/dashboard/employer' }
  } catch (error: any) {
    console.error('Error creating pending signup:', error)
    // Check if it's a table not found error
    if (error?.message?.includes('PendingSignup') || error?.message?.includes('does not exist')) {
      return { error: 'Database setup incomplete. Please contact support.' }
    }
    // Check for request body size errors
    if (error?.message?.includes('body') && error?.message?.includes('limit') || 
        error?.message?.includes('too large') ||
        error?.message?.includes('PayloadTooLargeError')) {
      return { error: 'Photo is too large. Please try a smaller photo or crop it more.' }
    }
    return { error: error?.message || 'Failed to create signup. Please try again.' }
  }
}

export async function requestEmailOtp(formData: FormData) {
  const email = formData.get('email') as string
  const newEmail = formData.get('newEmail') as string | null // For email updates

  // If newEmail is provided, send OTP to new email for verification
  const targetEmail = newEmail || email

  if (!targetEmail || !z.string().email().safeParse(targetEmail).success) {
    return { error: 'Invalid email' }
  }

  // For email updates, check if new email is already taken
  if (newEmail) {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const existingUser = await prisma.users.findUnique({ email: newEmail })
    if (existingUser && existingUser.id !== user.id) {
      return { error: 'Email already registered' }
    }
  } else {
    // For regular verification, check if user exists
    const user = await prisma.users.findUnique({ email })
    if (!user) {
      return { error: 'No account found for this email' }
    }
  }

  // Generate OTP and send to target email
  await generateOTP(targetEmail)

  return { success: true }
}

export async function verifyEmailOtp(formData: FormData) {
  const email = formData.get('email') as string
  const otp = formData.get('otp') as string
  const newEmail = formData.get('newEmail') as string | null // For email updates

  if (!email || !otp) {
    return { error: 'Email and OTP are required' }
  }

  // Verify OTP
  const isValid = await verifyOTP(email, otp)

  if (!isValid) {
    return { error: 'Invalid or expired OTP' }
  }

  // If newEmail is provided, this is an email update
  // OTP was sent to newEmail, so verify OTP for newEmail (email param should be newEmail)
  if (newEmail) {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify OTP for the new email (OTP was sent to newEmail, email param should be newEmail)
    const isValidNewEmail = await verifyOTP(newEmail, otp)
    if (!isValidNewEmail) {
      return { error: 'Invalid or expired OTP for new email' }
    }

    // Check if new email is already taken
    const existingUser = await prisma.users.findUnique({ email: newEmail })
    if (existingUser && existingUser.id !== user.id) {
      return { error: 'Email already registered' }
    }

    // Update user's email
    await prisma.users.update({ id: user.id }, { email: newEmail, verified: true })
    revalidatePath('/dashboard/employee')
    revalidatePath('/dashboard/employer')
    return { success: true, message: 'Email updated successfully' }
  }

  // Otherwise, this is email verification for existing user
  const user = await prisma.users.findUnique({ email })
  if (user) {
    // Update user as verified
    await prisma.users.update({ id: user.id }, { verified: true })
    revalidatePath('/dashboard/employee')
    revalidatePath('/dashboard/employer')
    return { success: true, message: 'Email verified successfully' }
  }

  // Legacy: Handle pending signups (shouldn't happen with new flow, but keep for compatibility)
  const pendingSignup = await prisma.pendingSignups.findUnique({ email })
  if (pendingSignup) {
    // Check if expired
    if (new Date(pendingSignup.expiresAt) < new Date()) {
      await prisma.pendingSignups.delete({ email })
      return { error: 'Signup session expired. Please sign up again.' }
    }

    // Create the user
    let newUser
    if (pendingSignup.role === 'EMPLOYEE') {
      newUser = await prisma.users.create({
        role: 'EMPLOYEE',
        firstName: pendingSignup.firstName,
        lastName: pendingSignup.lastName,
        email: pendingSignup.email,
        password: pendingSignup.password,
        socialUrl: pendingSignup.socialUrl || null,
        photoUrl: pendingSignup.photoUrl || null,
        verified: true,
      })
    } else {
      if (pendingSignup.businessId) {
        const business = await prisma.businesses.findUnique({ id: pendingSignup.businessId })
        if (!business) {
          await prisma.pendingSignups.delete({ email })
          return { error: 'Business not found. Please sign up again.' }
        }
      }
      
      newUser = await prisma.users.create({
        role: 'EMPLOYER',
        firstName: pendingSignup.firstName,
        lastName: pendingSignup.lastName,
        email: pendingSignup.email,
        password: pendingSignup.password,
        state: pendingSignup.state || null,
        city: pendingSignup.city || null,
        position: pendingSignup.position || null,
        photoUrl: pendingSignup.photoUrl || null,
        verified: false,
        employerProfile: pendingSignup.businessId ? {
          businessId: pendingSignup.businessId,
        } : undefined,
      } as any)
    }

    await prisma.pendingSignups.delete({ email })
    await createSession(newUser.id)
    redirect(`/verify/success?role=${newUser.role}`)
  }

  return { error: 'User not found' }
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

  // Both employees and employers can log in even if not verified
  // They can verify their email from the dashboard

  // Handle users without passwords (created before password auth was added)
  if (!user.password) {
    // Redirect to forgot password page with a message
    // We'll allow them to set a password via reset flow
    redirect(`/forgot-password?email=${encodeURIComponent(email)}&noPassword=true`)
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
    // Use justicehire.com domain for reset password links
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://justicehire.com'
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`
    
    await resend.emails.send({
      from: 'onboarding@justicehire.com',
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

export async function updateUserPhoto(formData: FormData) {
  const user = await getCurrentUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const photoUrl = formData.get('photoUrl') as string

  if (!photoUrl) {
    return { error: 'Photo URL is required' }
  }

  try {
    await prisma.users.update({ id: user.id }, { photoUrl })
    revalidatePath('/dashboard/employee')
    revalidatePath('/dashboard/employer')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating user photo:', error)
    return { error: error?.message || 'Failed to update photo' }
  }
}
