// Script to update Walmart photo with storefront image
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
  // Walmart storefront image
  const walmartPhoto = 'https://corporate.walmart.com/content/dam/corporate/images/global-responsibility/sustainability/regenerative/hero-exterior-greensboro-store_1080_608.jpg'
  
  const { error } = await supabaseAdmin
    .from('Business')
    .update({ photoUrl: walmartPhoto })
    .eq('name', 'Walmart Supercenter')
    .eq('city', 'Crescent City')

  if (error) {
    console.log(`❌ Failed: ${error.message}`)
  } else {
    console.log('✅ Updated Walmart photo with storefront image')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
