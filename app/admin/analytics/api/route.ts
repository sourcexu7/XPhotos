import { NextResponse } from 'next/server'
import { getVisitAnalytics } from '~/lib/db/query/analytics'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getVisitAnalytics()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching visit analytics via /admin/analytics/api:', error)
    return NextResponse.json({ message: 'Failed to fetch visit analytics' }, { status: 500 })
  }
}




