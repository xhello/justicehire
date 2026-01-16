// Script to fetch businesses from Google Places API and store in Supabase
// Requires: GOOGLE_PLACES_API_KEY in .env.local

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
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

if (!googleApiKey) {
  throw new Error('Missing GOOGLE_PLACES_API_KEY in .env.local')
}

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

async function searchPlaces(query: string, location: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=50000&key=${googleApiKey}&type=restaurant|lodging|food|bar|cafe`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    console.error(`Error searching places: ${data.status}`, data.error_message)
    return []
  }
  
  return data.results || []
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

async function getPlacePhoto(photoReference: string, maxWidth: number = 400): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${googleApiKey}`
    // Return the URL - the browser will fetch the image
    return url
  } catch (error) {
    console.error('Error getting photo URL:', error)
    return null
  }
}

async function main() {
  console.log('🔍 Fetching businesses from Google Places API...\n')

  // Search queries for CA and OR hospitality businesses
  const searches = [
    { query: 'restaurant Crescent City California', state: 'CA', city: 'Crescent City' },
    { query: 'hotel Crescent City California', state: 'CA', city: 'Crescent City' },
    { query: 'restaurant Brookings Oregon', state: 'OR', city: 'Brookings' },
    { query: 'hotel Brookings Oregon', state: 'OR', city: 'Brookings' },
    { query: 'restaurant Eureka California', state: 'CA', city: 'Eureka' },
    { query: 'brewery Eureka California', state: 'CA', city: 'Eureka' },
  ]

  const businesses = new Map<string, any>()

  for (const search of searches) {
    console.log(`Searching: ${search.query}`)
    const location = search.state === 'CA' ? '41.7558,-124.2026' : '42.0526,-124.2830'
    
    const places = await searchPlaces(search.query, location)
    
    for (const place of places) {
      if (businesses.has(place.place_id)) continue
      
      const details = await getPlaceDetails(place.place_id)
      if (!details) continue
      
      // Extract state and city from address components
      let state = search.state
      let city = search.city
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
      
      const category = mapCategory(place.types || details.types || [])
      
      // Get photo URL if available
      let photoUrl: string | null = null
      if (details.photos && details.photos.length > 0) {
        photoUrl = await getPlacePhoto(details.photos[0].photo_reference, 400)
      } else if (place.photos && place.photos.length > 0) {
        photoUrl = await getPlacePhoto(place.photos[0].photo_reference, 400)
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
      
      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Wait between searches
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n📦 Found ${businesses.size} unique businesses`)
  console.log('Storing in database...\n')

  let created = 0
  let skipped = 0

  for (const business of businesses.values()) {
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
      } else {
        console.log(`  ✅ Created: ${business.name} (${business.city}, ${business.state})${business.photoUrl ? ' 📷' : ''}`)
        created++
      }
    }
  }

  console.log(`\n✨ Done! Created: ${created}, Skipped: ${skipped}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
