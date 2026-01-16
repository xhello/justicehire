// Static data for MVP - will be replaced with Supabase later

export interface StaticUser {
  id: string
  role: 'EMPLOYEE' | 'EMPLOYER'
  verified: boolean
  firstName: string
  lastName: string
  email: string
  socialUrl?: string
  photoUrl?: string
  state?: string
  city?: string
  position?: string
  createdAt: string
  employerProfile?: {
    businessId: string
  }
}

export interface StaticBusiness {
  id: string
  placeId: string
  name: string
  address: string
  state: string
  city: string
  category: string
  createdAt: string
}

export interface StaticReview {
  id: string
  reviewerId: string
  targetType: 'EMPLOYEE' | 'EMPLOYER'
  targetUserId: string
  businessId: string
  rating: 'OUTSTANDING' | 'DELIVERED_AS_EXPECTED' | 'GOT_NOTHING_NICE_TO_SAY'
  createdAt: string
  updatedAt?: string
}

export interface StaticOtp {
  email: string
  hash: string
  expiresAt: string
}

// In-memory data stores
export const staticUsers: StaticUser[] = [
  {
    id: 'user-1',
    role: 'EMPLOYER',
    verified: true,
    firstName: 'John',
    lastName: 'Miller',
    email: 'john.miller@example.com',
    state: 'CA',
    city: 'Crescent City',
    photoUrl: 'https://i.pravatar.cc/150?img=12',
    createdAt: new Date().toISOString(),
    employerProfile: {
      businessId: 'business-1',
    },
  },
  {
    id: 'user-2',
    role: 'EMPLOYER',
    verified: true,
    firstName: 'Sarah',
    lastName: 'Thompson',
    email: 'sarah.thompson@example.com',
    state: 'OR',
    city: 'Brookings',
    photoUrl: 'https://i.pravatar.cc/150?img=47',
    createdAt: new Date().toISOString(),
    employerProfile: {
      businessId: 'business-2',
    },
  },
  {
    id: 'user-3',
    role: 'EMPLOYEE',
    verified: true,
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex.rivera@example.com',
    socialUrl: 'https://instagram.com/alexrivera',
    photoUrl: 'https://i.pravatar.cc/150?img=33',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-4',
    role: 'EMPLOYEE',
    verified: true,
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@example.com',
    socialUrl: 'https://facebook.com/emilychen',
    photoUrl: 'https://i.pravatar.cc/150?img=45',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-5',
    role: 'EMPLOYEE',
    verified: true,
    firstName: 'Marcus',
    lastName: 'Lee',
    email: 'marcus.lee@example.com',
    socialUrl: 'https://instagram.com/marcuslee',
    photoUrl: 'https://i.pravatar.cc/150?img=68',
    createdAt: new Date().toISOString(),
  },
]

export const staticBusinesses: StaticBusiness[] = [
  {
    id: 'business-1',
    placeId: 'fake-place-oceanview-grill',
    name: 'Oceanview Grill',
    address: '123 Harbor Street',
    city: 'Crescent City',
    state: 'CA',
    category: 'Restaurant',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'business-2',
    placeId: 'fake-place-redwood-coast-hotel',
    name: 'Redwood Coast Hotel',
    address: '456 Redwood Avenue',
    city: 'Brookings',
    state: 'OR',
    category: 'Hotel',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'business-3',
    placeId: 'fake-place-sunset-brewery',
    name: 'Sunset Brewery',
    address: '789 Main Street',
    city: 'Eureka',
    state: 'CA',
    category: 'Brewery',
    createdAt: new Date().toISOString(),
  },
]

export const staticReviews: StaticReview[] = [
  {
    id: 'review-1',
    reviewerId: 'user-3',
    targetType: 'EMPLOYER',
    targetUserId: 'user-1',
    businessId: 'business-1',
    rating: 'OUTSTANDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'review-2',
    reviewerId: 'user-4',
    targetType: 'EMPLOYER',
    targetUserId: 'user-1',
    businessId: 'business-1',
    rating: 'DELIVERED_AS_EXPECTED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'review-3',
    reviewerId: 'user-5',
    targetType: 'EMPLOYER',
    targetUserId: 'user-2',
    businessId: 'business-2',
    rating: 'GOT_NOTHING_NICE_TO_SAY',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'review-4',
    reviewerId: 'user-1',
    targetType: 'EMPLOYEE',
    targetUserId: 'user-3',
    businessId: 'business-1',
    rating: 'OUTSTANDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'review-5',
    reviewerId: 'user-2',
    targetType: 'EMPLOYEE',
    targetUserId: 'user-4',
    businessId: 'business-2',
    rating: 'DELIVERED_AS_EXPECTED',
    createdAt: new Date().toISOString(),
  },
]

export const staticOtps: Map<string, StaticOtp> = new Map()
