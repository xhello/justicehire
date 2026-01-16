// Load environment variables FIRST
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Manually load .env.local
const envPath = resolve(process.cwd(), '.env.local')
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

// Create Supabase admin client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
  console.log('🌱 Seeding Supabase database...')

  try {
    // Create businesses
    console.log('Creating businesses...')
    
    const businesses = [
      {
        placeId: 'fake-place-oceanview-grill',
        name: 'Oceanview Grill',
        address: '123 Harbor Street',
        city: 'Crescent City',
        state: 'CA',
        category: 'Restaurant',
      },
      {
        placeId: 'fake-place-redwood-coast-hotel',
        name: 'Redwood Coast Hotel',
        address: '456 Redwood Avenue',
        city: 'Brookings',
        state: 'OR',
        category: 'Hotel',
      },
      {
        placeId: 'fake-place-sunset-brewery',
        name: 'Sunset Brewery',
        address: '789 Main Street',
        city: 'Eureka',
        state: 'CA',
        category: 'Brewery',
      },
    ]

    const createdBusinesses = []
    for (const business of businesses) {
      // Check if business exists
      const { data: existing } = await supabaseAdmin
        .from('Business')
        .select('id')
        .eq('placeId', business.placeId)
        .single()

      if (existing) {
        console.log(`  ✓ Business "${business.name}" already exists`)
        createdBusinesses.push(existing)
      } else {
        const { data, error } = await supabaseAdmin
          .from('Business')
          .insert(business)
          .select()
          .single()

        if (error) {
          console.error(`  ✗ Error creating business "${business.name}":`, error.message)
        } else {
          console.log(`  ✓ Created business: ${business.name}`)
          createdBusinesses.push(data)
        }
      }
    }

    // Create employers
    console.log('\nCreating employers...')
    
    const employers = [
      {
        firstName: 'John',
        lastName: 'Miller',
        email: 'john.miller@example.com',
        role: 'EMPLOYER' as const,
        verified: true,
        state: 'CA',
        city: 'Crescent City',
        position: 'owner',
        photoUrl: 'https://i.pravatar.cc/150?img=12',
        businessId: createdBusinesses[0].id,
      },
      {
        firstName: 'Sarah',
        lastName: 'Thompson',
        email: 'sarah.thompson@example.com',
        role: 'EMPLOYER' as const,
        verified: true,
        state: 'OR',
        city: 'Brookings',
        position: 'manager',
        photoUrl: 'https://i.pravatar.cc/150?img=47',
        businessId: createdBusinesses[1].id,
      },
    ]

    const createdEmployers = []
    for (const employer of employers) {
      // Check if user exists
      const { data: existing } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', employer.email)
        .maybeSingle()

      if (existing) {
        console.log(`  ✓ Employer "${employer.firstName} ${employer.lastName}" already exists`)
        createdEmployers.push(existing)
      } else {
        const { data: user, error: userError } = await supabaseAdmin
          .from('User')
          .insert({
            firstName: employer.firstName,
            lastName: employer.lastName,
            email: employer.email,
            role: employer.role,
            verified: employer.verified,
            state: employer.state,
            city: employer.city,
            position: employer.position,
            photoUrl: employer.photoUrl,
          })
          .select()
          .single()

        if (userError) {
          console.error(`  ✗ Error creating employer "${employer.firstName} ${employer.lastName}":`, userError.message)
        } else {
          // Create employer profile
          const { error: profileError } = await supabaseAdmin
            .from('EmployerProfile')
            .insert({
              userId: user.id,
              businessId: employer.businessId,
            })

          if (profileError) {
            console.error(`  ✗ Error creating employer profile:`, profileError.message)
          } else {
            console.log(`  ✓ Created employer: ${employer.firstName} ${employer.lastName}`)
            createdEmployers.push(user)
          }
        }
      }
    }

    // Create employees
    console.log('\nCreating employees...')
    
    const employees = [
      {
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex.rivera@example.com',
        role: 'EMPLOYEE' as const,
        verified: true,
        socialUrl: 'https://instagram.com/alexrivera',
        photoUrl: 'https://i.pravatar.cc/150?img=33',
      },
      {
        firstName: 'Emily',
        lastName: 'Chen',
        email: 'emily.chen@example.com',
        role: 'EMPLOYEE' as const,
        verified: true,
        socialUrl: 'https://facebook.com/emilychen',
        photoUrl: 'https://i.pravatar.cc/150?img=45',
      },
      {
        firstName: 'Marcus',
        lastName: 'Lee',
        email: 'marcus.lee@example.com',
        role: 'EMPLOYEE' as const,
        verified: true,
        socialUrl: 'https://instagram.com/marcuslee',
        photoUrl: 'https://i.pravatar.cc/150?img=68',
      },
    ]

    const createdEmployees = []
    for (const employee of employees) {
      // Check if user exists
      const { data: existing } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', employee.email)
        .maybeSingle()

      if (existing) {
        console.log(`  ✓ Employee "${employee.firstName} ${employee.lastName}" already exists`)
        createdEmployees.push(existing)
      } else {
        const { data, error } = await supabaseAdmin
          .from('User')
          .insert({
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            role: employee.role,
            verified: employee.verified,
            socialUrl: employee.socialUrl,
            photoUrl: employee.photoUrl,
          })
          .select()
          .single()

        if (error) {
          console.error(`  ✗ Error creating employee "${employee.firstName} ${employee.lastName}":`, error.message)
        } else {
          console.log(`  ✓ Created employee: ${employee.firstName} ${employee.lastName}`)
          createdEmployees.push(data)
        }
      }
    }

    // Get all user emails (including existing ones)
    const allUserEmails = [
      ...employers.map(e => e.email),
      ...employees.map(e => e.email),
    ]

    // Create OTPs for all users (with test OTP "000000")
    console.log('\nCreating test OTPs (000000)...')
    
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    
    for (const email of allUserEmails) {
      // Delete existing OTPs
      await supabaseAdmin.from('Otp').delete().eq('email', email)
      
      // Create new OTP with hash for "000000"
      const { error } = await supabaseAdmin.from('Otp').insert({
        email,
        hash: TEST_OTP_HASH,
        expiresAt: expiresAt.toISOString(),
      })

      if (error) {
        console.error(`  ✗ Error creating OTP for ${email}:`, error.message)
      } else {
        console.log(`  ✓ Created test OTP for ${email} (use: 000000)`)
      }
    }

    // Get all user IDs by email
    const getUserIds = async (emails: string[]) => {
      const { data } = await supabaseAdmin
        .from('User')
        .select('id, email')
        .in('email', emails)
      
      const emailToId = new Map<string, string>()
      data?.forEach(user => emailToId.set(user.email, user.id))
      return emailToId
    }

    const userIds = await getUserIds(allUserEmails)
    
    // Create some sample reviews
    console.log('\nCreating sample reviews...')
    
    const reviews = [
      {
        reviewerEmail: employees[0].email,
        targetEmail: employers[0].email,
        targetType: 'EMPLOYER' as const,
        businessIndex: 0,
        rating: 'OUTSTANDING' as const,
      },
      {
        reviewerEmail: employees[1].email,
        targetEmail: employers[0].email,
        targetType: 'EMPLOYER' as const,
        businessIndex: 0,
        rating: 'DELIVERED_AS_EXPECTED' as const,
      },
      {
        reviewerEmail: employees[2].email,
        targetEmail: employers[1].email,
        targetType: 'EMPLOYER' as const,
        businessIndex: 1,
        rating: 'GOT_NOTHING_NICE_TO_SAY' as const,
      },
      {
        reviewerEmail: employers[0].email,
        targetEmail: employees[0].email,
        targetType: 'EMPLOYEE' as const,
        businessIndex: 0,
        rating: 'OUTSTANDING' as const,
      },
      {
        reviewerEmail: employers[1].email,
        targetEmail: employees[1].email,
        targetType: 'EMPLOYEE' as const,
        businessIndex: 1,
        rating: 'DELIVERED_AS_EXPECTED' as const,
      },
    ]

    for (const review of reviews) {
      const reviewerId = userIds.get(review.reviewerEmail)
      const targetUserId = userIds.get(review.targetEmail)
      const businessId = createdBusinesses[review.businessIndex]?.id

      if (!reviewerId || !targetUserId || !businessId) {
        console.error(`  ✗ Skipping review - missing IDs`)
        continue
      }

      // Check if review exists
      const { data: existing } = await supabaseAdmin
        .from('Review')
        .select('id')
        .eq('reviewerId', reviewerId)
        .eq('targetUserId', targetUserId)
        .eq('businessId', businessId)
        .maybeSingle()

      if (!existing) {
        const { error } = await supabaseAdmin.from('Review').insert({
          reviewerId,
          targetType: review.targetType,
          targetUserId,
          businessId,
          rating: review.rating,
        })

        if (error) {
          console.error(`  ✗ Error creating review:`, error.message)
        } else {
          console.log(`  ✓ Created review`)
        }
      } else {
        console.log(`  ✓ Review already exists`)
      }
    }

    console.log('\n✅ Seeding complete!')
    console.log('\n📝 Test Accounts:')
    console.log('   All accounts use OTP: 000000')
    console.log('\n   Employers:')
    employers.forEach(e => console.log(`   - ${e.email} (${e.firstName} ${e.lastName})`))
    console.log('\n   Employees:')
    employees.forEach(e => console.log(`   - ${e.email} (${e.firstName} ${e.lastName})`))
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
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
