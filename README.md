# AI 퀴즈 솔버 - 카메라 캡처 & 이미지 업로드 시스템

퀴즈 사진을 찍어서 OCR 인식하고 AI를 통해 정답을 보여주는 웹 앱입니다. 현재 카메라 캡처와 이미지 업로드 기능이 완성되었습니다.

## 🎯 완성된 기능

### 📷 프론트엔드 (웹 인터페이스)
- **카메라 접근**: 사용자의 웹캠에 접근하여 실시간 화면 표시
- **사진 캡처**: 버튼 클릭 또는 스페이스바로 사진 촬영
- **미리보기**: 캡처된 이미지를 즉시 확인
- **다시 찍기**: 만족스럽지 않은 사진을 다시 촬영
- **서버 전송**: FastAPI 서버로 Base64 이미지 업로드

### 🖥️ 백엔드 (FastAPI 서버)
- **이미지 업로드 API**: Base64 및 파일 업로드 지원
- **파일 크기 제한**: 최대 5MB 제한
- **보안 검증**: 허용된 이미지 형식만 업로드 (jpg, png, gif, webp)
- **자동 파일명**: 중복 방지를 위한 고유 파일명 생성
- **uploads 폴더**: 업로드된 이미지 자동 저장
- **에러 처리**: 상세한 에러 메시지 및 HTTP 상태 코드

## 📁 프로젝트 구조

```
AI QUIZ/
├── index.html              # 메인 웹페이지
├── script.js               # 프론트엔드 JavaScript 로직
├── styles.css              # 커스텀 CSS 스타일
├── setup_and_run.bat       # 원클릭 설치 및 실행 (Windows)
├── start_frontend.bat      # 프론트엔드 서버 시작
├── backend/
│   ├── main.py            # FastAPI 서버 메인 파일
│   ├── requirements.txt   # Python 패키지 의존성
│   ├── start_server.py    # 서버 시작 스크립트
│   └── uploads/           # 업로드된 이미지 저장 폴더 (자동 생성)
└── README.md              # 프로젝트 문서
```

## 🚀 빠른 시작 (Windows)

### 방법 1: 원클릭 실행 (추천)
```bash
# 1. setup_and_run.bat 더블클릭으로 백엔드 시작
# 2. start_frontend.bat 더블클릭으로 프론트엔드 시작
# 3. http://localhost:8000 접속
```

### 방법 2: 수동 실행

#### 1단계: 백엔드 서버 시작
```bash
# 백엔드 디렉토리로 이동
cd backend

# Python 패키지 설치
pip install -r requirements.txt

# 서버 시작
python start_server.py
```

#### 2단계: 프론트엔드 서버 시작 (새 터미널)
```bash
# 프로젝트 루트 디렉토리에서
python -m http.server 8000
```

#### 3단계: 브라우저에서 접속
- 프론트엔드: http://localhost:8000
- 백엔드 API 문서: http://localhost:8001/docs

## 📱 사용 방법

1. **서버 시작**: 백엔드(포트 8001)와 프론트엔드(포트 8000) 동시 실행
2. **브라우저 접속**: http://localhost:8000
3. **카메라 시작**: "📷 카메라 시작" 버튼 클릭 → 권한 허용
4. **사진 촬영**: "📸 사진 찍기" 버튼 (스페이스바도 가능)
5. **이미지 업로드**: "🚀 AI 분석 요청" 버튼으로 서버에 전송
6. **결과 확인**: 업로드 성공 메시지 및 파일 정보 표시

## ⌨️ 키보드 단축키

- **스페이스바**: 사진 촬영 (카메라 활성화 상태)
- **엔터키**: 이미지 전송 (미리보기 상태)

## 🔧 기술 스택

### 프론트엔드
- **HTML5**: 웹 구조
- **JavaScript (ES6+)**: 카메라 제어 및 서버 통신
- **CSS3 + TailwindCSS**: 반응형 UI 스타일링
- **Canvas API**: 이미지 캡처 및 처리
- **MediaDevices API**: 웹캠 접근

### 백엔드
- **FastAPI**: 고성능 Python 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **Pydantic**: 데이터 검증
- **Python-magic**: 파일 타입 검증
- **Base64**: 이미지 데이터 인코딩/디코딩

