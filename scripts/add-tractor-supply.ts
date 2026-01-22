// Script to add Tractor Supply and get real photo
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'
const googleApiKey = 'AIzaSyCYkBEEikqnHb_Cs8_TJ0M2dG35Fk1ERaY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function searchPlace(query: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    console.log('Search failed:', data.status)
    return null
  }
  return data.results[0]
}

async function downloadGooglePhoto(photoReference: string): Promise<Buffer | null> {
  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${googleApiKey}`
    const response = await fetch(photoUrl, { redirect: 'follow' })
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    return null
  }
}

async function uploadToStorage(buffer: Buffer, filename: string): Promise<string | null> {
  try {
    const { error } = await supabaseAdmin.storage
      .from('business-photos')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.log('Upload error:', error.message)
      return null
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('business-photos')
      .getPublicUrl(filename)

    return urlData.publicUrl
  } catch (error) {
    return null
  }
}

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

  // Search for the business on Google
  console.log('🔍 Searching Google Places...')
  const place = await searchPlace('Tractor Supply 625 M St Crescent City CA')
  
  if (!place) {
    console.log('❌ Could not find on Google Places')
    return
  }

  console.log(`✅ Found: ${place.name}`)
  console.log(`   Address: ${place.formatted_address}`)
  console.log(`   Place ID: ${place.place_id}`)

  let photoUrl: string | null = null

  // Get and store photo
  if (place.photos && place.photos.length > 0) {
    console.log('📥 Downloading photo...')
    const imageBuffer = await downloadGooglePhoto(place.photos[0].photo_reference)
    
    if (imageBuffer) {
      console.log('📤 Uploading to Supabase Storage...')
      const filename = 'tractor-supply-crescent-city.jpg'
      photoUrl = await uploadToStorage(imageBuffer, filename)
      
      if (photoUrl) {
        console.log('✅ Photo stored!')
      }
    }
  }

  // Insert into database
  console.log('💾 Adding to database...')
  const { error } = await supabaseAdmin
    .from('Business')
    .insert({
      name: 'Tractor Supply',
      address: '625 M St, Crescent City, CA 95531',
      city: 'Crescent City',
      state: 'CA',
      category: 'Restaurant', // Using as general category
      placeId: place.place_id,
      photoUrl: photoUrl,
    })

  if (error) {
    console.log(`❌ Failed to add: ${error.message}`)
  } else {
    console.log('✅ Tractor Supply added successfully!')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
