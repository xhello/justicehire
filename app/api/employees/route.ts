import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, businessId, position, photoUrl } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Create the user
    const userId = uuidv4()
    const { error: userError } = await supabaseAdmin
      .from('User')
      .insert({
        id: userId,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@placeholder.com`,
        password: 'not-set',
        role: 'EMPLOYEE',
        verified: false,
        photoUrl: photoUrl || null,
        position: position || null,
      })

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Failed to create employee' },
        { status: 500 }
      )
    }

    // If business is selected, create employer profile
    if (businessId) {
      const { error: profileError } = await supabaseAdmin
        .from('EmployerProfile')
        .insert({
          id: uuidv4(),
          userId,
          businessId,
        })

      if (profileError) {
        console.error('Error creating employer profile:', profileError)
        // Don't fail the whole operation, employee is still created
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (error: any) {
    console.error('Error adding employee:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
