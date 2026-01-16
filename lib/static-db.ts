// Static database layer - replaces Prisma for MVP
import {
  staticUsers,
  staticBusinesses,
  staticReviews,
  staticOtps,
  type StaticUser,
  type StaticBusiness,
  type StaticReview,
  type StaticOtp,
} from './static-data'

// Helper to generate IDs
function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// User operations
export const staticDb = {
  users: {
    findUnique: async (where: { id?: string; email?: string }): Promise<StaticUser | null> => {
      if (where.id) {
        return staticUsers.find((u) => u.id === where.id) || null
      }
      if (where.email) {
        return staticUsers.find((u) => u.email === where.email) || null
      }
      return null
    },
    findMany: async (where?: any): Promise<StaticUser[]> => {
      let results = [...staticUsers]
      if (where?.role) {
        results = results.filter((u) => u.role === where.role)
      }
      return results
    },
    create: async (data: Omit<StaticUser, 'id' | 'createdAt'>): Promise<StaticUser> => {
      const user: StaticUser = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }
      staticUsers.push(user)
      return user
    },
    update: async (where: { id?: string; email?: string }, data: Partial<StaticUser>): Promise<StaticUser> => {
      const user = await staticDb.users.findUnique(where)
      if (!user) throw new Error('User not found')
      Object.assign(user, data)
      return user
    },
  },

  businesses: {
    findUnique: async (where: { id?: string; placeId?: string }): Promise<StaticBusiness | null> => {
      if (where.id) {
        return staticBusinesses.find((b) => b.id === where.id) || null
      }
      if (where.placeId) {
        return staticBusinesses.find((b) => b.placeId === where.placeId) || null
      }
      return null
    },
    findMany: async (where?: any): Promise<StaticBusiness[]> => {
      let results = [...staticBusinesses]
      if (where?.state) {
        results = results.filter((b) => b.state === where.state)
      }
      if (where?.city) {
        results = results.filter((b) => b.city === where.city)
      }
      if (where?.category) {
        results = results.filter((b) => b.category === where.category)
      }
      return results
    },
    create: async (data: Omit<StaticBusiness, 'id' | 'createdAt'>): Promise<StaticBusiness> => {
      const business: StaticBusiness = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }
      staticBusinesses.push(business)
      return business
    },
  },

  reviews: {
    findMany: async (where?: any): Promise<StaticReview[]> => {
      let results = [...staticReviews]
      if (where?.targetUserId) {
        results = results.filter((r) => r.targetUserId === where.targetUserId)
      }
      if (where?.businessId) {
        results = results.filter((r) => r.businessId === where.businessId)
      }
      if (where?.targetType) {
        results = results.filter((r) => r.targetType === where.targetType)
      }
      if (where?.reviewerId) {
        results = results.filter((r) => r.reviewerId === where.reviewerId)
      }
      if (where?.createdAt?.gte) {
        const date = new Date(where.createdAt.gte)
        results = results.filter((r) => new Date(r.createdAt) >= date)
      }
      return results
    },
    findFirst: async (where?: any): Promise<StaticReview | null> => {
      // If all conditions are specified, find exact match
      if (where?.reviewerId && where?.targetUserId && where?.businessId) {
        const review = staticReviews.find(
          (r) =>
            r.reviewerId === where.reviewerId &&
            r.targetUserId === where.targetUserId &&
            r.businessId === where.businessId
        )
        return review || null
      }
      if (where?.reviewerId && where?.targetUserId && where?.businessId && where?.createdAt?.gte) {
        const date = new Date(where.createdAt.gte)
        const review = staticReviews.find(
          (r) =>
            r.reviewerId === where.reviewerId &&
            r.targetUserId === where.targetUserId &&
            r.businessId === where.businessId &&
            new Date(r.createdAt) >= date
        )
        return review || null
      }
      const results = await staticDb.reviews.findMany(where)
      return results[0] || null
    },
    update: async (where: { id: string } | { reviewerId: string; targetUserId: string; businessId: string }, data: Partial<StaticReview>): Promise<StaticReview> => {
      let reviewIndex = -1
      
      if ('id' in where) {
        // Try to find by ID first
        reviewIndex = staticReviews.findIndex((r) => r.id === where.id)
      }
      
      // If ID lookup failed, try to find by combination
      if (reviewIndex === -1 && 'reviewerId' in where) {
        reviewIndex = staticReviews.findIndex(
          (r) =>
            r.reviewerId === where.reviewerId &&
            r.targetUserId === where.targetUserId &&
            r.businessId === where.businessId
        )
      }
      
      if (reviewIndex === -1) {
        throw new Error('Review not found')
      }
      
      const review = staticReviews[reviewIndex]
      staticReviews[reviewIndex] = {
        ...review,
        ...data,
        updatedAt: new Date().toISOString(),
      }
      return staticReviews[reviewIndex]
    },
    create: async (data: Omit<StaticReview, 'id' | 'createdAt'>): Promise<StaticReview> => {
      const review: StaticReview = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }
      staticReviews.push(review)
      return review
    },
    deleteMany: async (where?: any): Promise<void> => {
      if (!where) {
        staticReviews.length = 0
        return
      }
      // Filter out reviews that match the where clause
      if (where.reviewerId && where.targetUserId && where.businessId) {
        const index = staticReviews.findIndex(
          (r) =>
            r.reviewerId === where.reviewerId &&
            r.targetUserId === where.targetUserId &&
            r.businessId === where.businessId
        )
        if (index !== -1) {
          staticReviews.splice(index, 1)
        }
      }
    },
  },

  otps: {
    create: async (data: StaticOtp): Promise<void> => {
      staticOtps.set(data.email, data)
    },
    findFirst: async (where: { email: string }): Promise<StaticOtp | null> => {
      return staticOtps.get(where.email) || null
    },
    delete: async (where: { email: string }): Promise<void> => {
      staticOtps.delete(where.email)
    },
    deleteMany: async (where: { email: string }): Promise<void> => {
      staticOtps.delete(where.email)
    },
  },
}
