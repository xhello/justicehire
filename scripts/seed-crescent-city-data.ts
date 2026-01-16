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

// Fake names for variety
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young']

const positions = ['Owner', 'Manager', 'Supervisor on Duty']

const businessReviewMessages = [
  'Great place to work! The management is very supportive and the work environment is positive.',
  'Excellent business with fair treatment of employees. Highly recommend!',
  'Good experience overall, though there are some areas for improvement in communication.',
  'The business has a great team and good work-life balance. Very satisfied!',
  'Decent place to work, but management could be more responsive to employee concerns.',
  'Outstanding business! The best place I\'ve worked in the hospitality industry.',
  'Good business with friendly staff. The pay is competitive for the area.',
  'Average experience. Some good aspects but also some challenges with scheduling.',
  'Wonderful business with excellent leadership. They really care about their employees.',
  'Solid business with good benefits. Would recommend to others looking for work.',
]

async function main() {
  console.log('🌱 Seeding Crescent City, CA data for all businesses...')

  try {
    // Get all businesses in Crescent City, CA
    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('Business')
      .select('*')
      .eq('state', 'CA')
      .eq('city', 'Crescent City')

    if (businessError) {
      throw new Error(`Error fetching businesses: ${businessError.message}`)
    }

    if (!businesses || businesses.length === 0) {
      console.log('⚠️  No businesses found in Crescent City, CA')
      return
    }

    console.log(`Found ${businesses.length} businesses in Crescent City, CA`)

    const allUserIds: string[] = []
    const allEmployerIds: string[] = []
    const allEmployeeIds: string[] = []

    // Process each business
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i]
      console.log(`\n📊 Processing business: ${business.name}`)

      // Create 1-2 employers for this business
      const numEmployers = 1 + (i % 2) // 1 or 2 employers
      const employersForBusiness: string[] = []

      for (let j = 0; j < numEmployers; j++) {
        const firstName = firstNames[(i * 2 + j) % firstNames.length]
        const lastName = lastNames[(i * 3 + j) % lastNames.length]
        const email = `employer.${business.id.slice(0, 8)}.${j}@crescentcity.com`
        const position = positions[j % positions.length]

        // Check if employer exists
        const { data: existing } = await supabaseAdmin
          .from('User')
          .select('id')
          .eq('email', email)
          .single()

        if (existing) {
          console.log(`  ✓ Employer ${email} already exists`)
          employersForBusiness.push(existing.id)
          allEmployerIds.push(existing.id)
        } else {
          // Create employer
          const { data: user, error: userError } = await supabaseAdmin
            .from('User')
            .insert({
              firstName,
              lastName,
              email,
              role: 'EMPLOYER',
              verified: true,
              state: 'CA',
              city: 'Crescent City',
              position,
              photoUrl: `https://i.pravatar.cc/150?img=${10 + i * 2 + j}`,
            })
            .select('id')
            .single()

          if (userError) {
            console.error(`  ✗ Error creating employer: ${userError.message}`)
            continue
          }

          // Create employer profile
          await supabaseAdmin
            .from('EmployerProfile')
            .insert({
              userId: user.id,
              businessId: business.id,
            })

          // Create OTP
          await supabaseAdmin.from('Otp').upsert({
            email,
            hash: TEST_OTP_HASH,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'email' })

          console.log(`  ✓ Created employer: ${firstName} ${lastName} (${position})`)
          employersForBusiness.push(user.id)
          allEmployerIds.push(user.id)
          allUserIds.push(user.id)
        }
      }

      // Create 3-5 employees
      const numEmployees = 3 + (i % 3) // 3, 4, or 5 employees
      const employeesForBusiness: string[] = []

      for (let j = 0; j < numEmployees; j++) {
        const firstName = firstNames[(i * 3 + j + 20) % firstNames.length]
        const lastName = lastNames[(i * 4 + j + 20) % lastNames.length]
        const email = `employee.${business.id.slice(0, 8)}.${j}@crescentcity.com`

        // Check if employee exists
        const { data: existing } = await supabaseAdmin
          .from('User')
          .select('id')
          .eq('email', email)
          .single()

        if (existing) {
          console.log(`  ✓ Employee ${email} already exists`)
          employeesForBusiness.push(existing.id)
          allEmployeeIds.push(existing.id)
        } else {
          // Create employee
          const { data: user, error: userError } = await supabaseAdmin
            .from('User')
            .insert({
              firstName,
              lastName,
              email,
              role: 'EMPLOYEE',
              verified: true,
              photoUrl: `https://i.pravatar.cc/150?img=${20 + i * 3 + j}`,
            })
            .select('id')
            .single()

          if (userError) {
            console.error(`  ✗ Error creating employee: ${userError.message}`)
            continue
          }

          // Create OTP
          await supabaseAdmin.from('Otp').upsert({
            email,
            hash: TEST_OTP_HASH,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'email' })

          console.log(`  ✓ Created employee: ${firstName} ${lastName}`)
          employeesForBusiness.push(user.id)
          allEmployeeIds.push(user.id)
          allUserIds.push(user.id)
        }
      }

      // Create business reviews (2-3 per business)
      const numBusinessReviews = 2 + (i % 2)
      let businessReviewCount = 0

      for (let j = 0; j < numBusinessReviews && j < employeesForBusiness.length; j++) {
        const reviewerId = employeesForBusiness[j]
        const payCompetitive = 2 + Math.floor(Math.random() * 4) // 2-5
        const workload = 2 + Math.floor(Math.random() * 4) // 2-5
        const flexibility = 2 + Math.floor(Math.random() * 4) // 2-5
        const message = businessReviewMessages[(i * numBusinessReviews + j) % businessReviewMessages.length]

        // Check if review exists
        const { data: existing } = await supabaseAdmin
          .from('Review')
          .select('id')
          .eq('reviewerId', reviewerId)
          .eq('businessId', business.id)
          .eq('targetType', 'BUSINESS')
          .is('targetUserId', null)
          .single()

        if (!existing) {
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
              console.error(`  ✗ Error creating business review: ${error.message}`)
            }
          } else {
            businessReviewCount++
          }
        }
      }
      console.log(`  ✓ Created ${businessReviewCount} business reviews`)

      // Create employee-employer reviews
      // Each employer reviews 2-3 employees
      let employeeReviewCount = 0
      for (const employerId of employersForBusiness) {
        const employeesToReview = employeesForBusiness.slice(0, 2 + (i % 2))
        for (const employeeId of employeesToReview) {
          const ratings = ['OUTSTANDING', 'DELIVERED_AS_EXPECTED', 'GOT_NOTHING_NICE_TO_SAY'] as const
          const rating = ratings[Math.floor(Math.random() * ratings.length)]

          // Check if review exists
          const { data: existing } = await supabaseAdmin
            .from('Review')
            .select('id')
            .eq('reviewerId', employerId)
            .eq('targetUserId', employeeId)
            .eq('businessId', business.id)
            .single()

          if (!existing) {
            await supabaseAdmin
              .from('Review')
              .insert({
                reviewerId: employerId,
                targetType: 'EMPLOYEE',
                targetUserId: employeeId,
                businessId: business.id,
                rating,
                starRating: null,
                message: null,
              })
            employeeReviewCount++
          }
        }
      }

      // Each employee reviews 1-2 employers
      let employerReviewCount = 0
      for (const employeeId of employeesForBusiness) {
        const employersToReview = employersForBusiness.slice(0, Math.min(2, employersForBusiness.length))
        for (const employerId of employersToReview) {
          const ratings = ['OUTSTANDING', 'DELIVERED_AS_EXPECTED', 'GOT_NOTHING_NICE_TO_SAY'] as const
          const rating = ratings[Math.floor(Math.random() * ratings.length)]

          // Check if review exists
          const { data: existing } = await supabaseAdmin
            .from('Review')
            .select('id')
            .eq('reviewerId', employeeId)
            .eq('targetUserId', employerId)
            .eq('businessId', business.id)
            .single()

          if (!existing) {
            await supabaseAdmin
              .from('Review')
              .insert({
                reviewerId: employeeId,
                targetType: 'EMPLOYER',
                targetUserId: employerId,
                businessId: business.id,
                rating,
                starRating: null,
                message: null,
              })
            employerReviewCount++
          }
        }
      }
      console.log(`  ✓ Created ${employeeReviewCount} employee reviews and ${employerReviewCount} employer reviews`)
    }

    console.log('\n✅ Seeding complete!')
    console.log(`\nSummary:`)
    console.log(`  - Businesses processed: ${businesses.length}`)
    console.log(`  - Total employers: ${allEmployerIds.length}`)
    console.log(`  - Total employees: ${allEmployeeIds.length}`)
    console.log(`\nAll users can log in with OTP: 000000`)

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
