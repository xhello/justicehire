import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Delete employer profile
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { error: deleteError } = await supabaseAdmin
      .from('EmployerProfile')
      .delete()
      .eq('userId', user.id)

    if (deleteError) {
      console.error('Error deleting employer profile:', deleteError)
      return NextResponse.json({ error: 'Failed to leave workplace' }, { status: 500 })
    }

    // Clear user's position, state, city
    await prisma.users.update(
      { id: user.id },
      { position: null, state: null, city: null }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error leaving workplace:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to leave workplace' },
      { status: 500 }
    )
  }
}
