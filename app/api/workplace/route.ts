import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, businessId, state, city } = body

    // Verify user is setting their own workplace
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify business exists
    const business = await prisma.businesses.findUnique({ id: businessId })
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check if user already has an employer profile
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data: existingProfile } = await supabaseAdmin
      .from('EmployerProfile')
      .select('id')
      .eq('userId', userId)
      .single()

    if (existingProfile) {
      // Update existing profile
      await supabaseAdmin
        .from('EmployerProfile')
        .update({ businessId })
        .eq('userId', userId)
    } else {
      // Create new employer profile
      await supabaseAdmin
        .from('EmployerProfile')
        .insert({ userId, businessId })
    }

    // Update user's location
    await prisma.users.update(
      { id: userId },
      { state, city }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error setting workplace:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set workplace' },
      { status: 500 }
    )
  }
}
