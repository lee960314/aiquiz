const functions = require('firebase-functions');
const fetch = require('node-fetch');
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// DeepSeek API 키 (서버에서만 사용)
const DEEPSEEK_API_KEY = 'sk-zrOHek35yEmvJGc4jNaAz4RclCxk9e4BrYfnJf5DpuBNwgGW';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 퀴즈 분석 API 엔드포인트
app.post('/quiz', async (req, res) => {
  try {
    console.log('🤖 퀴즈 분석 요청 받음');
    
    const { base64 } = req.body;
    
    if (!base64) {
      return res.status(400).json({ error: '이미지 데이터가 없습니다.' });
    }

    // DeepSeek API 요청 페이로드
    const payload = {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `다음은 퀴즈 문제가 포함된 이미지입니다. 이미지를 분석하여 한국어로 답변해주세요.

이미지를 OCR로 읽어서 퀴즈 문제를 파악하고, 정답을 추론해주세요.

다음 형식으로 답변해주세요:
✅ 정답: [정답] 숫자로 몇 번째인지 표시

만약 이미지에서 텍스트를 읽을 수 없거나 퀴즈가 아닌 경우, 그 이유를 설명해주세요.

이미지 데이터: data:image/jpeg;base64,${base64}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    console.log('📤 DeepSeek API 호출 시작');

    // DeepSeek API 호출
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ DeepSeek API 오류:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `DeepSeek API 오류: ${response.status}` 
      });
    }

    const data = await response.json();
    console.log('✅ DeepSeek API 응답 성공');
    
    res.json(data);

  } catch (error) {
    console.error('❌ 서버 오류:', error);
    res.status(500).json({ 
      error: '서버 내부 오류가 발생했습니다.' 
    });
  }
});

// API 테스트 엔드포인트
app.get('/test', (req, res) => {
  res.json({ 
    message: '🚀 AI 퀴즈 솔버 API 서버가 정상 동작중입니다!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AI Quiz Solver API' });
});

// Firebase Functions로 내보내기
exports.api = functions.https.onRequest(app); 