import { NextResponse } from 'next/server'

const VANNA_API_URL = process.env.VANNA_API_URL || 'http://localhost:8000'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const months = searchParams.get('months') || '12'

    const vannaUrl = `${VANNA_API_URL}/api/v1/dashboard/trend?months=${months}`
    console.log('Fetching invoice trends from:', vannaUrl)

    const response = await fetch(vannaUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vanna API error:', response.status, errorText)
      throw new Error(`Failed to fetch invoice trends: ${response.status}`)
    }

    const data = await response.json()
    console.log('Invoice trends data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Invoice trends API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch invoice trends',
        details: 'Check if Vanna AI server is running on port 8000'
      },
      { status: 500 }
    )
  }
}
