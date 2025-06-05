#!/usr/bin/env python3
"""
PythonAnywhere 배포용 ChatAI API 프록시 서버
온라인에서 접근 가능한 AI 퀴즈 분석 API
업데이트: 2024-12-04 - 인터페이스 및 기능 개선
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
CORS(app, origins=[
    "https://ai-quiz-6593d.web.app", 
    "http://localhost:*",
    "https://*.pythonanywhere.com"
])

# 환경변수에서 API 키 가져오기 (보안을 위해)
API_KEY = os.environ.get('CHATAI_API_KEY', 'sk-XkB99PsvVahJDwpvmYwcGsf8Xvtub3zuql9Jw30WiTrQlp8E')
BASE_URL = "https://www.chataiapi.com"
API_ENDPOINT = f"{BASE_URL}/v1/chat/completions"

# 요청 통계 및 레이트 리미팅
request_stats = defaultdict(int)
request_times = defaultdict(list)
start_time = datetime.now()

# HTML 템플릿 (더 개선된 인터페이스)
HOME_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 퀴즈 분석 API 서버</title>
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
        .header h1 { font-size: 3em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .status-card { 
            background: rgba(255,255,255,0.15); 
            border-radius: 15px; padding: 20px; margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .endpoint { 
            background: rgba(255,255,255,0.1); 
            border-radius: 10px; padding: 20px;
            border-left: 4px solid #00ff88;
        }
        .endpoint h3 { color: #00ff88; margin-bottom: 10px; }
        .code { 
            background: rgba(0,0,0,0.3); 
            padding: 15px; border-radius: 8px; 
            font-family: 'Courier New', monospace;
            overflow-x: auto; margin: 10px 0;
        }
        .btn { 
            background: linear-gradient(45deg, #00ff88, #00d4ff);
            color: white; padding: 12px 24px; 
            border: none; border-radius: 25px; 
            cursor: pointer; margin: 5px;
            text-decoration: none; display: inline-block;
            transition: transform 0.3s;
        }
        .btn:hover { transform: translateY(-2px); }
        .stats { display: flex; justify-content: space-around; flex-wrap: wrap; }
        .stat-item { text-align: center; margin: 10px; }
        .stat-number { font-size: 2em; font-weight: bold; color: #00ff88; }
        .footer { text-align: center; margin-top: 40px; opacity: 0.8; }
        .test-section { margin-top: 30px; }
        .log-section { 
            background: rgba(0,0,0,0.3); 
            border-radius: 10px; padding: 20px; margin-top: 20px;
            max-height: 300px; overflow-y: auto;
        }
        @media (max-width: 768px) {
            .container { padding: 20px; }
            .header h1 { font-size: 2em; }
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI 퀴즈 분석 API</h1>
            <p>DeepSeek AI 기반 실시간 퀴즈 해결 서비스</p>
        </div>
        
        <div class="status-card">
            <h2>📊 서버 상태</h2>
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">{{ status }}</div>
                    <div>서버 상태</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">{{ uptime }}</div>
                    <div>가동 시간</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">{{ total_requests }}</div>
                    <div>총 요청 수</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">{{ version }}</div>
                    <div>버전</div>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="endpoint">
                <h3>🎯 퀴즈 분석 API</h3>
                <p>이미지를 업로드하여 AI가 퀴즈를 분석하고 정답을 찾아드립니다.</p>
                <div class="code">POST /api/quiz</div>
                <p><strong>요청:</strong> JSON (base64 이미지 데이터)</p>
                <p><strong>응답:</strong> 퀴즈 분석 결과 및 정답</p>
            </div>
            
            <div class="endpoint">
                <h3>🔍 헬스 체크</h3>
                <p>서버의 현재 상태를 확인합니다.</p>
                <div class="code">GET /health</div>
                <a href="/health" class="btn">상태 확인</a>
            </div>
            
            <div class="endpoint">
                <h3>🧪 API 테스트</h3>
                <p>ChatAI API 연결을 테스트합니다.</p>
                <div class="code">GET /test</div>
                <a href="/test" class="btn">API 테스트</a>
            </div>
            
            <div class="endpoint">
                <h3>📈 사용 통계</h3>
                <p>API 사용 통계를 확인합니다.</p>
                <div class="code">GET /api/stats</div>
                <a href="/api/stats" class="btn">통계 보기</a>
            </div>
        </div>

        <div class="test-section">
            <h2>🚀 빠른 테스트</h2>
            <p>아래 버튼들로 각 기능을 바로 테스트해보세요:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="/test" class="btn">🔗 API 연결 테스트</a>
                <a href="/health" class="btn">💚 헬스 체크</a>
                <a href="/api/stats" class="btn">📊 통계 보기</a>
            </div>
        </div>

        <div class="footer">
            <p>🌟 Made with ❤️ for AI Quiz Solving</p>
            <p>{{ timestamp }} | 호스팅: PythonAnywhere</p>
        </div>
    </div>

    <script>
        // 실시간 상태 업데이트 (선택사항)
        setInterval(() => {
            fetch('/health')
                .then(response => response.json())
                .then(data => {
                    console.log('Health check:', data);
                })
                .catch(error => console.log('Health check failed:', error));
        }, 30000); // 30초마다
    </script>
</body>
</html>
"""

