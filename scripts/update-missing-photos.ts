// Script to fetch photos for businesses that don't have one
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
  console.log('🔍 Finding businesses without photos...\n')

  // Get businesses without photoUrl
  const { data: businesses, error } = await supabaseAdmin
    .from('Business')
    .select('id, name, city, state, placeId, photoUrl')
    .is('photoUrl', null)

  if (error) {
    console.error('Error fetching businesses:', error)
    return
  }

  console.log(`📦 Found ${businesses?.length || 0} businesses without photos\n`)

  if (!businesses || businesses.length === 0) {
    console.log('✨ All businesses have photos!')
    return
  }

  let updated = 0
  let failed = 0

  for (const business of businesses) {
    console.log(`\n🔎 Processing: ${business.name}`)
    
    let photoUrl: string | null = null
    
    // First try using existing placeId
    if (business.placeId) {
      const details = await getPlaceDetails(business.placeId)
      if (details?.photos && details.photos.length > 0) {
        photoUrl = getPlacePhotoUrl(details.photos[0].photo_reference, 400)
      }
    }
    
    // If no photo from placeId, search for the business
    if (!photoUrl) {
      console.log(`   Searching for: ${business.name} ${business.city} ${business.state}`)
      const searchResult = await searchPlace(business.name, business.city, business.state)
      
      if (searchResult) {
        // Update placeId if we don't have one
        if (!business.placeId && searchResult.place_id) {
          await supabaseAdmin
            .from('Business')
            .update({ placeId: searchResult.place_id })
            .eq('id', business.id)
          console.log(`   Updated placeId: ${searchResult.place_id}`)
        }
        
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
      const { error: updateError } = await supabaseAdmin
        .from('Business')
        .update({ photoUrl: photoUrl })
        .eq('id', business.id)
      
      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`)
        failed++
      } else {
        console.log(`   ✅ Photo added!`)
        updated++
      }
    } else {
      console.log(`   ⚠️  No photo found`)
      failed++
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log(`\n✨ Done! Updated: ${updated}, Failed: ${failed}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
