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
    const { position } = body

    // Update user's position
    await prisma.users.update(
      { id: user.id },
      { position: position || null }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating position:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update position' },
      { status: 500 }
    )
  }
}
