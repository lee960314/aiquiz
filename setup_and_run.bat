@echo off
chcp 65001 > nul
echo ====================================
echo  AI 퀴즈 솔버 - 자동 설치 및 실행
echo ====================================
echo.

echo 📦 Python 패키지 설치 중...
cd backend
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ 패키지 설치 실패! pip가 설치되어 있는지 확인하세요.
    pause
    exit /b 1
)

echo.
echo 🚀 FastAPI 서버 시작 중...
python start_server.py

pause 