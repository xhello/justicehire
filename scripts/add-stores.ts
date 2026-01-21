// Script to add Walmart and Fred Meyer stores
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const stores = [
  {
    name: 'Walmart Supercenter',
    address: '900 E Washington Blvd, Crescent City, CA 95531',
    city: 'Crescent City',
    state: 'CA',
    category: 'Restaurant', // Using Restaurant as closest category for retail
    photoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop', // Store/retail image
    placeId: 'walmart_crescent_city_manual',
  },
  {
    name: 'Fred Meyer',
    address: '98100 W Benham Ln, Brookings, OR 97415',
    city: 'Brookings',
    state: 'OR',
    category: 'Restaurant', // Using Restaurant as closest category for retail
    photoUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&h=300&fit=crop', // Grocery store image
    placeId: 'fred_meyer_brookings_manual',
  },
]

async function main() {
  console.log('🏪 Adding stores to database...\n')

  for (const store of stores) {
    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('Business')
      .select('id')
      .eq('name', store.name)
      .eq('city', store.city)
      .single()

    if (existing) {
      console.log(`⏭️  Skipped: ${store.name} (${store.city}) - already exists`)
      continue
    }

    const { error } = await supabaseAdmin
      .from('Business')
      .insert(store)

    if (error) {
      console.log(`❌ Failed to add ${store.name}: ${error.message}`)
    } else {
      console.log(`✅ Added: ${store.name} (${store.city}, ${store.state})`)
    }
  }

  console.log('\n✨ Done!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
