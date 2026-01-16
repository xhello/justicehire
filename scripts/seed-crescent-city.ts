// Load environment variables FIRST
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Manually load .env.local or .env
try {
  let envPath = resolve(process.cwd(), '.env.local')
  try {
    readFileSync(envPath, 'utf-8')
  } catch {
    envPath = resolve(process.cwd(), '.env')
  }
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (value && !key.startsWith('#')) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
      }
    }
  })
} catch (error) {
  console.log('No .env.local or .env file found, using environment variables or hardcoded values')
}

// Create Supabase admin client directly (with hardcoded fallbacks)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Hash for OTP "000000"
const TEST_OTP_HASH = crypto.createHash('sha256').update('000000').digest('hex')

async function main() {
  console.log('🌱 Seeding Crescent City, California data...')

  try {
    // Delete only non-Crescent City data (keep businesses, but clean up users and reviews)
    console.log('Cleaning up existing users and reviews...')
    await supabaseAdmin.from('Review').delete().neq('id', '')
    await supabaseAdmin.from('EmployerProfile').delete().neq('id', '')
    await supabaseAdmin.from('User').delete().neq('id', '')
    await supabaseAdmin.from('Otp').delete().neq('id', '')
    
    // Delete businesses that are NOT in Crescent City, CA
    await supabaseAdmin
      .from('Business')
      .delete()
      .or('state.neq.CA,city.neq.Crescent City')
    console.log('  ✓ Cleaned up existing data (kept only Crescent City, CA businesses)')

    // Get or create California, Crescent City businesses
    console.log('\nFetching Crescent City businesses...')
    let { data: businesses } = await supabaseAdmin
      .from('Business')
      .select('*')
      .eq('state', 'CA')
      .eq('city', 'Crescent City')
      .limit(10)

    if (!businesses || businesses.length === 0) {
      console.log('  No businesses found, creating sample Crescent City businesses...')
      const sampleBusinesses = [
        {
          placeId: 'crescent-city-1',
          name: 'Good Harvest Cafe',
          address: '575 US-101, Crescent City, CA 95531',
          city: 'Crescent City',
          state: 'CA',
          category: 'Restaurant',
          photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
        },
        {
          placeId: 'crescent-city-2',
          name: 'Oceanview Grill',
          address: '123 Harbor Street, Crescent City, CA 95531',
          city: 'Crescent City',
          state: 'CA',
          category: 'Restaurant',
          photoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
        },
        {
          placeId: 'crescent-city-3',
          name: 'Crescent City Hotel',
          address: '456 Redwood Avenue, Crescent City, CA 95531',
          city: 'Crescent City',
          state: 'CA',
          category: 'Hotel',
          photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop',
        },
        {
          placeId: 'crescent-city-4',
          name: 'Harbor Brewery',
          address: '789 Main Street, Crescent City, CA 95531',
          city: 'Crescent City',
          state: 'CA',
          category: 'Brewery',
          photoUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
        },
        {
          placeId: 'crescent-city-5',
          name: 'Coastal Diner',
          address: '321 Beach Drive, Crescent City, CA 95531',
          city: 'Crescent City',
          state: 'CA',
          category: 'Restaurant',
          photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop',
        },
      ]

      const createdBusinesses = []
      for (const business of sampleBusinesses) {
        const { data, error } = await supabaseAdmin
          .from('Business')
          .insert(business)
          .select()
          .single()

        if (error) {
          console.error(`  Error creating business "${business.name}":`, error.message)
        } else {
          console.log(`  ✓ Created business: ${business.name}`)
          createdBusinesses.push(data)
        }
      }
      businesses = createdBusinesses
    }

    console.log(`  ✓ Found/Created ${businesses.length} businesses in Crescent City, CA`)

    // Update businesses with photo URLs if they don't have them
    console.log('\nUpdating business photos...')
    const businessPhotos: Record<string, string> = {
      'Good Harvest Cafe': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
      'Oceanview Grill': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
      'Crescent City Hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop',
      'Harbor Brewery': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
      'Coastal Diner': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop',
    }

    for (const business of businesses) {
      if (!business.photoUrl && businessPhotos[business.name]) {
        await supabaseAdmin
          .from('Business')
          .update({ photoUrl: businessPhotos[business.name] })
          .eq('id', business.id)
        console.log(`  ✓ Updated photo for ${business.name}`)
      }
    }

    // Create employees (shared across all businesses)
    console.log('\nCreating employees...')
    const employees = [
      {
        email: 'employee1@test.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=1',
      },
      {
        email: 'employee2@test.com',
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=2',
      },
      {
        email: 'employee3@test.com',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=3',
      },
    ]

    const employeeIds: string[] = []
    for (const emp of employees) {
      const { data: user, error } = await supabaseAdmin
        .from('User')
        .insert({
          email: emp.email,
          firstName: emp.firstName,
          lastName: emp.lastName,
          role: emp.role,
          verified: emp.verified,
          photoUrl: emp.photoUrl,
        })
        .select('id')
        .single()

      if (error) {
        console.error(`  Error creating employee ${emp.email}:`, error.message)
      } else {
        console.log(`  ✓ Created employee: ${emp.firstName} ${emp.lastName}`)
        employeeIds.push(user.id)
      }
    }

    // Create one employer per business
    console.log('\nCreating employers (one per business)...')
    const employerIds: string[] = []
    const employerPositions = ['Owner', 'Manager', 'Supervisor on Duty']
    
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i]
      const position = employerPositions[i % employerPositions.length]
      const employer = {
        email: `employer${i + 1}@test.com`,
        firstName: ['Robert', 'Jennifer', 'James', 'Patricia', 'Christopher'][i % 5],
        lastName: ['Williams', 'Brown', 'Davis', 'Miller', 'Wilson'][i % 5],
        role: 'EMPLOYER' as const,
        verified: true,
        photoUrl: `https://i.pravatar.cc/150?img=${6 + i}`,
        state: 'CA',
        city: 'Crescent City',
        position: position.toLowerCase().replace(' ', '_'),
        businessId: business.id,
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('User')
        .insert({
          email: employer.email,
          firstName: employer.firstName,
          lastName: employer.lastName,
          role: employer.role,
          verified: employer.verified,
          photoUrl: employer.photoUrl,
          state: employer.state,
          city: employer.city,
          position: employer.position,
        })
        .select('id')
        .single()

      if (userError) {
        console.error(`  Error creating employer ${employer.email}:`, userError.message)
      } else {
        // Create employer profile
        await supabaseAdmin
          .from('EmployerProfile')
          .insert({
            userId: user.id,
            businessId: employer.businessId,
          })

        console.log(`  ✓ Created employer: ${employer.firstName} ${employer.lastName} (${position}) for ${business.name}`)
        employerIds.push(user.id)
      }
    }

    // Create OTPs for all users
    console.log('\nCreating OTPs for all users...')
    const allEmails = [...employees.map(e => e.email), ...employerIds.map((_, i) => `employer${i + 1}@test.com`)]
    
    for (const email of allEmails) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      await supabaseAdmin
        .from('Otp')
        .upsert({
          email,
          hash: TEST_OTP_HASH,
          expiresAt: expiresAt.toISOString(),
        }, {
          onConflict: 'email',
        })
    }
    console.log(`  ✓ Created OTPs for ${allEmails.length} users`)

    // Create business reviews with new rating fields (2-3 reviews per business)
    console.log('\nCreating business reviews with new rating fields...')
    const businessReviewMessages = [
      'Great place to work! The management is very supportive and the work environment is positive.',
      'Excellent business with fair treatment of employees. Highly recommend!',
      'Good experience overall, though there are some areas for improvement in communication.',
      'The business has a great team and good work-life balance. Very satisfied!',
      'Solid business with good benefits. Would recommend to others looking for work.',
    ]

    let businessReviewCount = 0
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i]
      const numReviews = 2 + (i % 2) // 2-3 reviews per business
      const reviewers = [...employeeIds, ...employerIds].slice(0, numReviews)

      for (let j = 0; j < reviewers.length; j++) {
        const reviewerId = reviewers[j]
        const payCompetitive = 2 + Math.floor(Math.random() * 4) // 2-5 stars
        const workload = 2 + Math.floor(Math.random() * 4) // 2-5 stars
        const flexibility = 2 + Math.floor(Math.random() * 4) // 2-5 stars
        const message = businessReviewMessages[(i * numReviews + j) % businessReviewMessages.length]

        const { error } = await supabaseAdmin
          .from('Review')
          .insert({
            reviewerId,
            targetType: 'BUSINESS',
            targetUserId: null,
            businessId: business.id,
            rating: null,
            payCompetitive,
            workload,
            flexibility,
            message: message || null,
          })

        if (error) {
          if (error.message.includes('payCompetitive') || error.message.includes('workload') || error.message.includes('flexibility')) {
            console.log(`  ⚠️  Skipping business review - please run supabase-add-business-rating-fields.sql migration first`)
          } else {
            console.error(`  Error creating business review:`, error.message)
          }
        } else {
          businessReviewCount++
        }
      }
    }
    console.log(`  ✓ Created ${businessReviewCount} business reviews`)

    // Create employee-employer reviews (each employee reviews 1-2 employers)
    console.log('\nCreating employee-employer reviews...')
    let reviewCount = 0
    for (let i = 0; i < Math.min(employerIds.length, 3); i++) {
      const employerId = employerIds[i]
      const employeeReviewers = employeeIds.slice(0, 1 + (i % 2)) // 1-2 employees review each employer

      for (const employeeId of employeeReviewers) {
        const ratings = ['OUTSTANDING', 'DELIVERED_AS_EXPECTED', 'GOT_NOTHING_NICE_TO_SAY'] as const
        const rating = ratings[Math.floor(Math.random() * ratings.length)]

        // Get employer's business
        const { data: profile } = await supabaseAdmin
          .from('EmployerProfile')
          .select('businessId')
          .eq('userId', employerId)
          .single()

        if (profile) {
          await supabaseAdmin
            .from('Review')
            .insert({
              reviewerId: employeeId,
              targetType: 'EMPLOYER',
              targetUserId: employerId,
              businessId: profile.businessId,
              rating,
              starRating: null,
              payCompetitive: null,
              workload: null,
              flexibility: null,
              message: null,
            })
          reviewCount++
        }
      }
    }
    console.log(`  ✓ Created ${reviewCount} employee-employer reviews`)

    console.log('\n✅ Seeding complete!')
    console.log(`\nSummary:`)
    console.log(`  - Businesses: ${businesses.length} (all in Crescent City, CA)`)
    console.log(`  - Employees: ${employeeIds.length}`)
    console.log(`  - Employers: ${employerIds.length} (one per business)`)
    console.log(`  - Business Reviews: ${businessReviewCount} (with new rating fields)`)
    console.log(`  - Employee-Employer Reviews: ${reviewCount}`)
    console.log(`\nAll users can log in with OTP: 000000`)

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
