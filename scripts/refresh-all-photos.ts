// Script to refresh all business photo URLs from Google Places
import { createClient } from '@supabase/supabase-js'

// Hardcoded credentials
const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || '' // Set your API key here

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function getPlacePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${googleApiKey}`
}

async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${googleApiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    console.log(`   API Error: ${data.status}`)
    return null
  }
  
  return data.result
}

async function searchPlace(name: string, city: string, state: string) {
  const query = `${name} ${city} ${state}`
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    return null
  }
  
  return data.results[0]
}

async function main() {
  console.log('🔍 Refreshing all business photos...\n')

  // Get all businesses
  const { data: businesses, error } = await supabaseAdmin
    .from('Business')
    .select('id, name, city, state, placeId, photoUrl')
    .order('name')

  if (error) {
    console.error('Error fetching businesses:', error)
    return
  }

  console.log(`📦 Found ${businesses?.length || 0} businesses to process\n`)

  if (!businesses || businesses.length === 0) {
    return
  }

  let updated = 0
  let failed = 0
  let skipped = 0

  for (const business of businesses) {
    process.stdout.write(`🔎 ${business.name}... `)
    
    let photoUrl: string | null = null
    let placeId = business.placeId
    
    // First try using existing placeId
    if (placeId) {
      const details = await getPlaceDetails(placeId)
      if (details?.photos && details.photos.length > 0) {
        photoUrl = getPlacePhotoUrl(details.photos[0].photo_reference, 400)
      }
    }
    
    // If no photo from placeId, search for the business
    if (!photoUrl) {
      const searchResult = await searchPlace(business.name, business.city, business.state)
      
      if (searchResult) {
        placeId = searchResult.place_id
        
        // Get photo from search result
        if (searchResult.photos && searchResult.photos.length > 0) {
          photoUrl = getPlacePhotoUrl(searchResult.photos[0].photo_reference, 400)
        } else {
          // Try getting details for more photos
          const details = await getPlaceDetails(searchResult.place_id)
          if (details?.photos && details.photos.length > 0) {
            photoUrl = getPlacePhotoUrl(details.photos[0].photo_reference, 400)
          }
        }
      }
    }
    
    if (photoUrl) {
      // Update both photoUrl and placeId
      const updateData: any = { photoUrl: photoUrl }
      if (placeId && placeId !== business.placeId) {
        updateData.placeId = placeId
      }
      
      const { error: updateError } = await supabaseAdmin
        .from('Business')
        .update(updateData)
        .eq('id', business.id)
      
      if (updateError) {
        console.log(`❌ Failed`)
        failed++
      } else {
        console.log(`✅ Updated`)
        updated++
      }
    } else {
      console.log(`⚠️ No photo found`)
      failed++
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log(`\n✨ Done! Updated: ${updated}, Failed: ${failed}, Skipped: ${skipped}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
