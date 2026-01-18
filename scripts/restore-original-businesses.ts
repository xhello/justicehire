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

// Original 3 businesses
const originalBusinesses = [
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

async function main() {
  console.log('🔄 Restoring original business data...')
  console.log('   This will delete all businesses except the original 3\n')

  try {
    // Get all existing businesses
    const { data: allBusinesses, error: fetchError } = await supabaseAdmin
      .from('Business')
      .select('id, placeId, name')

    if (fetchError) {
      throw new Error(`Failed to fetch businesses: ${fetchError.message}`)
    }

    console.log(`Found ${allBusinesses?.length || 0} existing businesses`)

    // Get the placeIds of original businesses
    const originalPlaceIds = originalBusinesses.map(b => b.placeId)

    // Find businesses to delete (not in original list)
    const businessesToDelete = allBusinesses?.filter(
      b => !originalPlaceIds.includes(b.placeId)
    ) || []

    console.log(`\n📋 Businesses to delete: ${businessesToDelete.length}`)
    if (businessesToDelete.length > 0) {
      businessesToDelete.forEach(b => {
        console.log(`   - ${b.name} (${b.placeId})`)
      })

      // Delete businesses not in original list
      const deleteIds = businessesToDelete.map(b => b.id)
      const { error: deleteError } = await supabaseAdmin
        .from('Business')
        .delete()
        .in('id', deleteIds)

      if (deleteError) {
        throw new Error(`Failed to delete businesses: ${deleteError.message}`)
      }

      console.log(`\n✅ Deleted ${businessesToDelete.length} businesses`)
    } else {
      console.log('   (No businesses to delete)')
    }

    // Upsert original businesses
    console.log('\n📝 Ensuring original 3 businesses exist...')
    
    for (const business of originalBusinesses) {
      // Check if business exists
      const { data: existing } = await supabaseAdmin
        .from('Business')
        .select('id')
        .eq('placeId', business.placeId)
        .maybeSingle()

      if (existing) {
        // Update existing business to ensure data is correct
        const { error: updateError } = await supabaseAdmin
          .from('Business')
          .update({
            name: business.name,
            address: business.address,
            city: business.city,
            state: business.state,
            category: business.category,
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error(`  ✗ Error updating business "${business.name}":`, updateError.message)
        } else {
          console.log(`  ✓ Updated business: ${business.name}`)
        }
      } else {
        // Create new business
        const { error: insertError } = await supabaseAdmin
          .from('Business')
          .insert(business)

        if (insertError) {
          console.error(`  ✗ Error creating business "${business.name}":`, insertError.message)
        } else {
          console.log(`  ✓ Created business: ${business.name}`)
        }
      }
    }

    // Verify final state
    const { data: finalBusinesses } = await supabaseAdmin
      .from('Business')
      .select('id, name, placeId')
      .order('name')

    console.log(`\n✅ Restore complete!`)
    console.log(`\n📊 Final business count: ${finalBusinesses?.length || 0}`)
    if (finalBusinesses && finalBusinesses.length > 0) {
      console.log('\n   Businesses:')
      finalBusinesses.forEach(b => {
        console.log(`   - ${b.name}`)
      })
    }

    console.log('\n✨ Done!')
    
  } catch (error) {
    console.error('❌ Error restoring businesses:', error)
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
