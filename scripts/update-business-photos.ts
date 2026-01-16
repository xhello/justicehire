// Script to update existing businesses with photos from Google Places API
// Run this to add photos to businesses that were created before photo support

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

async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${googleApiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    return null
  }
  
  return data.result
}

async function getPlacePhoto(photoReference: string, maxWidth: number = 400): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${googleApiKey}`
    return url
  } catch (error) {
    return null
  }
}

async function main() {
  console.log('🖼️  Updating businesses with photos from Google Places API...\n')

  // Get all businesses without photos
  const { data: businesses, error } = await supabaseAdmin
    .from('Business')
    .select('id, name, placeId, photoUrl')
    .is('photoUrl', null)

  if (error) {
    console.error('Error fetching businesses:', error.message)
    return
  }

  if (!businesses || businesses.length === 0) {
    console.log('✅ All businesses already have photos!')
    return
  }

  console.log(`Found ${businesses.length} businesses without photos\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const business of businesses) {
    try {
      console.log(`Processing: ${business.name}...`)
      
      const details = await getPlaceDetails(business.placeId)
      
      if (!details || !details.photos || details.photos.length === 0) {
        console.log(`  ⏭️  No photos available`)
        skipped++
        continue
      }

      const photoUrl = await getPlacePhoto(details.photos[0].photo_reference, 400)
      
      if (!photoUrl) {
        console.log(`  ⏭️  Could not get photo URL`)
        skipped++
        continue
      }

      const { error: updateError } = await supabaseAdmin
        .from('Business')
        .update({ photoUrl })
        .eq('id', business.id)

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`)
        errors++
      } else {
        console.log(`  ✅ Updated with photo`)
        updated++
      }

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error: any) {
      console.error(`  ❌ Error processing ${business.name}:`, error.message)
      errors++
    }
  }

  console.log(`\n✨ Done! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