def is_rate_limited(client_ip, max_requests=30, time_window=300):
    """레이트 리미팅 체크 (5분간 30회 제한)"""
    now = time.time()
    request_times[client_ip] = [
        req_time for req_time in request_times[client_ip] 
        if now - req_time < time_window
    ]
    
    if len(request_times[client_ip]) >= max_requests:
        return True
    
    request_times[client_ip].append(now)
    return False

def validate_base64_image(base64_string):
    """Base64 이미지 데이터 검증"""
    try:
        if not base64_string:
            return False, "이미지 데이터가 없습니다."
        
        # data:image 헤더 제거
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        # Base64 디코딩 테스트
        decoded = base64.b64decode(base64_string)
        
        # 이미지 크기 체크 (10MB 제한)
        if len(decoded) > 10 * 1024 * 1024:
            return False, "이미지 크기가 10MB를 초과합니다."
        
        # 최소 크기 체크
        if len(decoded) < 100:
            return False, "이미지 데이터가 너무 작습니다."
        
        return True, "유효한 이미지입니다."
        
    except Exception as e:
        return False, f"이미지 데이터가 유효하지 않습니다: {str(e)}"

@app.route('/')
def home():
    """개선된 홈페이지 - 더 나은 인터페이스"""
    uptime = datetime.now() - start_time
    uptime_str = f"{uptime.days}일 {uptime.seconds//3600}시간"
    
    return render_template_string(HOME_TEMPLATE, 
        status="🟢 온라인",
        uptime=uptime_str,
        total_requests=sum(request_stats.values()),
        version="v2.0",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )

