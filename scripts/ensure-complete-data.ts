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
  console.log('🌱 Ensuring complete data for all businesses in Crescent City, CA...')

  try {
    // Get all businesses in Crescent City, CA
    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('Business')
      .select('*')
      .eq('state', 'CA')
      .eq('city', 'Crescent City')

    if (businessError) {
      console.error('Error fetching businesses:', businessError)
      return
    }

    if (!businesses || businesses.length === 0) {
      console.log('No businesses found in Crescent City, CA')
      return
    }

    console.log(`Found ${businesses.length} businesses in Crescent City, CA`)

    // Get or create employees
    const employeeEmails = [
      'employee1@test.com',
      'employee2@test.com',
      'employee3@test.com',
      'employee4@test.com',
      'employee5@test.com',
    ]

    const employeeIds: string[] = []
    for (const email of employeeEmails) {
      const { data: existing } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) {
        employeeIds.push(existing.id)
      } else {
        const { data: newEmployee, error } = await supabaseAdmin
          .from('User')
          .insert({
            email,
            firstName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            lastName: 'Employee',
            role: 'EMPLOYEE',
            verified: true,
            photoUrl: `https://i.pravatar.cc/150?img=${employeeIds.length + 1}`,
            state: 'CA',
            city: 'Crescent City',
          })
          .select('id')
          .single()

        if (error) {
          console.error(`Error creating employee ${email}:`, error.message)
        } else {
          employeeIds.push(newEmployee.id)
          console.log(`  ✓ Created employee: ${email}`)
        }
      }
    }

    // Ensure OTPs for employees
    for (const email of employeeEmails) {
      await supabaseAdmin
        .from('Otp')
        .upsert({
          email,
          hash: TEST_OTP_HASH,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: 'email',
        })
    }

    // For each business, ensure it has:
    // 1. At least one employer
    // 2. At least one employee review
    // 3. At least one business review with new rating fields

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i]
      console.log(`\nProcessing business: ${business.name}`)

      // 1. Ensure employer exists
      const employerEmail = `employer-${business.id}@test.com`
      let employerId: string | null = null

      const { data: existingEmployer } = await supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', employerEmail)
        .single()

      if (existingEmployer) {
        employerId = existingEmployer.id
        console.log(`  ✓ Employer already exists`)
      } else {
        const { data: newEmployer, error: empError } = await supabaseAdmin
          .from('User')
          .insert({
            email: employerEmail,
            firstName: business.name.split(' ')[0] || 'Business',
            lastName: 'Owner',
            role: 'EMPLOYER',
            verified: true,
            photoUrl: `https://i.pravatar.cc/150?img=${10 + i}`,
            state: 'CA',
            city: 'Crescent City',
            position: 'owner',
          })
          .select('id')
          .single()

        if (empError) {
          console.error(`  ✗ Error creating employer:`, empError.message)
        } else {
          employerId = newEmployer.id
          console.log(`  ✓ Created employer: ${employerEmail}`)

          // Create employer profile
          await supabaseAdmin
            .from('EmployerProfile')
            .insert({
              userId: employerId,
              businessId: business.id,
            })

          // Create OTP for employer
          await supabaseAdmin
            .from('Otp')
            .upsert({
              email: employerEmail,
              hash: TEST_OTP_HASH,
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            }, {
              onConflict: 'email',
            })
        }
      }

      // 2. Ensure employee reviews exist (employees reviewing employers)
      if (employerId) {
        for (let j = 0; j < Math.min(2, employeeIds.length); j++) {
          const employeeId = employeeIds[j]
          
          const { data: existingReview } = await supabaseAdmin
            .from('Review')
            .select('id')
            .eq('reviewerId', employeeId)
            .eq('targetUserId', employerId)
            .eq('businessId', business.id)
            .eq('targetType', 'EMPLOYER')
            .single()

          if (!existingReview) {
            const ratings = ['OUTSTANDING', 'DELIVERED_AS_EXPECTED', 'GOT_NOTHING_NICE_TO_SAY'] as const
            const rating = ratings[j % ratings.length]

            await supabaseAdmin
              .from('Review')
              .insert({
                reviewerId: employeeId,
                targetType: 'EMPLOYER',
                targetUserId: employerId,
                businessId: business.id,
                rating,
                payCompetitive: null,
                workload: null,
                flexibility: null,
                message: null,
              })

            console.log(`  ✓ Created employee review for employer`)
          }
        }

        // Ensure employer reviews exist (employers reviewing employees)
        for (let j = 0; j < Math.min(2, employeeIds.length); j++) {
          const employeeId = employeeIds[j]
          
          const { data: existingReview } = await supabaseAdmin
            .from('Review')
            .select('id')
            .eq('reviewerId', employerId)
            .eq('targetUserId', employeeId)
            .eq('businessId', business.id)
            .eq('targetType', 'EMPLOYEE')
            .single()

          if (!existingReview) {
            const ratings = ['OUTSTANDING', 'DELIVERED_AS_EXPECTED', 'GOT_NOTHING_NICE_TO_SAY'] as const
            const rating = ratings[j % ratings.length]

            await supabaseAdmin
              .from('Review')
              .insert({
                reviewerId: employerId,
                targetType: 'EMPLOYEE',
                targetUserId: employeeId,
                businessId: business.id,
                rating,
                payCompetitive: null,
                workload: null,
                flexibility: null,
                message: null,
              })

            console.log(`  ✓ Created employer review for employee`)
          }
        }
      }

      // 3. Ensure business reviews exist (with new rating fields)
      for (let j = 0; j < Math.min(3, employeeIds.length); j++) {
        const reviewerId = employeeIds[j]
        
        const { data: existingReview } = await supabaseAdmin
          .from('Review')
          .select('id')
          .eq('reviewerId', reviewerId)
          .eq('businessId', business.id)
          .eq('targetType', 'BUSINESS')
          .is('targetUserId', null)
          .single()

        if (!existingReview) {
          const payCompetitive = 3 + Math.floor(Math.random() * 3) // 3-5 stars
          const workload = 3 + Math.floor(Math.random() * 3) // 3-5 stars
          const flexibility = 3 + Math.floor(Math.random() * 3) // 3-5 stars
          const messages = [
            'Great place to work! The management is very supportive.',
            'Excellent business with fair treatment of employees.',
            'Good experience overall, positive work environment.',
          ]

          await supabaseAdmin
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
              message: messages[j % messages.length],
            })

          console.log(`  ✓ Created business review with ratings (Pay: ${payCompetitive}, Workload: ${workload}, Flexibility: ${flexibility})`)
        }
      }
    }

    console.log('\n✅ Complete! All businesses in Crescent City, CA now have:')
    console.log('  - At least one employer')
    console.log('  - Employee reviews on employer profiles')
    console.log('  - Employer reviews on employee profiles')
    console.log('  - Business reviews with new rating fields')
    console.log('\nAll test accounts use OTP: 000000')

  } catch (error) {
    console.error('❌ Error:', error)
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
