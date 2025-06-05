#!/usr/bin/env python3
"""
Vercel 배포용 AI 퀴즈 분석 API 서버
사용자가 사진을 업로드하면 AI가 퀴즈를 분석해서 정답을 반환하는 서비스
"""

import os
import logging
import time
import base64
from datetime import datetime, timedelta
from collections import defaultdict
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import requests
import json

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask 앱 생성
app = Flask(__name__)
CORS(app)

# 환경변수에서 API 키 가져오기
API_KEY = os.environ.get('DEEPSEEK_API_KEY', 'sk-XkB99PsvVahJDwpvmYwcGsf8Xvtub3zuql9Jw30WiTrQlp8E')
BASE_URL = "https://api.deepseek.com"
API_ENDPOINT = f"{BASE_URL}/v1/chat/completions"

# 요청 통계 및 레이트 리미팅
request_stats = defaultdict(int)
request_times = defaultdict(list)
start_time = datetime.now()

# HTML 템플릿
HOME_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 퀴즈 분석 API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh; padding: 20px;
        }
        .container { 
            max-width: 1200px; margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border-radius: 20px; padding: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3em; margin-bottom: 10px; }
        .upload-section {
            background: rgba(255,255,255,0.15);
            border-radius: 15px; padding: 30px;
            margin: 30px 0; text-align: center;
        }
        .file-input {
            display: none;
        }
        .upload-btn {
            background: linear-gradient(45deg, #00ff88, #00d4ff);
            color: white; padding: 15px 30px;
            border: none; border-radius: 25px;
            cursor: pointer; font-size: 1.1em;
            display: inline-block; margin: 10px;
        }
        .upload-btn:hover { transform: translateY(-2px); }
        .preview { margin-top: 20px; }
        .result {
            background: rgba(0,0,0,0.3);
            border-radius: 10px; padding: 20px;
            margin: 20px 0; text-align: left;
        }
        .loading { 
            display: none; color: #00ff88; 
            animation: pulse 1s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI 퀴즈 분석기</h1>
            <p>사진을 업로드하면 AI가 퀴즈 문제를 분석하고 정답을 찾아드립니다</p>
        </div>
        
        <div class="upload-section">
            <h2>📸 사진 업로드</h2>
            <p>퀴즈 문제가 포함된 사진을 선택해주세요</p>
            
            <input type="file" id="imageInput" class="file-input" accept="image/*">
            <label for="imageInput" class="upload-btn">📁 사진 선택</label>
            <button onclick="analyzeImage()" class="upload-btn" id="analyzeBtn" disabled>🔍 퀴즈 분석</button>
            
            <div class="loading" id="loading">🤖 AI가 퀴즈를 분석중입니다...</div>
            
            <div class="preview" id="preview"></div>
            <div class="result" id="result"></div>
        </div>
        
        <div style="text-align: center; opacity: 0.8;">
            <p>💡 지원 형식: JPG, PNG, JPEG | 최대 크기: 10MB</p>
            <p>🌟 DeepSeek AI 기반 | 호스팅: Vercel</p>
        </div>
    </div>

    <script>
        let selectedImage = null;
        
        document.getElementById('imageInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    selectedImage = e.target.result.split(',')[1]; // base64 데이터만
                    
                    // 미리보기 표시
                    document.getElementById('preview').innerHTML = 
                        `<img src="${e.target.result}" style="max-width: 300px; border-radius: 10px;">`;
                    
                    // 분석 버튼 활성화
                    document.getElementById('analyzeBtn').disabled = false;
                };
                reader.readAsDataURL(file);
            }
        });
        
        async function analyzeImage() {
            if (!selectedImage) return;
            
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const analyzeBtn = document.getElementById('analyzeBtn');
            
            loading.style.display = 'block';
            analyzeBtn.disabled = true;
            result.innerHTML = '';
            
            try {
                const response = await fetch('/api/quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: selectedImage
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `
                        <h3>✅ 분석 완료!</h3>
                        <div style="margin: 15px 0;">
                            <strong>📝 인식된 문제:</strong><br>
                            ${data.analysis.question || '문제를 인식하지 못했습니다.'}
                        </div>
                        <div style="margin: 15px 0;">
                            <strong>💡 AI 답변:</strong><br>
                            <div style="background: rgba(0,255,136,0.2); padding: 15px; border-radius: 8px; margin-top: 10px;">
                                ${data.analysis.answer}
                            </div>
                        </div>
                        <div style="font-size: 0.9em; opacity: 0.8; margin-top: 15px;">
                            ⏱️ 분석 시간: ${data.analysis.processing_time}초
                        </div>
                    `;
                } else {
                    result.innerHTML = `
                        <h3>❌ 오류 발생</h3>
                        <p>${data.message}</p>
                    `;
                }
            } catch (error) {
                result.innerHTML = `
                    <h3>❌ 네트워크 오류</h3>
                    <p>서버와 연결할 수 없습니다: ${error.message}</p>
                `;
            }
            
            loading.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    </script>
</body>
</html>
"""

def is_rate_limited(client_ip, max_requests=30, time_window=300):
    """레이트 리미팅 체크"""
    current_time = time.time()
    
    # 오래된 요청 기록 제거
    request_times[client_ip] = [
        req_time for req_time in request_times[client_ip] 
        if current_time - req_time < time_window
    ]
    
    # 현재 요청 추가
    request_times[client_ip].append(current_time)
    
    return len(request_times[client_ip]) > max_requests

def validate_base64_image(base64_string):
    """Base64 이미지 유효성 검사"""
    try:
        if not base64_string:
            return False
        
        # padding 추가
        missing_padding = len(base64_string) % 4
        if missing_padding:
            base64_string += '=' * (4 - missing_padding)
        
        # 디코딩 시도
        image_data = base64.b64decode(base64_string)
        
        # 기본적인 이미지 헤더 체크
        if len(image_data) < 100:
            return False
            
        return True
    except Exception:
        return False

@app.route('/')
def home():
    """메인 페이지"""
    try:
        uptime = datetime.now() - start_time
        total_requests = sum(request_stats.values())
        
        return render_template_string(HOME_TEMPLATE, 
            status="온라인",
            uptime=f"{uptime.days}일 {uptime.seconds//3600}시간",
            total_requests=total_requests,
            version="v2.0",
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    except Exception as e:
        logger.error(f"Home page error: {e}")
        return jsonify({"error": "페이지 로드 중 오류가 발생했습니다."}), 500

@app.route('/health')
def health_check():
    """헬스 체크"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": (datetime.now() - start_time).total_seconds(),
        "version": "2.0"
    })