@app.route('/health')
def health_check():
    """향상된 헬스 체크"""
    uptime = datetime.now() - start_time
    
    # ChatAI API 연결 테스트
    api_status = "unknown"
    try:
        test_response = requests.get(BASE_URL, timeout=5)
        api_status = "online" if test_response.status_code == 200 else "error"
    except:
        api_status = "offline"
    
    return jsonify({
        "status": "OK",
        "service": "AI Quiz Solver API",
        "version": "2.0.0",
        "uptime_seconds": uptime.total_seconds(),
        "uptime_formatted": f"{uptime.days}일 {uptime.seconds//3600}시간 {(uptime.seconds%3600)//60}분",
        "chatai_api_status": api_status,
        "total_requests": sum(request_stats.values()),
        "memory_usage": "N/A",
        "timestamp": datetime.now().isoformat(),
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/test')
def test_api():
    """개선된 API 연결 테스트"""
    client_ip = request.remote_addr
    
    # 레이트 리미팅 체크
    if is_rate_limited(client_ip, max_requests=10, time_window=300):
        return jsonify({
            "status": "error",
            "message": "요청 한도 초과. 5분 후 다시 시도해주세요."
        }), 429
    
    try:
        request_stats['test'] += 1
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": "안녕하세요! 🚀 PythonAnywhere 배포 테스트입니다. '온라인 배포 성공! ✅'라고 한국어로 간단히 답해주세요."}
            ],
            "max_tokens": 100,
            "temperature": 0.7
        }
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "AI-Quiz-Solver/2.0"
        }
        
        logger.info(f"🧪 API 테스트 시작 - IP: {client_ip}")
        
        response = requests.post(
            API_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result.get('choices', [{}])[0].get('message', {}).get('content', 'No response')
            
            logger.info(f"✅ API 테스트 성공 - 응답: {ai_response[:50]}...")
            
            return jsonify({
                "status": "success",
                "message": "🎉 ChatAI API 연결 정상",
                "ai_response": ai_response,
                "response_time": "정상",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "server_info": {
                    "model": "deepseek-chat",
                    "version": "2.0.0",
                    "hosting": "PythonAnywhere"
                }
            })
        else:
            logger.error(f"❌ API 테스트 실패 - 상태: {response.status_code}")
            return jsonify({
                "status": "error",
                "message": f"❌ ChatAI API 오류: {response.status_code}",
                "details": response.text[:200],
                "suggestion": "API 키를 확인하거나 잠시 후 다시 시도해주세요."
            }), response.status_code
            
    except requests.exceptions.Timeout:
        logger.error("⏰ API 테스트 타임아웃")
        return jsonify({
            "status": "error",
            "message": "⏰ API 요청 시간 초과",
            "suggestion": "네트워크 연결을 확인하고 다시 시도해주세요."
        }), 408
    except Exception as e:
        logger.error(f"💥 API 테스트 오류: {e}")
        return jsonify({
            "status": "error",
            "message": f"💥 서버 오류: {str(e)}",
            "suggestion": "관리자에게 문의해주세요."
        }), 500

@app.route('/api/quiz', methods=['POST'])
def analyze_quiz():
    """개선된 퀴즈 분석 API"""
    client_ip = request.remote_addr
    
    # 레이트 리미팅 체크
    if is_rate_limited(client_ip, max_requests=20, time_window=300):
        return jsonify({
            "error": "요청 한도 초과. 5분간 20회 제한입니다. 잠시 후 다시 시도해주세요.",
            "retry_after": 300
        }), 429
    
    try:
        request_stats['quiz'] += 1
        
        # 요청 데이터 검증
        if not request.is_json:
            return jsonify({"error": "Content-Type을 application/json으로 설정해주세요."}), 400
            
        data = request.get_json()
        base64_image = data.get('base64', '').strip()
        
        if not base64_image:
            return jsonify({"error": "base64 이미지 데이터가 필요합니다."}), 400
        
        # 이미지 검증
        is_valid, validation_message = validate_base64_image(base64_image)
        if not is_valid:
            return jsonify({"error": validation_message}), 400
        
        # 이미지 크기 계산
        if base64_image.startswith('data:image'):
            actual_base64 = base64_image.split(',')[1]
        else:
            actual_base64 = base64_image
            
        image_size_kb = len(actual_base64) * 3 / 4 / 1024  # 대략적인 크기
        
        logger.info(f"📤 퀴즈 분석 요청 - IP: {client_ip}, 이미지 크기: {image_size_kb:.1f}KB")
        
        # ChatAI API 요청 구성 (더 나은 프롬프트)
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user", 
                    "content": f"""이미지를 분석하여 퀴즈 문제를 해결해주세요.

📋 분석 요청사항:
1. 이미지에서 텍스트를 OCR로 정확히 읽어주세요
2. 퀴즈 문제의 내용을 파악해주세요
3. 선택지들을 확인해주세요
4. 논리적 추론을 통해 정답을 도출해주세요

📝 응답 형식:
✅ **정답: [번호] - [선택지 내용]**

📖 **문제 분석:**
- 문제: [OCR로 읽은 문제]
- 선택지: [1번, 2번, 3번, 4번 등]

🧠 **풀이 과정:**
[단계별 추론 과정]

⚠️ 만약 이미지가 퀴즈가 아니거나 텍스트를 읽을 수 없다면, 그 이유를 명확히 설명해주세요.

이미지 데이터: data:image/jpeg;base64,{actual_base64}"""
                }
            ],
            "temperature": 0.3,  # 더 정확한 답변을 위해 낮춤
            "max_tokens": 1500
        }
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "AI-Quiz-Solver/2.0"
        }
        
        # ChatAI API 호출
        start_time_api = time.time()
        response = requests.post(
            API_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=60
        )
        api_duration = time.time() - start_time_api
        
        logger.info(f"📥 ChatAI 응답: {response.status_code}, 소요시간: {api_duration:.2f}초")
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # 응답 개선
            enhanced_result = {
                "success": True,
                "ai_analysis": ai_response,
                "metadata": {
                    "model": "deepseek-chat",
                    "response_time_seconds": round(api_duration, 2),
                    "image_size_kb": round(image_size_kb, 1),
                    "timestamp": datetime.now().isoformat(),
                    "request_id": f"quiz_{int(time.time())}_{hash(client_ip) % 10000}"
                },
                "original_response": result
            }
            
            logger.info(f"✅ 퀴즈 분석 성공 - 요청ID: {enhanced_result['metadata']['request_id']}")
            return jsonify(enhanced_result)
        else:
            logger.error(f"❌ ChatAI API 오류: {response.status_code} - {response.text}")
            
            # 상세한 오류 메시지
            error_messages = {
                401: "🔑 API 키가 유효하지 않습니다. 관리자에게 문의해주세요.",
                429: "⏰ API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                413: "📁 이미지 파일이 너무 큽니다. 더 작은 이미지를 업로드해주세요.",
                500: "🛠️ ChatAI 서버에 일시적인 문제가 있습니다.",
                503: "🔧 ChatAI 서비스를 사용할 수 없습니다."
            }
            
            error_msg = error_messages.get(response.status_code, f"❌ API 오류 (코드: {response.status_code})")
                
            return jsonify({
                "success": False,
                "error": error_msg,
                "error_code": response.status_code,
                "details": response.text[:300],
                "timestamp": datetime.now().isoformat(),
                "suggestion": "이미지 크기를 줄이거나 잠시 후 다시 시도해주세요."
            }), response.status_code
            
    except requests.exceptions.Timeout:
        logger.error("⏰ 퀴즈 분석 타임아웃")
        return jsonify({
            "success": False,
            "error": "⏰ API 요청 시간이 초과되었습니다.",
            "suggestion": "이미지 크기를 줄이거나 네트워크 연결을 확인해주세요."
        }), 408
    except requests.exceptions.RequestException as e:
        logger.error(f"🌐 네트워크 오류: {e}")
        return jsonify({
            "success": False,
            "error": f"🌐 네트워크 연결 오류: {str(e)}",
            "suggestion": "인터넷 연결을 확인하고 다시 시도해주세요."
        }), 503
    except Exception as e:
        logger.error(f"💥 퀴즈 분석 서버 오류: {e}")
        return jsonify({
            "success": False,
            "error": f"💥 서버 내부 오류가 발생했습니다.",
            "error_details": str(e),
            "timestamp": datetime.now().isoformat(),
            "suggestion": "문제가 지속되면 관리자에게 문의해주세요."
        }), 500

