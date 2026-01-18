// Load environment variables FIRST
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

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

async function main() {
  console.log('🗑️  Clearing all user, review, and related data...')
  console.log('   This will DELETE all users, employees, employers, reviews, and profiles')
  console.log('   Businesses will be KEPT\n')

  try {
    // Step 1: Delete all reviews (they reference users)
    console.log('📋 Step 1: Deleting all reviews...')
    const { count: reviewCount, error: reviewError } = await supabaseAdmin
      .from('Review')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using a condition that matches all)
    
    if (reviewError) {
      // If the above doesn't work, try without condition (delete all)
      const { error: deleteError } = await supabaseAdmin
        .from('Review')
        .delete()
        .gte('createdAt', '1970-01-01') // Delete all with a condition that matches all dates
      
      if (deleteError) {
        console.error('  ❌ Error deleting reviews:', deleteError.message)
      } else {
        console.log('  ✅ Deleted all reviews')
      }
    } else {
      console.log(`  ✅ Deleted ${reviewCount || 0} reviews`)
    }

    // Step 2: Delete all EmployerProfile (they reference users and businesses)
    console.log('\n📋 Step 2: Deleting all employer profiles...')
    const { count: profileCount, error: profileError } = await supabaseAdmin
      .from('EmployerProfile')
      .delete()
      .neq('userId', '00000000-0000-0000-0000-000000000000')
    
    if (profileError) {
      const { error: deleteError } = await supabaseAdmin
        .from('EmployerProfile')
        .delete()
        .gte('userId', '')
      
      if (deleteError) {
        console.error('  ❌ Error deleting employer profiles:', deleteError.message)
      } else {
        console.log('  ✅ Deleted all employer profiles')
      }
    } else {
      console.log(`  ✅ Deleted ${profileCount || 0} employer profiles`)
    }

    // Step 3: Delete all OTP records
    console.log('\n📋 Step 3: Deleting all OTP records...')
    const { error: otpError } = await supabaseAdmin
      .from('Otp')
      .delete()
      .gte('expiresAt', '1970-01-01')
    
    if (otpError) {
      console.error('  ❌ Error deleting OTP records:', otpError.message)
    } else {
      console.log('  ✅ Deleted all OTP records')
    }

    // Step 4: Delete all users (employees and employers)
    console.log('\n📋 Step 4: Deleting all users (employees and employers)...')
    const { count: userCount, error: userError } = await supabaseAdmin
      .from('User')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (userError) {
      const { error: deleteError } = await supabaseAdmin
        .from('User')
        .delete()
        .gte('email', '')
      
      if (deleteError) {
        console.error('  ❌ Error deleting users:', deleteError.message)
      } else {
        console.log('  ✅ Deleted all users')
      }
    } else {
      console.log(`  ✅ Deleted ${userCount || 0} users`)
    }

    // Verify businesses are still there
    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('Business')
      .select('id, name')
      .limit(5)

    console.log(`\n✅ Clear complete!`)
    console.log(`\n📊 Verification:`)
    if (businessError) {
      console.error('  ❌ Error checking businesses:', businessError.message)
    } else {
      console.log(`  ✅ Businesses remain: ${businesses?.length || 0} businesses in database`)
      if (businesses && businesses.length > 0) {
        console.log('  Sample businesses:')
        businesses.forEach((b: any) => {
          console.log(`    - ${b.name}`)
        })
      }
    }

    console.log('\n✨ Done!')
    
  } catch (error: any) {
    console.error('❌ Error clearing data:', error.message)
    process.exit(1)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