## 🛡️ 보안 기능

### 파일 업로드 보안
- **파일 크기 제한**: 최대 5MB
- **확장자 검증**: jpg, jpeg, png, gif, webp만 허용
- **MIME 타입 검증**: 이중 보안 검증
- **고유 파일명**: UUID를 사용한 중복 방지
- **CORS 설정**: 크로스 오리진 요청 제어

### 에러 처리
- **상세 에러 메시지**: 사용자 친화적 오류 안내
- **HTTP 상태 코드**: RESTful API 표준 준수
- **서버 연결 체크**: 프론트엔드에서 서버 상태 확인

## 📡 API 엔드포인트

### 이미지 업로드
```http
POST /api/upload-base64
Content-Type: application/json

{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "filename": "quiz_image.jpg"
}
```

### 응답 예시
```json
{
  "success": true,
  "message": "이미지가 성공적으로 업로드되었습니다.",
  "file_path": "uploads/quiz_20241201_123456_a1b2c3d4.jpg",
  "filename": "quiz_20241201_123456_a1b2c3d4.jpg",
  "mime_type": "image/jpeg",
  "file_size": 125443
}
```

### 기타 엔드포인트
- `GET /` - 서버 상태 확인
- `GET /api/health` - 서버 헬스체크
- `POST /api/upload-image` - 파일 업로드 방식
- `GET /api/uploads/{filename}` - 업로드된 파일 정보 조회

## 📱 브라우저 지원

- ✅ **Chrome 53+**: 완전 지원
- ✅ **Firefox 36+**: 완전 지원  
- ✅ **Safari 11+**: 완전 지원
- ✅ **Edge 12+**: 완전 지원
- ❌ **Internet Explorer**: 지원하지 않음

## 🔮 다음 단계 (향후 개발)

### Phase 3: OCR 통합
- [ ] Tesseract.js 또는 Google Vision API 연동
- [ ] 이미지에서 텍스트 추출
- [ ] 퀴즈 텍스트 전처리 및 정리

### Phase 4: AI 분석
- [ ] OpenAI GPT-4V 또는 Claude 3 연동
- [ ] 퀴즈 정답 추론 API 구현
- [ ] 해설 및 풀이 과정 생성

### Phase 5: UI/UX 고도화
- [ ] 실시간 OCR 미리보기
- [ ] 정답 결과 화면 디자인
- [ ] 히스토리 및 즐겨찾기 기능
- [ ] 다크모드 지원

## 🐛 문제 해결

### 카메라 접근 오류
```
해결방법:
1. HTTPS 환경에서 실행 (카메라 권한 필요)
2. 브라우저에서 카메라 권한 허용
3. 다른 앱에서 카메라 사용 중인지 확인
```

### 서버 연결 실패
```
해결방법:
1. 백엔드 서버가 실행 중인지 확인 (포트 8001)
2. 방화벽 설정 확인
3. 콘솔에서 오류 메시지 확인
```

### 이미지 업로드 실패
```
해결방법:
1. 파일 크기 5MB 이하 확인
2. 지원 형식 확인 (jpg, png, gif, webp)
3. uploads 폴더 쓰기 권한 확인
```

## 💡 개발 팁

### 로컬 HTTPS 테스트
```bash
# mkcert로 로컬 SSL 인증서 생성
mkcert localhost 127.0.0.1

# HTTPS 서버 실행
python -m http.server 8000 --bind localhost
```

### 백엔드 개발 모드
```bash
# 코드 변경시 자동 재시작
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 디버깅
- **프론트엔드**: 브라우저 개발자 도구 콘솔 확인
- **백엔드**: 터미널에서 로그 메시지 확인
- **네트워크**: 개발자 도구 Network 탭에서 API 요청 확인

## 📞 지원 및 기여

이 프로젝트는 교육 및 학습 목적으로 개발되었습니다.

### 기능 요청 및 버그 리포트
- 이슈 등록을 통해 문제점이나 개선사항을 알려주세요
- 코드 기여는 풀 리퀘스트를 통해 환영합니다

---

**⚡ 빠른 시작**: `setup_and_run.bat` 실행 → 브라우저에서 `http://localhost:8000` 접속!