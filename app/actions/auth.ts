'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession, getCurrentUser } from '@/lib/auth'
import { generateOTP, verifyOTP } from '@/lib/otp'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const signupEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  photoUrl: z.string().min(1, 'Photo is required'),
})

const signupEmployerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  state: z.enum(['CA', 'OR']),
  city: z.string().min(1),
  businessId: z.string().min(1),
  position: z.enum(['owner', 'manager', 'supervisor on duty']),
  photoUrl: z.string().min(1, 'Photo is required'),
})

export async function signupEmployee(formData: FormData) {
  const data = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    phoneNumber: formData.get('phoneNumber') as string,
    photoUrl: formData.get('photoUrl') as string,
  }

  const validated = signupEmployeeSchema.parse(data)

  // Check if user already exists
  const existing = await prisma.users.findUnique({ email: validated.email })

  if (existing) {
    return { error: 'Email already registered' }
  }

  // Create user
  // Note: Storing phoneNumber in socialUrl field for now (would need migration for new field)
  const user = await prisma.users.create({
    role: 'EMPLOYEE',
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
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

  // Create user
  const user = await prisma.users.create({
    role: 'EMPLOYER',
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
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

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'Invalid email' }
  }

  const user = await prisma.users.findUnique({ email })

  if (!user) {
    return { error: 'User not found' }
  }

  if (!user.verified) {
    return { error: 'Please verify your email first' }
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

export async function logout() {
  const { deleteSession } = await import('@/lib/auth')
  await deleteSession()
  redirect('/')
}
