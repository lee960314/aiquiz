@echo off
chcp 65001 > nul
echo ====================================
echo  AI 퀴즈 솔버 - 프론트엔드 시작
echo ====================================
echo.

echo 🌐 프론트엔드 웹 서버 시작 중...
echo 📡 주소: http://localhost:8000
echo 🛑 서버 종료: Ctrl+C
echo.

python -m http.server 8000

pause 