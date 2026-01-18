// Supabase database adapter - replaces static database
import { supabaseAdmin } from './supabase'
import { randomUUID } from 'crypto'

// Types matching Prisma schema
export interface SupabaseUser {
  id: string
  role: 'EMPLOYEE' | 'EMPLOYER'
  verified: boolean
  firstName: string
  lastName: string
  email: string
  password?: string | null
  socialUrl?: string | null
  photoUrl?: string | null
  state?: string | null
  city?: string | null
  position?: string | null
  createdAt: string
  updatedAt?: string | null
  employerProfile?: {
    businessId: string
    business?: {
      id: string
      name: string
      address: string
      state: string
      city: string
      category: string
    }
  }
}

export interface SupabaseBusiness {
  id: string
  placeId: string
  name: string
  address: string
  state: string
  city: string
  category: string
  photoUrl?: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface SupabaseReview {
  id: string
  reviewerId: string
  targetType: 'EMPLOYEE' | 'EMPLOYER' | 'BUSINESS'
  targetUserId: string | null
  businessId: string
  rating: 'OUTSTANDING' | 'DELIVERED_AS_EXPECTED' | 'GOT_NOTHING_NICE_TO_SAY' | null
  starRating: number | null
  payCompetitive: number | null
  workload: number | null
  flexibility: number | null
  message: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface SupabaseOtp {
  id: string
  email: string
  hash: string
  expiresAt: string
  createdAt: string
}

export interface SupabasePasswordResetToken {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}

export interface SupabasePendingSignup {
  id: string
  email: string
  role: 'EMPLOYEE' | 'EMPLOYER'
  firstName: string
  lastName: string
  password: string
  socialUrl?: string | null
  photoUrl?: string | null
  state?: string | null
  city?: string | null
  position?: string | null
  businessId?: string | null
  createdAt: string
  expiresAt: string
}

export interface SupabaseEmployerProfile {
  id: string
  userId: string
  businessId: string
  createdAt: string
  updatedAt?: string | null
}

// Database adapter matching the static-db interface
export const supabaseDb = {
  users: {
    findUnique: async (where: { id?: string; email?: string }): Promise<SupabaseUser | null> => {
      try {
        let query = supabaseAdmin.from('User').select('*')
        
        if (where.id) {
          query = query.eq('id', where.id)
        } else if (where.email) {
          query = query.eq('email', where.email)
        } else {
          return null
        }
        
        const { data, error } = await query.single()
        
        if (error || !data) return null
        
        // Fetch employer profile if exists
        if (data.role === 'EMPLOYER') {
          try {
            const { data: profile } = await supabaseAdmin
              .from('EmployerProfile')
              .select(`
                businessId,
                business:Business (
                  id,
                  name,
                  address,
                  state,
                  city,
                  category
                )
              `)
              .eq('userId', data.id)
              .single()
            
            if (profile) {
              return {
                ...data,
                employerProfile: {
                  businessId: profile.businessId,
                  business: profile.business as any,
                },
              } as SupabaseUser
            }
          } catch (profileErr) {
            // If employer profile query fails, just return user without profile
            console.error('Error fetching employer profile:', profileErr)
          }
        }
        
        return data as SupabaseUser
      } catch (err) {
        console.error('Error querying User table:', err)
        return null
      }
    },
    
    findMany: async (where?: any): Promise<SupabaseUser[]> => {
      try {
        let query = supabaseAdmin.from('User').select('*')
        
        if (where?.role) {
          query = query.eq('role', where.role)
        }
        
        if (where?.state) {
          query = query.eq('state', where.state)
        }
        
        if (where?.city) {
          query = query.eq('city', where.city)
        }
        
        const { data, error } = await query
        
        if (error || !data) return []
        
        return data as SupabaseUser[]
      } catch (err) {
        console.error('Error querying Users table:', err)
        return []
      }
    },
    
    create: async (data: Omit<SupabaseUser, 'id' | 'createdAt' | 'updatedAt' | 'employerProfile'> & { employerProfile?: { businessId: string } }): Promise<SupabaseUser> => {
      try {
        const { data: user, error } = await supabaseAdmin
          .from('User')
          .insert({
            role: data.role,
            verified: data.verified,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password || null,
            socialUrl: data.socialUrl || null,
            photoUrl: data.photoUrl || null,
            state: data.state || null,
            city: data.city || null,
            position: data.position || null,
          })
          .select()
          .single()
        
        if (error) throw new Error(`Failed to create user: ${error.message}`)
        
        // Create employer profile if needed
        if (data.role === 'EMPLOYER' && data.employerProfile?.businessId) {
          const { error: profileError } = await supabaseAdmin
            .from('EmployerProfile')
            .insert({
              userId: user.id,
              businessId: data.employerProfile.businessId,
            })
            
          if (profileError) {
            // Rollback user creation if profile creation fails
            await supabaseAdmin.from('User').delete().eq('id', user.id)
            throw new Error(`Failed to create employer profile: ${profileError.message}`)
          }
        }
        
        // Fetch the created user with profile if employer
        if (data.role === 'EMPLOYER') {
          return await supabaseDb.users.findUnique({ id: user.id }) as SupabaseUser
        }
        
        return user as SupabaseUser
      } catch (err) {
        console.error('Error creating user:', err)
        throw err
      }
    },
    
    update: async (where: { id?: string; email?: string }, data: Partial<SupabaseUser>): Promise<SupabaseUser> => {
      try {
        // Extract password separately to ensure it's included
        const updateData: any = {
          ...data,
          updatedAt: new Date().toISOString(),
        }
        // Explicitly include password if provided
        if (data.password !== undefined) {
          updateData.password = data.password
        }
        
        let query = supabaseAdmin.from('User').update(updateData)
        
        if (where.id) {
          query = query.eq('id', where.id)
        } else if (where.email) {
          query = query.eq('email', where.email)
        } else {
          throw new Error('Must provide id or email')
        }
        
        const { data: updated, error } = await query.select().single()
        
        if (error) throw new Error(`Failed to update user: ${error.message}`)
        
        return updated as SupabaseUser
      } catch (err) {
        console.error('Error updating user:', err)
        throw err
      }
    },
  },
  
  businesses: {
    findUnique: async (where: { id?: string; placeId?: string }): Promise<SupabaseBusiness | null> => {
      try {
        let query = supabaseAdmin.from('Business').select('*')
        
        if (where.id) {
          query = query.eq('id', where.id)
        } else if (where.placeId) {
          query = query.eq('placeId', where.placeId)
        } else {
          return null
        }
        
        const { data, error } = await query.single()
        
        if (error || !data) return null
        
        return data as SupabaseBusiness
      } catch (err) {
        console.error('Error querying Business table:', err)
        return null
      }
    },
    
    findMany: async (where?: any): Promise<SupabaseBusiness[]> => {
      try {
        let query = supabaseAdmin.from('Business').select('*')
        
        if (where?.state) {
          query = query.eq('state', where.state)
        }
        if (where?.city) {
          query = query.eq('city', where.city)
        }
        if (where?.category) {
          query = query.eq('category', where.category)
        }
        
        const { data, error } = await query
        
        if (error || !data) return []
        
        return data as SupabaseBusiness[]
      } catch (err) {
        console.error('Error querying Business table:', err)
        return []
      }
    },
    
    create: async (data: Omit<SupabaseBusiness, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupabaseBusiness> => {
      try {
        const { data: business, error } = await supabaseAdmin
          .from('Business')
          .insert({
            placeId: data.placeId,
            name: data.name,
            address: data.address,
            state: data.state,
            city: data.city,
            category: data.category,
            photoUrl: data.photoUrl || null,
          })
          .select()
          .single()
        
        if (error) throw new Error(`Failed to create business: ${error.message}`)
        
        return business as SupabaseBusiness
      } catch (err) {
        console.error('Error creating business:', err)
        throw err
      }
    },
  },
  
  reviews: {
    findMany: async (where?: any): Promise<SupabaseReview[]> => {
      try {
        let query = supabaseAdmin.from('Review').select('*')
        
        if (where?.targetUserId) {
          query = query.eq('targetUserId', where.targetUserId)
        }
        if (where?.businessId) {
          query = query.eq('businessId', where.businessId)
        }
        if (where?.targetType) {
          query = query.eq('targetType', where.targetType)
        }
        if (where?.reviewerId) {
          query = query.eq('reviewerId', where.reviewerId)
        }
        if (where?.createdAt?.gte) {
          query = query.gte('createdAt', where.createdAt.gte)
        }
        
        const { data, error } = await query
        
        if (error || !data) return []
        
        return data as SupabaseReview[]
      } catch (err) {
        console.error('Error querying Review table:', err)
        return []
      }
    },
    
    findFirst: async (where?: any): Promise<SupabaseReview | null> => {
      try {
        let query = supabaseAdmin.from('Review').select('*')
        
        if (where?.reviewerId) {
          query = query.eq('reviewerId', where.reviewerId)
        }
        if (where?.targetUserId !== undefined) {
          if (where.targetUserId === null) {
            query = query.is('targetUserId', null)
          } else {
            query = query.eq('targetUserId', where.targetUserId)
          }
        }
        if (where?.businessId) {
          query = query.eq('businessId', where.businessId)
        }
        if (where?.targetType) {
          query = query.eq('targetType', where.targetType)
        }
        if (where?.createdAt?.gte) {
          query = query.gte('createdAt', where.createdAt.gte)
        }
        
        const { data, error } = await query.limit(1)
        
        if (error || !data || data.length === 0) return null
        
        return data[0] as SupabaseReview
      } catch (err) {
        console.error('Error querying Review table:', err)
        return null
      }
    },
    
    create: async (data: Omit<SupabaseReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupabaseReview> => {
      try {
        const { data: review, error } = await supabaseAdmin
          .from('Review')
          .insert({
            reviewerId: data.reviewerId,
            targetType: data.targetType,
            targetUserId: data.targetUserId || null,
            businessId: data.businessId,
            rating: data.rating || null,
            starRating: data.starRating || null,
            payCompetitive: data.payCompetitive || null,
            workload: data.workload || null,
            flexibility: data.flexibility || null,
            message: data.message || null,
          })
          .select()
          .single()
        
        if (error) throw new Error(`Failed to create review: ${error.message}`)
        
        return review as SupabaseReview
      } catch (err) {
        console.error('Error creating review:', err)
        throw err
      }
    },
    
    update: async (
      where: { id: string } | { reviewerId: string; targetUserId: string | null; businessId: string; targetType?: string },
      data: Partial<SupabaseReview>
    ): Promise<SupabaseReview> => {
      try {
        const updateData: any = {
          ...data,
          updatedAt: new Date().toISOString(),
        }
        // Ensure rating fields are included if provided
        if (data.starRating !== undefined) updateData.starRating = data.starRating
        if (data.payCompetitive !== undefined) updateData.payCompetitive = data.payCompetitive
        if (data.workload !== undefined) updateData.workload = data.workload
        if (data.flexibility !== undefined) updateData.flexibility = data.flexibility
        if (data.message !== undefined) updateData.message = data.message
        
        let query = supabaseAdmin.from('Review').update(updateData)
        
        if ('id' in where) {
          query = query.eq('id', where.id)
        } else {
          query = query.eq('reviewerId', where.reviewerId)
          if (where.targetUserId === null) {
            query = query.is('targetUserId', null)
          } else {
            query = query.eq('targetUserId', where.targetUserId)
          }
          query = query.eq('businessId', where.businessId)
          if (where.targetType) {
            query = query.eq('targetType', where.targetType)
          }
        }
        
        const { data: updated, error } = await query.select().single()
        
        if (error) throw new Error(`Failed to update review: ${error.message}`)
        
        return updated as SupabaseReview
      } catch (err) {
        console.error('Error updating review:', err)
        throw err
      }
    },
    
    deleteMany: async (where?: any): Promise<void> => {
      try {
        let query = supabaseAdmin.from('Review').delete()
        
        if (where?.reviewerId) {
          query = query.eq('reviewerId', where.reviewerId)
        }
        if (where?.targetUserId !== undefined) {
          if (where.targetUserId === null) {
            query = query.is('targetUserId', null)
          } else {
            query = query.eq('targetUserId', where.targetUserId)
          }
        }
        if (where?.businessId) {
          query = query.eq('businessId', where.businessId)
        }
        if (where?.targetType) {
          query = query.eq('targetType', where.targetType)
        }
        
        await query
      } catch (err) {
        console.error('Error deleting reviews:', err)
        // Don't throw - allow deleteMany to fail silently
      }
    },
  },
  
  otps: {
    create: async (data: SupabaseOtp): Promise<void> => {
      try {
        const { error } = await supabaseAdmin.from('Otp').insert({
          email: data.email,
          hash: data.hash,
          expiresAt: data.expiresAt,
        })
        
        if (error) throw new Error(`Failed to create OTP: ${error.message}`)
      } catch (err) {
        console.error('Error creating OTP:', err)
        throw err
      }
    },
    
    findFirst: async (where: { email: string }): Promise<SupabaseOtp | null> => {
      try {
        const { data, error } = await supabaseAdmin
          .from('Otp')
          .select('*')
          .eq('email', where.email)
          .order('createdAt', { ascending: false })
          .limit(1)
          .single()
        
        if (error || !data) return null
        
        return data as SupabaseOtp
      } catch (err) {
        console.error('Error querying Otp table:', err)
        return null
      }
    },
    
    delete: async (where: { email: string }): Promise<void> => {
      try {
        await supabaseAdmin.from('Otp').delete().eq('email', where.email)
      } catch (err) {
        console.error('Error deleting OTP:', err)
        // Don't throw - allow delete to fail silently
      }
    },
    
    deleteMany: async (where: { email: string }): Promise<void> => {
      try {
        await supabaseAdmin.from('Otp').delete().eq('email', where.email)
      } catch (err) {
        console.error('Error deleting OTPs:', err)
        // Don't throw - allow deleteMany to fail silently
      }
    },
  },
  
  passwordResetTokens: {
    create: async (data: Omit<SupabasePasswordResetToken, 'id' | 'createdAt'>): Promise<void> => {
      try {
        const { error } = await supabaseAdmin.from('PasswordResetToken').insert({
          id: randomUUID(),
          userId: data.userId,
          token: data.token,
          expiresAt: data.expiresAt,
        })
        
        if (error) throw new Error(`Failed to create password reset token: ${error.message}`)
      } catch (err) {
        console.error('Error creating password reset token:', err)
        throw err
      }
    },
    
    findFirst: async (where: { token: string }): Promise<SupabasePasswordResetToken | null> => {
      try {
        const { data, error } = await supabaseAdmin
          .from('PasswordResetToken')
          .select('*')
          .eq('token', where.token)
          .limit(1)
          .single()
        
        if (error || !data) return null
        
        return data as SupabasePasswordResetToken
      } catch (err) {
        console.error('Error querying PasswordResetToken table:', err)
        return null
      }
    },
    
    delete: async (where: { token: string }): Promise<void> => {
      try {
        await supabaseAdmin.from('PasswordResetToken').delete().eq('token', where.token)
      } catch (err) {
        console.error('Error deleting password reset token:', err)
        // Don't throw - allow delete to fail silently
      }
    },
    
    deleteMany: async (where: { userId: string }): Promise<void> => {
      try {
        await supabaseAdmin.from('PasswordResetToken').delete().eq('userId', where.userId)
      } catch (err) {
        console.error('Error deleting password reset tokens:', err)
        // Don't throw - allow deleteMany to fail silently
      }
    },
  },
  
  pendingSignups: {
    create: async (data: Omit<SupabasePendingSignup, 'id' | 'createdAt'>): Promise<SupabasePendingSignup> => {
      try {
        const { data: pendingSignup, error } = await supabaseAdmin
          .from('PendingSignup')
          .insert({
            id: randomUUID(),
            email: data.email,
            role: data.role,
            firstName: data.firstName,
            lastName: data.lastName,
            password: data.password,
            socialUrl: data.socialUrl || null,
            photoUrl: data.photoUrl || null,
            state: data.state || null,
            city: data.city || null,
            position: data.position || null,
            businessId: data.businessId || null,
            expiresAt: data.expiresAt,
          })
          .select()
          .single()
        
        if (error) throw new Error(`Failed to create pending signup: ${error.message}`)
        
        return pendingSignup as SupabasePendingSignup
      } catch (err) {
        console.error('Error creating pending signup:', err)
        throw err
      }
    },
    
    findUnique: async (where: { email: string }): Promise<SupabasePendingSignup | null> => {
      try {
        const { data, error } = await supabaseAdmin
          .from('PendingSignup')
          .select('*')
          .eq('email', where.email)
          .single()
        
        if (error || !data) return null
        
        // Check if expired
        if (new Date(data.expiresAt) < new Date()) {
          // Delete expired record
          await supabaseAdmin.from('PendingSignup').delete().eq('email', where.email)
          return null
        }
        
        return data as SupabasePendingSignup
      } catch (err) {
        console.error('Error querying PendingSignup table:', err)
        return null
      }
    },
    
    delete: async (where: { email: string }): Promise<void> => {
      try {
        await supabaseAdmin.from('PendingSignup').delete().eq('email', where.email)
      } catch (err) {
        console.error('Error deleting pending signup:', err)
        // Don't throw - allow delete to fail silently
      }
    },
  },
}
