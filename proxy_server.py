#!/usr/bin/env python3
"""
ChatAI API 프록시 서버
웹 브라우저에서 CORS 우회를 위한 간단한 프록시
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)  # 모든 도메인에서 접근 허용

# ChatAI API 설정 (새로운 API 키로 업데이트)
API_KEY = "sk-XkB99PsvVahJDwpvmYwcGsf8Xvtub3zuql9Jw30WiTrQlp8E"
BASE_URL = "https://www.chataiapi.com"
API_ENDPOINT = f"{BASE_URL}/v1/chat/completions"

@app.route('/api/quiz', methods=['POST'])
def analyze_quiz():
    """퀴즈 분석 API - ChatAI로 프록시"""
    try:
        data = request.get_json()
        base64_image = data.get('base64')
        
        if not base64_image:
            return jsonify({"error": "이미지 데이터가 없습니다."}), 400
        
        # ChatAI API 요청 구성
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user", 
                    "content": f"""다음은 퀴즈 문제가 포함된 이미지입니다. 이미지를 분석하여 한국어로 답변해주세요.

이미지를 OCR로 읽어서 퀴즈 문제를 파악하고, 정답을 추론해주세요.

다음 형식으로 답변해주세요:
✅ 정답: [정답] 숫자로 몇 번째인지 표시

만약 이미지에서 텍스트를 읽을 수 없거나 퀴즈가 아닌 경우, 그 이유를 설명해주세요.

이미지 데이터: data:image/jpeg;base64,{base64_image}"""
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "QuizSolver/1.0"
        }
        
        print(f"📤 ChatAI API 요청 시작...")
        
        # ChatAI API 호출
        response = requests.post(
            API_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"📥 ChatAI 응답: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 성공: {result}")
            return jsonify(result)
        else:
            error_text = response.text
            print(f"❌ 오류: {error_text}")
            return jsonify({"error": f"ChatAI API 오류: {response.status_code}"}), response.status_code
            
    except Exception as e:
        print(f"💥 서버 오류: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/test', methods=['GET'])
def test_api():
    """API 테스트 엔드포인트"""
    try:
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": "안녕하세요! 간단한 테스트입니다. '테스트 성공'이라고 답해주세요."}
            ],
            "max_tokens": 50
        }
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            API_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify({"status": "success", "data": response.json()})
        else:
            return jsonify({"status": "error", "message": response.text}), response.status_code
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """헬스 체크"""
    return jsonify({"status": "OK", "service": "ChatAI Proxy Server"})

if __name__ == '__main__':
    print("🚀 ChatAI API 프록시 서버 시작")
    print("📍 주소: http://localhost:5000")
    print("🔧 테스트: http://localhost:5000/test")
    print("💡 프론트엔드에서 http://localhost:5000/api/quiz 로 요청하세요")
    
    app.run(host='0.0.0.0', port=5000, debug=True) 