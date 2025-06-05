# AI 퀴즈 분석기 🧠✨

DeepSeek AI를 활용한 실시간 퀴즈 문제 분석 웹앱입니다. 사용자가 퀴즈 문제 이미지를 업로드하거나 카메라로 촬영하면, AI가 문제를 분석하고 정답과 해설을 제공합니다.

## 🚀 주요 기능

- **📸 실시간 카메라 촬영**: 모바일과 데스크톱에서 카메라로 퀴즈 문제 촬영
- **📁 파일 업로드**: 이미지 파일 직접 업로드 지원
- **🤖 AI 분석**: DeepSeek API를 활용한 정확한 문제 분석
- **📋 상세한 해설**: 문제 요약, 정답, 핵심 개념 설명 제공
- **📱 반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI API**: DeepSeek Chat API
- **Icons**: Lucide React
- **배포**: Vercel

## 🌐 라이브 데모

🔗 **배포 URL**: [https://aiquiz-vercel.vercel.app](https://aiquiz-vercel.vercel.app)

## 📋 사용 방법

1. **이미지 선택**: 
   - "카메라로 촬영" 버튼으로 실시간 촬영
   - "파일 업로드" 버튼으로 이미지 파일 업로드

2. **AI 분석 실행**: 
   - 이미지 선택 후 "AI 분석 시작" 버튼 클릭

3. **결과 확인**: 
   - AI가 제공하는 문제 분석 결과 확인
   - 정답과 상세한 해설 검토

## 🚀 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/lee960314/aiquiz.git -b vercel-app
cd aiquiz-vercel
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 앱을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
aiquiz-vercel/
├── src/
│   └── app/
│       ├── api/
│       │   └── analyze/
│       │       └── route.ts      # DeepSeek API 연동
│       ├── globals.css           # 전역 스타일
│       ├── layout.tsx           # 레이아웃 컴포넌트
│       └── page.tsx             # 메인 페이지
├── public/                      # 정적 파일
├── package.json                 # 프로젝트 설정
└── README.md                   # 프로젝트 문서
```

## 🔧 API 엔드포인트

### POST `/api/analyze`

퀴즈 이미지를 분석하는 API 엔드포인트입니다.

**요청 예시:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**응답 예시:**
```json
{
  "success": true,
  "result": "1. 문제 내용 요약\n2. 정답과 해설\n3. 핵심 개념 설명"
}
```

## 🎯 핵심 특징

- **Zero Configuration**: 설정 없이 바로 사용 가능
- **모바일 최적화**: 터치 인터페이스와 카메라 접근 지원
- **실시간 처리**: 빠른 AI 응답으로 즉시 결과 확인
- **안전한 API 관리**: 환경변수를 통한 보안 키 관리
- **오류 처리**: 사용자 친화적인 에러 메시지 제공

## 🌟 향후 개발 계획

- [ ] 퀴즈 히스토리 저장 기능
- [ ] 난이도별 문제 분류
- [ ] 여러 AI 모델 지원
- [ ] OCR 정확도 향상
- [ ] 음성 답변 기능

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👨‍💻 개발자

**LEE YEONGWOONG**
- GitHub: [@lee960314](https://github.com/lee960314)

---

💡 **AI 기술로 더 스마트한 학습을 지원합니다!**
