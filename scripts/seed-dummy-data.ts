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
  console.log('🌱 Seeding dummy data for all categories...')

  try {
    // Get existing businesses to use for employers and reviews
    const { data: existingBusinesses } = await supabaseAdmin
      .from('Business')
      .select('id, name, state, city')
      .limit(10)

    if (!existingBusinesses || existingBusinesses.length === 0) {
      console.log('⚠️  No businesses found. Please run db:fetch-google first to create businesses.')
      return
    }

    console.log(`Found ${existingBusinesses.length} existing businesses`)

    // Create dummy employees
    console.log('Creating dummy employees...')
    const employees = [
      {
        email: 'employee1@test.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=1',
        socialUrl: 'https://linkedin.com/in/sarahjohnson',
      },
      {
        email: 'employee2@test.com',
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=2',
        socialUrl: 'https://linkedin.com/in/michaelchen',
      },
      {
        email: 'employee3@test.com',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=3',
        socialUrl: 'https://linkedin.com/in/emilyrodriguez',
      },
      {
        email: 'employee4@test.com',
        firstName: 'David',
        lastName: 'Kim',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=4',
        socialUrl: 'https://linkedin.com/in/davidkim',
      },
      {
        email: 'employee5@test.com',
        firstName: 'Jessica',
        lastName: 'Martinez',
        role: 'EMPLOYEE' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=5',
        socialUrl: 'https://linkedin.com/in/jessicamartinez',
      },
    ]

    const employeeIds: string[] = []
    for (const emp of employees) {
      const { data: existing } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', emp.email)
        .single()

      if (existing) {
        console.log(`  Employee ${emp.email} already exists, skipping`)
        employeeIds.push(existing.id)
      } else {
        const { data: user, error } = await supabaseAdmin
          .from('User')
          .insert({
            email: emp.email,
            firstName: emp.firstName,
            lastName: emp.lastName,
            role: emp.role,
            verified: emp.verified,
            photoUrl: emp.photoUrl,
            socialUrl: emp.socialUrl,
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
    }

    // Create dummy employers
    console.log('Creating dummy employers...')
    const employers = [
      {
        email: 'employer1@test.com',
        firstName: 'Robert',
        lastName: 'Williams',
        role: 'EMPLOYER' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=6',
        state: 'CA',
        city: 'San Francisco',
        position: 'Owner',
        businessId: existingBusinesses[0].id,
      },
      {
        email: 'employer2@test.com',
        firstName: 'Jennifer',
        lastName: 'Brown',
        role: 'EMPLOYER' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=7',
        state: 'CA',
        city: 'Los Angeles',
        position: 'Manager',
        businessId: existingBusinesses[1]?.id || existingBusinesses[0].id,
      },
      {
        email: 'employer3@test.com',
        firstName: 'James',
        lastName: 'Davis',
        role: 'EMPLOYER' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=8',
        state: 'OR',
        city: 'Portland',
        position: 'Supervisor on Duty',
        businessId: existingBusinesses[2]?.id || existingBusinesses[0].id,
      },
      {
        email: 'employer4@test.com',
        firstName: 'Patricia',
        lastName: 'Miller',
        role: 'EMPLOYER' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=9',
        state: 'CA',
        city: 'San Diego',
        position: 'Owner',
        businessId: existingBusinesses[3]?.id || existingBusinesses[0].id,
      },
      {
        email: 'employer5@test.com',
        firstName: 'Christopher',
        lastName: 'Wilson',
        role: 'EMPLOYER' as const,
        verified: true,
        photoUrl: 'https://i.pravatar.cc/150?img=10',
        state: 'OR',
        city: 'Eugene',
        position: 'Manager',
        businessId: existingBusinesses[4]?.id || existingBusinesses[0].id,
      },
    ]

    const employerIds: string[] = []
    for (const emp of employers) {
      const { data: existing } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', emp.email)
        .single()

      if (existing) {
        console.log(`  Employer ${emp.email} already exists, updating...`)
        // Update user
        await supabaseAdmin
          .from('User')
          .update({
            state: emp.state,
            city: emp.city,
            position: emp.position,
          })
          .eq('id', existing.id)

        // Check if employer profile exists
        const { data: profile } = await supabaseAdmin
          .from('EmployerProfile')
          .select('id')
          .eq('userId', existing.id)
          .single()

        if (!profile) {
          await supabaseAdmin
            .from('EmployerProfile')
            .insert({
              userId: existing.id,
              businessId: emp.businessId,
            })
        } else {
          await supabaseAdmin
            .from('EmployerProfile')
            .update({ businessId: emp.businessId })
            .eq('id', profile.id)
        }

        employerIds.push(existing.id)
      } else {
        const { data: user, error } = await supabaseAdmin
          .from('User')
          .insert({
            email: emp.email,
            firstName: emp.firstName,
            lastName: emp.lastName,
            role: emp.role,
            verified: emp.verified,
            photoUrl: emp.photoUrl,
            state: emp.state,
            city: emp.city,
            position: emp.position,
          })
          .select('id')
          .single()

        if (error) {
          console.error(`  Error creating employer ${emp.email}:`, error.message)
        } else {
          // Create employer profile
          await supabaseAdmin
            .from('EmployerProfile')
            .insert({
              userId: user.id,
              businessId: emp.businessId,
            })

          console.log(`  ✓ Created employer: ${emp.firstName} ${emp.lastName}`)
          employerIds.push(user.id)
        }
      }
    }

    // Create OTPs for all users (password: 000000)
    console.log('Creating OTPs for all users...')
    const allUserIds = [...employeeIds, ...employerIds]
    const allEmails = [...employees.map(e => e.email), ...employers.map(e => e.email)]
    
    for (let i = 0; i < allEmails.length; i++) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      await supabaseAdmin
        .from('Otp')
        .upsert({
          email: allEmails[i],
          hash: TEST_OTP_HASH,
          expiresAt: expiresAt.toISOString(),
        }, {
          onConflict: 'email',
        })
    }
    console.log(`  ✓ Created OTPs for ${allEmails.length} users`)

    // Create business reviews (with new rating fields)
    console.log('Creating business reviews...')
    
    // Delete existing business reviews first to recreate with new fields
    console.log('  Deleting existing business reviews...')
    await supabaseAdmin
      .from('Review')
      .delete()
      .eq('targetType', 'BUSINESS')
      .is('targetUserId', null)
    
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

    const businessReviews = []
    for (let i = 0; i < Math.min(10, existingBusinesses.length); i++) {
      const business = existingBusinesses[i]
      // Create 2-3 reviews per business from different users
      const numReviews = 2 + (i % 2)
      const reviewers = [...employeeIds, ...employerIds].slice(0, numReviews)

      for (let j = 0; j < reviewers.length; j++) {
        const reviewerId = reviewers[j]
        // Generate random ratings for the three new fields (1-5 stars)
        const payCompetitive = 2 + Math.floor(Math.random() * 4) // 2-5 stars
        const workload = 2 + Math.floor(Math.random() * 4) // 2-5 stars
        const flexibility = 2 + Math.floor(Math.random() * 4) // 2-5 stars
        const message = businessReviewMessages[(i * numReviews + j) % businessReviewMessages.length]

        // Check if review already exists
        const { data: existing } = await supabaseAdmin
          .from('Review')
          .select('id')
          .eq('reviewerId', reviewerId)
          .eq('businessId', business.id)
          .eq('targetType', 'BUSINESS')
          .is('targetUserId', null)
          .single()

        if (!existing) {
          // Try to insert with new rating fields
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
            // If columns don't exist, skip for now (user needs to run migration)
            if (error.message.includes('payCompetitive') || error.message.includes('workload') || error.message.includes('flexibility')) {
              console.log(`  ⚠️  Skipping business review - please run supabase-add-business-rating-fields.sql migration first`)
            } else {
              console.error(`  Error creating business review:`, error.message)
            }
          } else {
            businessReviews.push({ 
              business: business.name, 
              payCompetitive, 
              workload, 
              flexibility, 
              message 
            })
          }
        }
      }
    }
    console.log(`  ✓ Created ${businessReviews.length} business reviews`)

    // Create employee-employer reviews
    console.log('Creating employee-employer reviews...')
    let reviewCount = 0
    for (let i = 0; i < Math.min(employerIds.length, 5); i++) {
      const employerId = employerIds[i]
      const employeeReviewers = employeeIds.slice(0, 2) // 2 employees review each employer

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
          const { data: existing } = await supabaseAdmin
            .from('Review')
            .select('id')
            .eq('reviewerId', employeeId)
            .eq('targetUserId', employerId)
            .eq('businessId', profile.businessId)
            .single()

          if (!existing) {
            await supabaseAdmin
              .from('Review')
              .insert({
                reviewerId: employeeId,
                targetType: 'EMPLOYER',
                targetUserId: employerId,
                businessId: profile.businessId,
                rating,
                starRating: null,
                message: null,
              })
            reviewCount++
          }
        }
      }
    }
    console.log(`  ✓ Created ${reviewCount} employee-employer reviews`)

    console.log('\n✅ Dummy data seeding complete!')
    console.log(`\nSummary:`)
    console.log(`  - Employees: ${employeeIds.length}`)
    console.log(`  - Employers: ${employerIds.length}`)
    console.log(`  - Business Reviews: ${businessReviews.length}`)
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
