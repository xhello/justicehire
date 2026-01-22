// Script to add Tractor Supply manually
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  console.log('🏪 Adding Tractor Supply to database...\n')

  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from('Business')
    .select('id')
    .eq('name', 'Tractor Supply')
    .eq('city', 'Crescent City')
    .single()

  if (existing) {
    console.log('⏭️  Tractor Supply already exists')
    return
  }

  // Farm/agriculture store image from Unsplash
  const photoUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop'

  // Insert into database
  const { error } = await supabaseAdmin
    .from('Business')
    .insert({
      name: 'Tractor Supply',
      address: '625 M St, Crescent City, CA 95531',
      city: 'Crescent City',
      state: 'CA',
      category: 'Restaurant',
      placeId: 'tractor_supply_crescent_city_manual',
      photoUrl: photoUrl,
    })

  if (error) {
    console.log(`❌ Failed to add: ${error.message}`)
  } else {
    console.log('✅ Tractor Supply added successfully!')
    console.log('   Address: 625 M St, Crescent City, CA 95531')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
