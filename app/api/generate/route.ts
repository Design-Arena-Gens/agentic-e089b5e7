import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, prompt } = await request.json()

    if (!apiKey || !prompt) {
      return NextResponse.json(
        { error: 'API key and prompt are required' },
        { status: 400 }
      )
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.x.ai/v1',
    })

    const completion = await client.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that helps create video content. When given a video request, provide detailed instructions, script, and creative direction for making that video.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    })

    const response = completion.choices[0]?.message?.content || 'No response generated'

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate video content',
        details: error.response?.data || error.toString()
      },
      { status: 500 }
    )
  }
}
