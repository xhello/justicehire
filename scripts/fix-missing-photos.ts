// Script to set placeholder photos for businesses that couldn't get Google photos
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Use Unsplash free images as placeholders by category
const placeholderImages: Record<string, string> = {
  'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  'Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
  'Bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
  'Hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
  'Casino': 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400&h=300&fit=crop',
  'default': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
}

// Specific images found from web search for these businesses
const specificImages: Record<string, string> = {
  "Art's BBQ": 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop', // BBQ image
  "Boat House": 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop', // Seafood restaurant
  "Fisherman's Restaurant": 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=400&h=300&fit=crop', // Seafood
  "Foxy's Restaurant": 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400&h=300&fit=crop', // Diner
  "Historic Hiouchi Cafe": 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=300&fit=crop', // Classic cafe
  "Hungry Clam": 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop', // Seafood shack
  "Oceanview Grill": 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', // Ocean restaurant
}

async function main() {
  console.log('🔍 Finding businesses with missing or broken photos...\n')

  // Get businesses that failed to get photos
  const missingPhotoBusinesses = [
    "Art's BBQ",
    "Boat House", 
    "Fisherman's Restaurant",
    "Foxy's Restaurant",
    "Historic Hiouchi Cafe",
    "Hungry Clam",
    "Oceanview Grill"
  ]

  let updated = 0

  for (const name of missingPhotoBusinesses) {
    // Get business
    const { data: business } = await supabaseAdmin
      .from('Business')
      .select('id, name, category')
      .eq('name', name)
      .single()

    if (!business) {
      console.log(`⚠️ Business not found: ${name}`)
      continue
    }

    // Get specific image or fallback to category placeholder
    const photoUrl = specificImages[name] || placeholderImages[business.category] || placeholderImages['default']

    const { error } = await supabaseAdmin
      .from('Business')
      .update({ photoUrl })
      .eq('id', business.id)

    if (error) {
      console.log(`❌ Failed to update ${name}: ${error.message}`)
    } else {
      console.log(`✅ Updated: ${name}`)
      updated++
    }
  }

  console.log(`\n✨ Done! Updated ${updated} businesses with placeholder images`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
