// Script to get real Google photos for each business and store in Supabase Storage
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || '' // Set your API key here

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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

async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${googleApiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    return null
  }
  
  return data.result
}

async function downloadGooglePhoto(photoReference: string): Promise<Buffer | null> {
  try {
    // Google Places Photo API - this will redirect to the actual image
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${googleApiKey}`
    
    const response = await fetch(photoUrl, { redirect: 'follow' })
    
    if (!response.ok) {
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    return null
  }
}

async function uploadToStorage(buffer: Buffer, filename: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('business-photos')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.log(`   Upload error: ${error.message}`)
      return null
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('business-photos')
      .getPublicUrl(filename)

    return urlData.publicUrl
  } catch (error) {
    return null
  }
}

async function main() {
  console.log('📸 Getting real Google photos for all businesses...\n')

  // Get all businesses
  const { data: businesses, error } = await supabaseAdmin
    .from('Business')
    .select('id, name, city, state, placeId, photoUrl')
    .order('name')

  if (error) {
    console.error('Error fetching businesses:', error)
    return
  }

  console.log(`📦 Found ${businesses?.length || 0} businesses\n`)

  let updated = 0
  let failed = 0
  let skipped = 0

  for (const business of businesses || []) {
    // Skip if already has Supabase Storage URL
    if (business.photoUrl?.includes('supabase.co/storage')) {
      console.log(`⏭️  ${business.name} - already has stored photo`)
      skipped++
      continue
    }

    process.stdout.write(`📥 ${business.name}... `)

    let photoReference: string | null = null
    let placeId = business.placeId

    // First try using existing placeId
    if (placeId) {
      const details = await getPlaceDetails(placeId)
      if (details?.photos && details.photos.length > 0) {
        photoReference = details.photos[0].photo_reference
      }
    }

    // If no photo from placeId, search for the business
    if (!photoReference) {
      const searchResult = await searchPlace(business.name, business.city, business.state)
      
      if (searchResult) {
        placeId = searchResult.place_id
        
        if (searchResult.photos && searchResult.photos.length > 0) {
          photoReference = searchResult.photos[0].photo_reference
        } else {
          // Try getting details for more photos
          const details = await getPlaceDetails(searchResult.place_id)
          if (details?.photos && details.photos.length > 0) {
            photoReference = details.photos[0].photo_reference
          }
        }
      }
    }

    if (!photoReference) {
      console.log('❌ No photo found')
      failed++
      continue
    }

    // Download the photo
    const imageBuffer = await downloadGooglePhoto(photoReference)
    if (!imageBuffer) {
      console.log('❌ Download failed')
      failed++
      continue
    }

    // Create a safe filename
    const safeFilename = business.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)
    const filename = `${safeFilename}-${business.id.slice(0, 8)}.jpg`

    // Upload to Supabase Storage
    const publicUrl = await uploadToStorage(imageBuffer, filename)
    if (!publicUrl) {
      console.log('❌ Upload failed')
      failed++
      continue
    }

    // Update database with new URL and placeId
    const updateData: any = { photoUrl: publicUrl }
    if (placeId && placeId !== business.placeId) {
      updateData.placeId = placeId
    }

    const { error: updateError } = await supabaseAdmin
      .from('Business')
      .update(updateData)
      .eq('id', business.id)

    if (updateError) {
      console.log(`❌ DB update failed`)
      failed++
    } else {
      console.log('✅')
      updated++
    }

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log(`\n✨ Done!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Failed: ${failed}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
