// Script to fetch businesses from Google Places API for Crescent City, CA
// and store in Supabase without duplicates

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
  console.log('No .env.local or .env file found, using environment variables')
}

// Hardcoded credentials
const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'
const googleApiKey = 'AIzaSyBL93Gk1-09JMsgsRNng-BGnatZ6FFvG8Y'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Map Google Places types to our categories
const mapCategory = (types: string[]): string => {
  if (types.includes('lodging') || types.includes('hotel')) return 'Hotel'
  if (types.includes('restaurant')) return 'Restaurant'
  if (types.includes('cafe')) return 'Cafe'
  if (types.includes('bar') || types.includes('night_club')) return 'Bar'
  if (types.includes('resort')) return 'Resort'
  if (types.includes('casino')) return 'Casino'
  if (types.includes('food') && types.includes('truck')) return 'FoodTruck'
  if (types.includes('catering')) return 'Catering'
  if (types.includes('brewery')) return 'Brewery'
  return 'Restaurant' // default
}

async function searchPlaces(query: string, location: string, pageToken?: string) {
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=50000&key=${googleApiKey}`
  
  if (pageToken) {
    url += `&pagetoken=${pageToken}`
  }
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error(`Error searching places: ${data.status}`, data.error_message)
    return { results: [], nextPageToken: null }
  }
  
  return { 
    results: data.results || [], 
    nextPageToken: data.next_page_token || null 
  }
}

async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,address_components,types,photos&key=${googleApiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    console.error(`Error getting place details: ${data.status}`)
    return null
  }
  
  return data.result
}

function getPlacePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${googleApiKey}`
}

async function main() {
  console.log('🔍 Fetching businesses from Google Places API for Crescent City, CA...\n')

  // Crescent City coordinates
  const location = '41.7558,-124.2026'
  
  // Search queries for Crescent City hospitality businesses
  const searches = [
    'restaurant Crescent City California',
    'hotel Crescent City California',
    'lodging Crescent City California',
    'motel Crescent City California',
    'cafe Crescent City California',
    'bar Crescent City California',
    'food Crescent City California',
    'dining Crescent City California',
  ]

  const businesses = new Map<string, any>()

  // Get existing businesses from database to check for duplicates by name
  const { data: existingBusinesses } = await supabaseAdmin
    .from('Business')
    .select('id, name, placeId')
  
  const existingNames = new Set((existingBusinesses || []).map((b: any) => b.name.toLowerCase().trim()))
  const existingPlaceIds = new Set((existingBusinesses || []).map((b: any) => b.placeId).filter(Boolean))
  
  console.log(`📊 Found ${existingBusinesses?.length || 0} existing businesses in database\n`)

  for (const query of searches) {
    console.log(`\n🔎 Searching: ${query}`)
    
    let pageToken: string | null = null
    let pageNum = 1
    
    do {
      if (pageToken) {
        // Google requires a short delay before using next_page_token
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      const { results, nextPageToken } = await searchPlaces(query, location, pageToken || undefined)
      console.log(`   Page ${pageNum}: Found ${results.length} results`)
      
      for (const place of results) {
        // Skip if already processed
        if (businesses.has(place.place_id)) continue
        
        // Skip if placeId already exists in database
        if (existingPlaceIds.has(place.place_id)) {
          console.log(`   ⏭️  Skipped (placeId exists): ${place.name}`)
          continue
        }
        
        // Skip if name already exists in database (case-insensitive)
        if (existingNames.has(place.name.toLowerCase().trim())) {
          console.log(`   ⏭️  Skipped (name exists): ${place.name}`)
          continue
        }
        
        const details = await getPlaceDetails(place.place_id)
        if (!details) continue
        
        // Extract state and city from address components
        let state = 'CA'
        let city = 'Crescent City'
        let address = place.formatted_address || details.formatted_address
        
        if (details.address_components) {
          for (const component of details.address_components) {
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name
            }
            if (component.types.includes('locality')) {
              city = component.long_name
            }
          }
        }
        
        // Only include Crescent City businesses
        if (city.toLowerCase() !== 'crescent city') {
          console.log(`   ⏭️  Skipped (not in Crescent City): ${place.name} - ${city}`)
          continue
        }
        
        const category = mapCategory(place.types || details.types || [])
        
        // Get photo URL if available
        let photoUrl: string | null = null
        if (details.photos && details.photos.length > 0) {
          photoUrl = getPlacePhotoUrl(details.photos[0].photo_reference, 400)
        } else if (place.photos && place.photos.length > 0) {
          photoUrl = getPlacePhotoUrl(place.photos[0].photo_reference, 400)
        }
        
        businesses.set(place.place_id, {
          placeId: place.place_id,
          name: place.name || details.name,
          address: address,
          state: state,
          city: city,
          category: category,
          photoUrl: photoUrl,
        })
        
        console.log(`   ✓ Found: ${place.name} (${category})`)
        
        // Rate limiting - wait 100ms between detail requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      pageToken = nextPageToken
      pageNum++
    } while (pageToken && pageNum <= 3) // Max 3 pages per search (60 results)
    
    // Wait between searches
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n📦 Found ${businesses.size} new unique businesses to add`)
  
  if (businesses.size === 0) {
    console.log('✨ No new businesses to add!')
    return
  }
  
  console.log('\nStoring in database...\n')

  let created = 0
  let errors = 0

  for (const business of businesses.values()) {
    const { error } = await supabaseAdmin
      .from('Business')
      .insert({
        placeId: business.placeId,
        name: business.name,
        address: business.address,
        state: business.state,
        city: business.city,
        category: business.category,
        photoUrl: business.photoUrl || null,
      })

    if (error) {
      console.error(`  ❌ Error creating ${business.name}:`, error.message)
      errors++
    } else {
      console.log(`  ✅ Created: ${business.name} (${business.category})${business.photoUrl ? ' 📷' : ''}`)
      created++
    }
  }

  console.log(`\n✨ Done! Created: ${created}, Errors: ${errors}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
