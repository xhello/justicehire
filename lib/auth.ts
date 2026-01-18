import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'justice_hire_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function createSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)
  return session?.value || null
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser() {
  const userId = await getSession()
  if (!userId) return null
  
  const user = await prisma.users.findUnique({ id: userId })
  if (!user) return null

  // Supabase adapter already includes employerProfile with business info
  return user
}

// Password hashing functions
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Password reset token functions
export async function createPasswordResetToken(userId: string): Promise<string> {
  try {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    
    // Delete old tokens for this user
    await prisma.passwordResetTokens.deleteMany({ userId })
    
    // Create new token
    await prisma.passwordResetTokens.create({
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
    })
    
    return token
  } catch (error: any) {
    console.error('Error creating password reset token:', error)
    throw new Error(`Failed to create password reset token: ${error?.message || 'Unknown error'}`)
  }
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const resetToken = await prisma.passwordResetTokens.findFirst({ token })
  
  if (!resetToken) {
    return null
  }
  
  // Check if token is expired
  if (new Date(resetToken.expiresAt) < new Date()) {
    await prisma.passwordResetTokens.delete({ token })
    return null
  }
  
  return resetToken.userId
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetTokens.delete({ token })
}
