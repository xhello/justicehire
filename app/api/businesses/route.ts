import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = searchParams.get('state')
  const city = searchParams.get('city')

  try {
    const allBusinesses = await prisma.businesses.findMany({})
    
    let filteredBusinesses = allBusinesses
    
    if (state) {
      filteredBusinesses = filteredBusinesses.filter((b: any) => b.state === state)
    }
    
    if (city) {
      filteredBusinesses = filteredBusinesses.filter((b: any) => b.city === city)
    }
    
    // Sort by name
    filteredBusinesses.sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json({ businesses: filteredBusinesses })
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json({ businesses: [] })
  }
}
