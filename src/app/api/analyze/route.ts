import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-XkB99PsvVahJDwpvmYwcGsf8Xvtub3zuql9Jw30WiTrQlp8E'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { success: false, error: '이미지가 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // DeepSeek API 요청
    const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `이 이미지에 있는 퀴즈 문제를 분석해주세요. 다음과 같은 형식으로 답변해주세요:

1. 문제 내용 요약
2. 정답과 해설
3. 핵심 개념 설명

명확하고 정확한 답변을 제공해주세요. 한국어로 답변해주세요.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    })

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.text()
      console.error('DeepSeek API Error:', errorData)
      return NextResponse.json(
        { success: false, error: 'AI 분석 서비스에 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const data = await deepseekResponse.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { success: false, error: 'AI 응답 형식이 올바르지 않습니다.' },
        { status: 500 }
      )
    }

    const result = data.choices[0].message.content

    return NextResponse.json({
      success: true,
      result: result
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { success: false, error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 