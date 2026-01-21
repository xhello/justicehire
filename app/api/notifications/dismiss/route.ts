import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Update user's notificationsDismissedAt timestamp
    const { error } = await supabaseAdmin
      .from('User')
      .update({ notificationsDismissedAt: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      console.error('Error dismissing notifications:', error)
      return NextResponse.json({ error: 'Failed to dismiss notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error dismissing notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
