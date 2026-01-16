// Supabase database adapter - replaces static database
import { supabaseAdmin } from './supabase'

// Types matching Prisma schema
export interface SupabaseUser {
  id: string
  role: 'EMPLOYEE' | 'EMPLOYER'
  verified: boolean
  firstName: string
  lastName: string
  email: string
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
        let query = supabaseAdmin.from('User').update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        
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
        // Ensure starRating and message are included if provided
        if (data.starRating !== undefined) updateData.starRating = data.starRating
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
}