@app.route('/api/stats')
def get_stats():
    """향상된 API 사용 통계"""
    uptime = datetime.now() - start_time
    
    return jsonify({
        "service_info": {
            "name": "AI Quiz Solver API",
            "version": "2.0.0",
            "status": "online",
            "hosting": "PythonAnywhere"
        },
        "statistics": {
            "total_requests": sum(request_stats.values()),
            "quiz_requests": request_stats.get('quiz', 0),
            "test_requests": request_stats.get('test', 0),
            "uptime_seconds": int(uptime.total_seconds()),
            "uptime_formatted": f"{uptime.days}일 {uptime.seconds//3600}시간 {(uptime.seconds%3600)//60}분"
        },
        "api_info": {
            "model": "deepseek-chat",
            "max_image_size": "10MB",
            "rate_limit": "20 requests per 5 minutes",
            "supported_formats": ["JPEG", "PNG", "WebP"]
        },
        "last_updated": datetime.now().isoformat(),
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S KST")
    })

# 개선된 오류 핸들러들
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "🔍 요청하신 엔드포인트를 찾을 수 없습니다.",
        "available_endpoints": {
            "홈페이지": "/",
            "헬스체크": "/health", 
            "API테스트": "/test", 
            "퀴즈분석": "/api/quiz",
            "사용통계": "/api/stats"
        },
        "tip": "홈페이지(/)에서 사용 가능한 모든 기능을 확인하세요."
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"💥 서버 내부 오류: {error}")
    return jsonify({
        "error": "🛠️ 서버 내부 오류가 발생했습니다.",
        "message": "문제를 해결하는 중입니다. 잠시 후 다시 시도해주세요.",
        "timestamp": datetime.now().isoformat(),
        "support": "문제가 지속되면 관리자에게 문의해주세요."
    }), 500

@app.errorhandler(413)
def payload_too_large(error):
    return jsonify({
        "error": "📁 업로드된 파일이 너무 큽니다.",
        "max_size": "10MB",
        "suggestion": "이미지 크기를 줄여서 다시 시도해주세요."
    }), 413

# 개발 서버 실행
if __name__ == '__main__':
    logger.info("🚀 AI Quiz Solver API 서버 시작...")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 