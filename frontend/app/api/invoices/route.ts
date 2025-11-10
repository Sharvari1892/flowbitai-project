import { NextResponse } from 'next/server'

const VANNA_API_URL = process.env.VANNA_API_URL || 'http://localhost:8000'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'invoiceDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = searchParams.get('limit') || '100'

    // Build query parameters
    const params = new URLSearchParams({
      search,
      status,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit,
    })

    const response = await fetch(
      `${VANNA_API_URL}/api/v1/invoices?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch invoices from Vanna AI')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Invoices API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
