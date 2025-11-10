import { NextResponse } from 'next/server'

const VANNA_API_URL = process.env.VANNA_API_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question, execute = true } = body

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Forward request to Vanna AI
    const response = await fetch(`${VANNA_API_URL}/api/v1/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        execute,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get response from Vanna AI')
    }

    const data = await response.json()
    
    // Return the response with SQL and results
    return NextResponse.json({
      success: data.success || false,
      question: data.question || question,
      sql: data.sql || '',
      results: data.results || [],
      explanation: data.explanation || '',
      row_count: data.row_count || 0,
      error: data.error || null,
    })
  } catch (error) {
    console.error('Chat with data API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process your question',
        sql: '',
        results: [],
      },
      { status: 500 }
    )
  }
}
