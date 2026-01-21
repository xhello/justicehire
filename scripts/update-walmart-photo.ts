// Script to update Walmart photo
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  // Better Walmart store exterior image
  const walmartPhoto = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop'
  
  const { error } = await supabaseAdmin
    .from('Business')
    .update({ photoUrl: walmartPhoto })
    .eq('name', 'Walmart Supercenter')
    .eq('city', 'Crescent City')

  if (error) {
    console.log(`❌ Failed: ${error.message}`)
  } else {
    console.log('✅ Updated Walmart photo')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
