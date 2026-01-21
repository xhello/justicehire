// Script to download Google Places photos and upload to Supabase Storage
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.log(`   Failed to download: ${response.status}`)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.log(`   Download error: ${error}`)
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
    console.log(`   Upload error: ${error}`)
    return null
  }
}

async function main() {
  console.log('📸 Migrating business photos to Supabase Storage...\n')

  // First, create the storage bucket if it doesn't exist
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === 'business-photos')
  
  if (!bucketExists) {
    console.log('Creating storage bucket...')
    const { error } = await supabaseAdmin.storage.createBucket('business-photos', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    })
    if (error) {
      console.error('Failed to create bucket:', error.message)
      // Try to continue anyway, bucket might already exist
    } else {
      console.log('✅ Created business-photos bucket\n')
    }
  }

  // Get all businesses with Google Maps API photo URLs
  const { data: businesses, error } = await supabaseAdmin
    .from('Business')
    .select('id, name, photoUrl')
    .not('photoUrl', 'is', null)

  if (error) {
    console.error('Error fetching businesses:', error)
    return
  }

  console.log(`📦 Found ${businesses?.length || 0} businesses with photos\n`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const business of businesses || []) {
    // Skip if already migrated to Supabase Storage
    if (business.photoUrl?.includes('supabase.co/storage')) {
      console.log(`⏭️  ${business.name} - already migrated`)
      skipped++
      continue
    }

    // Skip Unsplash images (placeholder images we added)
    if (business.photoUrl?.includes('unsplash.com')) {
      console.log(`⏭️  ${business.name} - placeholder image (keeping)`)
      skipped++
      continue
    }

    console.log(`📥 ${business.name}...`)
    
    // Download the image
    const imageBuffer = await downloadImage(business.photoUrl)
    if (!imageBuffer) {
      console.log(`   ❌ Failed to download`)
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
      console.log(`   ❌ Failed to upload`)
      failed++
      continue
    }

    // Update database with new URL
    const { error: updateError } = await supabaseAdmin
      .from('Business')
      .update({ photoUrl: publicUrl })
      .eq('id', business.id)

    if (updateError) {
      console.log(`   ❌ Failed to update DB: ${updateError.message}`)
      failed++
    } else {
      console.log(`   ✅ Migrated`)
      migrated++
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log(`\n✨ Done!`)
  console.log(`   Migrated: ${migrated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Failed: ${failed}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
