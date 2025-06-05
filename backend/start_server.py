#!/usr/bin/env python3
"""
AI 퀴즈 솔버 - FastAPI 서버 시작 스크립트
"""

import uvicorn
import os
import sys
from pathlib import Path

def main():
    """서버 시작"""
    print("🚀 AI 퀴즈 솔버 백엔드 서버를 시작합니다...")
    print("📡 서버 주소: http://localhost:8001")
    print("📚 API 문서: http://localhost:8001/docs")
    print("🛑 서버 종료: Ctrl+C")
    print("-" * 50)
    
    # uploads 폴더가 없으면 생성
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    print(f"📁 업로드 폴더: {uploads_dir.absolute()}")
    
    try:
        # FastAPI 서버 실행
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8001,
            reload=True,  # 개발 모드에서 자동 재시작
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 서버가 종료되었습니다.")
    except Exception as e:
        print(f"❌ 서버 시작 오류: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 