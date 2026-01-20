import { NextResponse } from 'next/server'
import { getUniqueCities } from '@/app/actions/business'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') || undefined

  try {
    const cities = await getUniqueCities(state)
    return NextResponse.json({ cities })
  } catch {
    return NextResponse.json({ cities: [] }, { status: 500 })
  }
}
