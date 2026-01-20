import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseServiceKey = 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const USER_ID = '9ce72762-5a4a-4459-8c7b-82c800e88f23'

async function deleteUser() {
  console.log(`\nDeleting all data for user: ${USER_ID}\n`)

  try {
    // 1. Delete reviews where user is the reviewer
    console.log('1. Deleting reviews given by user...')
    const { data: reviewsGiven, error: reviewsGivenError } = await supabase
      .from('Review')
      .delete()
      .eq('reviewerId', USER_ID)
      .select()
    
    if (reviewsGivenError) {
      console.error('   Error:', reviewsGivenError.message)
    } else {
      console.log(`   Deleted ${reviewsGiven?.length || 0} reviews given`)
    }

    // 2. Delete reviews where user is the target
    console.log('2. Deleting reviews received by user...')
    const { data: reviewsReceived, error: reviewsReceivedError } = await supabase
      .from('Review')
      .delete()
      .eq('targetUserId', USER_ID)
      .select()
    
    if (reviewsReceivedError) {
      console.error('   Error:', reviewsReceivedError.message)
    } else {
      console.log(`   Deleted ${reviewsReceived?.length || 0} reviews received`)
    }

    // 3. Delete employer profile
    console.log('3. Deleting employer profile...')
    const { data: profile, error: profileError } = await supabase
      .from('EmployerProfile')
      .delete()
      .eq('userId', USER_ID)
      .select()
    
    if (profileError) {
      console.error('   Error:', profileError.message)
    } else {
      console.log(`   Deleted ${profile?.length || 0} employer profile(s)`)
    }

    // 4. Delete OTPs for the user's email (if any)
    console.log('4. Deleting OTPs...')
    // First get user email
    const { data: userData } = await supabase
      .from('User')
      .select('email')
      .eq('id', USER_ID)
      .single()
    
    if (userData?.email) {
      const { data: otps, error: otpError } = await supabase
        .from('Otp')
        .delete()
        .eq('email', userData.email)
        .select()
      
      if (otpError) {
        console.error('   Error:', otpError.message)
      } else {
        console.log(`   Deleted ${otps?.length || 0} OTP(s)`)
      }
    } else {
      console.log('   No email found, skipping OTP deletion')
    }

    // 5. Delete password reset tokens
    console.log('5. Deleting password reset tokens...')
    const { data: tokens, error: tokensError } = await supabase
      .from('PasswordResetToken')
      .delete()
      .eq('userId', USER_ID)
      .select()
    
    if (tokensError) {
      console.error('   Error:', tokensError.message)
    } else {
      console.log(`   Deleted ${tokens?.length || 0} password reset token(s)`)
    }

    // 6. Delete pending signups (if any with same email)
    if (userData?.email) {
      console.log('6. Deleting pending signups...')
      const { data: pendingSignups, error: pendingError } = await supabase
        .from('PendingSignup')
        .delete()
        .eq('email', userData.email)
        .select()
      
      if (pendingError) {
        console.error('   Error:', pendingError.message)
      } else {
        console.log(`   Deleted ${pendingSignups?.length || 0} pending signup(s)`)
      }
    }

    // 7. Finally, delete the user
    console.log('7. Deleting user record...')
    const { data: user, error: userError } = await supabase
      .from('User')
      .delete()
      .eq('id', USER_ID)
      .select()
    
    if (userError) {
      console.error('   Error:', userError.message)
    } else {
      console.log(`   Deleted ${user?.length || 0} user(s)`)
    }

    console.log('\n✅ User deletion complete!\n')

  } catch (error) {
    console.error('\n❌ Error during deletion:', error)
  }
}

deleteUser()
