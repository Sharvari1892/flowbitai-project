import { NextResponse } from 'next/server'

const VANNA_API_URL = process.env.VANNA_API_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(
      `${VANNA_API_URL}/api/v1/dashboard/categories`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch category spend from Vanna AI')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Category spend API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category spend' },
      { status: 500 }
    )
  }
}
