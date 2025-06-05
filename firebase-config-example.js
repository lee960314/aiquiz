// Firebase 설정 예시 파일
// 이 파일을 참고하여 firebase-config.js를 수정하세요

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// 예시: Firebase Console에서 복사한 설정
const firebaseConfig = {
  apiKey: "AIzaSyC_example_key_1234567890abcdef",
  authDomain: "ai-quiz-solver.firebaseapp.com",
  projectId: "ai-quiz-solver", 
  storageBucket: "ai-quiz-solver.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890ghijk"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const storage = getStorage(app);

// 디버깅용 로그
console.log('🔥 Firebase 초기화 완료');
console.log('📧 Auth Domain:', firebaseConfig.authDomain);
console.log('🗄️ Storage Bucket:', firebaseConfig.storageBucket);

/* 
Firebase Console에서 설정을 가져오는 방법:

1. Firebase Console (https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. 프로젝트 설정 (⚙️ 아이콘) > 일반 탭
4. "내 앱" 섹션에서 웹 앱 선택
5. "Firebase SDK 스니펫" > "구성" 선택
6. firebaseConfig 객체 복사
7. firebase-config.js 파일에 붙여넣기
*/ 