// Script to seed more realistic hospitality businesses for CA and OR
// This manually creates businesses without needing Google Places API

// Load environment variables FIRST
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

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

async function main() {
  console.log('🌱 Seeding additional hospitality businesses...\n')

  // Realistic hospitality businesses for CA and OR
  const businesses = [
    // Crescent City, CA
    { placeId: 'cc-restaurant-1', name: 'Chart Room Restaurant', address: '130 Anchor Way', city: 'Crescent City', state: 'CA', category: 'Restaurant' },
    { placeId: 'cc-restaurant-2', name: 'Good Harvest Cafe', address: '575 H Street', city: 'Crescent City', state: 'CA', category: 'Cafe' },
    { placeId: 'cc-hotel-1', name: 'Crescent Beach Motel', address: '1455 Highway 101 South', city: 'Crescent City', state: 'CA', category: 'Hotel' },
    { placeId: 'cc-hotel-2', name: 'Curly Redwood Lodge', address: '701 Highway 101 South', city: 'Crescent City', state: 'CA', category: 'Motel' },
    { placeId: 'cc-bar-1', name: 'Beachcomber Bar & Grill', address: '100 Anchor Way', city: 'Crescent City', state: 'CA', category: 'Bar' },
    
    // Brookings, OR
    { placeId: 'br-restaurant-1', name: 'Matties Pancake House', address: '15975 Highway 101', city: 'Brookings', state: 'OR', category: 'Restaurant' },
    { placeId: 'br-restaurant-2', name: 'Superfly Martini Bar & Grill', address: '16362 Lower Harbor Road', city: 'Brookings', state: 'OR', category: 'Restaurant' },
    { placeId: 'br-hotel-1', name: 'Best Western Plus Beachfront Inn', address: '16008 Boat Basin Road', city: 'Brookings', state: 'OR', category: 'Hotel' },
    { placeId: 'br-hotel-2', name: 'Spindrift Motor Inn', address: '1215 Chetco Avenue', city: 'Brookings', state: 'OR', category: 'Motel' },
    { placeId: 'br-cafe-1', name: 'The Coffee Hut', address: '16330 Lower Harbor Road', city: 'Brookings', state: 'OR', category: 'Cafe' },
    
    // Eureka, CA
    { placeId: 'eu-restaurant-1', name: 'Cafe Waterfront', address: '102 F Street', city: 'Eureka', state: 'CA', category: 'Restaurant' },
    { placeId: 'eu-restaurant-2', name: 'Lost Coast Brewery & Cafe', address: '617 4th Street', city: 'Eureka', state: 'CA', category: 'Brewery' },
    { placeId: 'eu-hotel-1', name: 'Carter House Inns', address: '301 L Street', city: 'Eureka', state: 'CA', category: 'Hotel' },
    { placeId: 'eu-hotel-2', name: 'Best Western Plus Bayshore Inn', address: '3500 Broadway', city: 'Eureka', state: 'CA', category: 'Hotel' },
    { placeId: 'eu-bar-1', name: 'The Speakeasy', address: '411 Opera Alley', city: 'Eureka', state: 'CA', category: 'Bar' },
    { placeId: 'eu-brewery-1', name: 'Redwood Curtain Brewing Company', address: '1595 Buttermilk Lane', city: 'Eureka', state: 'CA', category: 'Brewery' },
    
    // Additional CA locations
    { placeId: 'ca-restaurant-3', name: 'Seascape Restaurant', address: '1001 2nd Street', city: 'Crescent City', state: 'CA', category: 'Restaurant' },
    { placeId: 'ca-cafe-2', name: 'Java Hut', address: '240 H Street', city: 'Crescent City', state: 'CA', category: 'Cafe' },
    
    // Additional OR locations
    { placeId: 'or-restaurant-3', name: 'The Chetco River Inn Restaurant', address: '21202 High Prairie Road', city: 'Brookings', state: 'OR', category: 'Restaurant' },
    { placeId: 'or-resort-1', name: 'Wild Rivers Motorcoach Resort', address: '79040 Highway 101', city: 'Brookings', state: 'OR', category: 'Resort' },
  ]

  let created = 0
  let skipped = 0

  for (const business of businesses) {
    // Check if business exists
    const { data: existing } = await supabaseAdmin
      .from('Business')
      .select('id')
      .eq('placeId', business.placeId)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭️  Skipped: ${business.name} (already exists)`)
      skipped++
    } else {
      const { error } = await supabaseAdmin
        .from('Business')
        .insert(business)

      if (error) {
        console.error(`  ❌ Error creating ${business.name}:`, error.message)
      } else {
        console.log(`  ✅ Created: ${business.name} (${business.city}, ${business.state})`)
        created++
      }
    }
  }

  console.log(`\n✨ Done! Created: ${created}, Skipped: ${skipped}`)
  console.log(`\n📊 Total businesses in database: ${businesses.length}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