@app.route('/test')
def test_api():
    """API 연결 테스트"""
    try:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        test_data = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": "Hello, this is a test message."}
            ],
            "max_tokens": 50
        }
        
        response = requests.post(API_ENDPOINT, json=test_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "message": "API 연결 성공!",
                "response": response.json()
            })
        else:
            return jsonify({
                "success": False,
                "message": f"API 오류: {response.status_code}",
                "error": response.text
            }), response.status_code
            
    except Exception as e:
        logger.error(f"API test error: {e}")
        return jsonify({
            "success": False,
            "message": f"연결 오류: {str(e)}"
        }), 500

@app.route('/api/quiz', methods=['POST'])
def analyze_quiz():
    """퀴즈 분석 API"""
    start_time_api = time.time()
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    try:
        # 레이트 리미팅 체크
        if is_rate_limited(client_ip):
            return jsonify({
                "success": False,
                "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
            }), 429
        
        # 요청 통계 업데이트
        request_stats['total'] += 1
        request_stats[client_ip] += 1
        
        # JSON 데이터 검증
        if not request.is_json:
            return jsonify({
                "success": False,
                "message": "Content-Type은 application/json이어야 합니다."
            }), 400
        
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                "success": False,
                "message": "이미지 데이터가 필요합니다."
            }), 400
        
        base64_image = data['image']
        
        # Base64 이미지 유효성 검사
        if not validate_base64_image(base64_image):
            return jsonify({
                "success": False,
                "message": "유효하지 않은 이미지 형식입니다."
            }), 400
        
        # DeepSeek API 호출
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        api_data = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "이 이미지에 있는 퀴즈 문제를 분석하고 정확한 답을 제공해주세요. 문제를 먼저 인식한 후, 단계별로 해결 과정을 설명하고 최종 답을 제시해주세요."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 1000
        }
        
        response = requests.post(API_ENDPOINT, json=api_data, headers=headers, timeout=30)
        
        processing_time = round(time.time() - start_time_api, 2)
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            return jsonify({
                "success": True,
                "message": "퀴즈 분석이 완료되었습니다.",
                "analysis": {
                    "answer": ai_response,
                    "processing_time": processing_time,
                    "model": "deepseek-chat",
                    "timestamp": datetime.now().isoformat()
                }
            })
        else:
            logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
            return jsonify({
                "success": False,
                "message": f"AI 분석 중 오류가 발생했습니다: {response.status_code}",
                "error": response.text
            }), 500
            
    except requests.exceptions.Timeout:
        return jsonify({
            "success": False,
            "message": "AI 응답 시간이 초과되었습니다. 다시 시도해주세요."
        }), 504
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {e}")
        return jsonify({
            "success": False,
            "message": f"네트워크 오류: {str(e)}"
        }), 503
    except Exception as e:
        logger.error(f"Quiz analysis error: {e}")
        return jsonify({
            "success": False,
            "message": f"서버 오류: {str(e)}"
        }), 500

@app.route('/api/stats')
def get_stats():
    """사용 통계"""
    uptime = datetime.now() - start_time
    return jsonify({
        "total_requests": sum(request_stats.values()),
        "uptime_seconds": uptime.total_seconds(),
        "uptime_formatted": f"{uptime.days}일 {uptime.seconds//3600}시간",
        "requests_by_endpoint": dict(request_stats),
        "active_connections": len(request_times),
        "server_time": datetime.now().isoformat(),
        "version": "2.0"
    })

# Vercel을 위한 핸들러
def handler(event, context):
    return app(event, context)

if __name__ == '__main__':
    app.run(debug=True) 