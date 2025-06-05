// AI 퀴즈 솔버 - PythonAnywhere 온라인 버전
// ChatAI API 연동 (온라인 프록시 서버)

// API 설정 - PythonAnywhere 배포용
const API_CONFIG = {
    // 온라인 프록시 서버 (PythonAnywhere 배포 후 업데이트 필요)
    PROXY_URL: "https://yourusername.pythonanywhere.com/api/quiz",  // 실제 계정명으로 변경
    TEST_URL: "https://yourusername.pythonanywhere.com/test",       // 실제 계정명으로 변경
    
    // 로컬 개발용 대체 URL (자동 감지)
    LOCAL_PROXY_URL: "http://localhost:5000/api/quiz",
    LOCAL_TEST_URL: "http://localhost:5000/test",
    
    MODEL: "deepseek-chat",
    
    // API 감지 및 자동 전환
    detectAPI: async function() {
        try {
            // 먼저 온라인 API 테스트
            const onlineResponse = await fetch(this.TEST_URL, { 
                method: 'GET',
                timeout: 5000 
            });
            if (onlineResponse.ok) {
                addDebugLog('🌐 온라인 PythonAnywhere API 사용');
                return {
                    quiz: this.PROXY_URL,
                    test: this.TEST_URL,
                    type: 'online'
                };
            }
        } catch (error) {
            addDebugLog('⚠️ 온라인 API 접속 실패, 로컬 API 확인 중...');
        }
        
        try {
            // 로컬 API 테스트
            const localResponse = await fetch(this.LOCAL_TEST_URL, { 
                method: 'GET',
                timeout: 3000 
            });
            if (localResponse.ok) {
                addDebugLog('🏠 로컬 프록시 서버 사용');
                return {
                    quiz: this.LOCAL_PROXY_URL,
                    test: this.LOCAL_TEST_URL,
                    type: 'local'
                };
            }
        } catch (error) {
            addDebugLog('❌ 로컬 API도 접속 불가');
        }
        
        throw new Error('온라인 및 로컬 API 서버에 모두 접속할 수 없습니다.');
    }
};

// DOM 요소들
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('startCamera');
const capturePhotoBtn = document.getElementById('capturePhoto');
const retakePhotoBtn = document.getElementById('retakePhoto');
const analyzePhotoBtn = document.getElementById('analyzePhoto');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const testApiBtn = document.getElementById('testApiBtn');
const testCameraBtn = document.getElementById('testCameraBtn');
const preview = document.getElementById('preview');
const previewSection = document.getElementById('previewSection');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');
const loadingSection = document.getElementById('loadingSection');
const loadingText = document.getElementById('loadingText');
const progressBar = document.getElementById('progressBar');
const aiResultSection = document.getElementById('aiResultSection');
const aiResult = document.getElementById('aiResult');
const debugLog = document.getElementById('debugLog');

// 전역 변수들
let stream = null;
let capturedImageData = null;
let currentFacingMode = 'environment'; // 후면 카메라가 기본값
let isUsingFrontCamera = false;
let currentApiConfig = null; // 현재 사용중인 API 설정

// 디버그 로그 함수
function addDebugLog(message) {
    console.log('[DEBUG]', message);
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugLog.appendChild(logEntry);
    debugLog.scrollTop = debugLog.scrollHeight;
}

// 진행 상황 업데이트 함수
function updateProgress(percent, message) {
    progressBar.style.width = `${percent}%`;
    if (message) {
        loadingText.textContent = message;
    }
    addDebugLog(`⏳ 진행률 ${percent}%: ${message}`);
}

// 메시지 표시 함수들
function showError(message) {
    addDebugLog(`❌ 에러 발생: ${message}`);
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
    console.error('❌ 오류:', message);
}

function showSuccess(message) {
    addDebugLog(`✅ 성공: ${message}`);
    successText.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
    console.log('✅ 성공:', message);
}

function showLoading(message = 'AI가 분석 중입니다...') {
    loadingText.textContent = message;
    progressBar.style.width = '0%';
    loadingSection.classList.remove('hidden');
    aiResultSection.classList.add('hidden');
}

function hideLoading() {
    loadingSection.classList.add('hidden');
}

// DeepSeek API 호출 함수 (자동 API 감지 포함)
async function analyzeImageWithDeepSeek(base64Image) {
    try {
        showLoading('API 서버 연결 확인 중...');
        updateProgress(10, 'API 서버 감지 중...');

        // API 서버 자동 감지
        if (!currentApiConfig) {
            currentApiConfig = await API_CONFIG.detectAPI();
            addDebugLog(`📡 API 설정: ${currentApiConfig.type} (${currentApiConfig.quiz})`);
        }

        showLoading('AI가 퀴즈를 분석 중입니다...');
        updateProgress(20, 'DeepSeek API에 이미지 전송 중...');

        // base64에서 data:image/jpeg;base64, 부분 제거
        const cleanBase64 = base64Image.split(',')[1];
        const imageSize = Math.round(cleanBase64.length / 1024);
        
        addDebugLog(`📤 이미지 크기: ${imageSize}KB`);
        
        if (imageSize > 4000) {
            throw new Error('이미지 크기가 너무 큽니다. 4MB 이하의 이미지를 사용해주세요.');
        }

        addDebugLog('🤖 DeepSeek API 요청 시작');
        addDebugLog(`📊 모델: ${API_CONFIG.MODEL}`);
        addDebugLog(`🔗 엔드포인트: ${currentApiConfig.quiz}`);

        updateProgress(40, 'AI 분석 진행 중...');

        // 프록시 서버를 통한 API 호출
        const response = await fetch(currentApiConfig.quiz, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ base64: cleanBase64 })
        });

        updateProgress(70, 'AI 응답 처리 중...');

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                addDebugLog(`❌ API 오류 응답: ${JSON.stringify(errorData)}`);
            } catch {
                errorData = await response.text();
                addDebugLog(`❌ API 오류 응답 (텍스트): ${errorData}`);
            }
            
            let errorMessage = `API 요청 실패 (${response.status})`;
            if (response.status === 401) {
                errorMessage = 'API 키가 유효하지 않습니다.';
            } else if (response.status === 429) {
                errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
            } else if (response.status === 413) {
                errorMessage = '이미지 파일이 너무 큽니다. 더 작은 이미지를 사용해주세요.';
            } else if (response.status >= 500) {
                errorMessage = 'DeepSeek 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        addDebugLog(`📥 API 응답 데이터: ${JSON.stringify(data, null, 2)}`);

        updateProgress(90, '결과 표시 중...');

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const aiAnswer = data.choices[0].message.content;
            displayAiResult(aiAnswer);
            showSuccess(`AI 분석이 완료되었습니다! (${currentApiConfig.type} API 사용)`);
        } else {
            throw new Error('AI 응답에서 유효한 답변을 찾을 수 없습니다.');
        }

        updateProgress(100, '분석 완료!');
        
        setTimeout(() => {
            hideLoading();
        }, 500);

    } catch (error) {
        addDebugLog(`❌ DeepSeek API 오류: ${error.message}`);
        hideLoading();
        
        // API 연결 오류인 경우 재감지 시도
        if (error.message.includes('API 서버') || error.message.includes('fetch')) {
            currentApiConfig = null; // API 설정 초기화
            addDebugLog('🔄 API 설정을 초기화했습니다. 다음 요청시 재감지됩니다.');
        }
        
        let errorMsg = 'AI 분석 중 오류가 발생했습니다. ';
        errorMsg += error.message;
        
        showError(errorMsg);
        
        // 에러 발생시 알림창도 표시
        alert(`❌ AI 분석 실패\n\n${errorMsg}\n\n다시 시도하거나 다른 이미지를 시도해보세요.`);
    }
}

// AI 분석 결과 표시 함수
function displayAiResult(result) {
    aiResult.textContent = result;
    aiResultSection.classList.remove('hidden');
    
    // 결과 섹션으로 스크롤 (부드럽게)
    aiResultSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// 카메라 시작 함수 (개선된 버전)
async function startCamera(facingMode = currentFacingMode) {
    try {
        console.log('📹 카메라 시작 시도:', facingMode);
        
        // 기존 스트림이 있다면 정리
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('🔌 기존 카메라 트랙 종료:', track.kind);
            });
            stream = null;
        }

        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: facingMode
            },
            audio: false
        };

        console.log('🎥 카메라 제약 조건:', constraints);
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        // 비디오가 로드될 때까지 기다림
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                console.log('📺 비디오 메타데이터 로드 완료');
                resolve();
            };
        });

        currentFacingMode = facingMode;
        
        // UI 업데이트
        startCameraBtn.classList.add('hidden');
        capturePhotoBtn.classList.remove('hidden');
        previewSection.classList.add('hidden');
        aiResultSection.classList.add('hidden');

        const cameraType = facingMode === 'user' ? '전면' : '후면';
        showSuccess(`${cameraType} 카메라가 시작되었습니다. 퀴즈를 화면에 맞춰주세요.`);

    } catch (error) {
        console.error('❌ 카메라 접근 오류:', error);
        
        let errorMsg = '카메라에 접근할 수 없습니다. ';
        
        if (error.name === 'NotAllowedError') {
            errorMsg += '카메라 권한을 허용해주세요.';
        } else if (error.name === 'NotFoundError') {
            errorMsg += '카메라 장치를 찾을 수 없습니다.';
        } else if (error.name === 'NotSupportedError') {
            errorMsg += '브라우저가 카메라를 지원하지 않습니다.';
        } else if (error.name === 'OverconstrainedError') {
            errorMsg += '요청한 카메라 설정을 지원하지 않습니다. 다른 카메라를 시도합니다.';
            
            // 다른 facingMode로 재시도
            if (facingMode === 'environment') {
                console.log('🔄 전면 카메라로 재시도');
                return startCamera('user');
            } else {
                console.log('🔄 후면 카메라로 재시도');
                return startCamera('environment');
            }
        } else {
            errorMsg += `알 수 없는 오류: ${error.message}`;
        }
        
        showError(errorMsg);
    }
}

// 카메라 전환 함수
async function switchCamera() {
    try {
        addDebugLog('🔄 카메라 전환 시작');
        
        // 현재 스트림이 있다면 정리
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                addDebugLog(`🔌 기존 카메라 트랙 종료: ${track.kind}`);
            });
            stream = null;
        }
        
        // 현재 facingMode 반전
        isUsingFrontCamera = !isUsingFrontCamera;
        const newFacingMode = isUsingFrontCamera ? 'user' : 'environment';
        addDebugLog(`🔄 카메라 모드 변경: ${isUsingFrontCamera ? '전면' : '후면'} 카메라`);
        
        const constraints = {
            video: {
                facingMode: newFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        addDebugLog(`📷 새로운 카메라 제약조건: ${JSON.stringify(constraints, null, 2)}`);

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // 비디오가 로드될 때까지 기다림
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                addDebugLog('📺 비디오 메타데이터 로드 완료');
                resolve();
            };
        });

        const cameraType = isUsingFrontCamera ? '전면' : '후면';
        showSuccess(`${cameraType} 카메라로 전환되었습니다.`);

    } catch (error) {
        addDebugLog(`❌ 카메라 전환 실패: ${error.message}`);
        
        // 전환 실패 시 이전 모드로 복구 시도
        isUsingFrontCamera = !isUsingFrontCamera;
        
        let errorMsg = '카메라 전환 중 오류가 발생했습니다. ';
        if (error.name === 'NotAllowedError') {
            errorMsg += '카메라 권한을 허용해주세요.';
        } else if (error.name === 'NotFoundError') {
            errorMsg += '카메라 장치를 찾을 수 없습니다.';
        } else if (error.name === 'NotSupportedError') {
            errorMsg += '브라우저가 카메라 전환을 지원하지 않습니다.';
        } else if (error.name === 'OverconstrainedError') {
            errorMsg += '요청한 카메라 설정을 지원하지 않습니다.';
        } else {
            errorMsg += error.message;
        }
        
        showError(errorMsg);
        
        // 이전 카메라로 재시도
        try {
            await startCamera(isUsingFrontCamera ? 'user' : 'environment');
        } catch (retryError) {
            addDebugLog(`❌ 카메라 재시도 실패: ${retryError.message}`);
        }
    }
}

// 사진 캡처 함수 (개선된 버전)
function capturePhoto() {
    try {
        console.log('📸 사진 캡처 시작');
        
        if (!video.videoWidth || !video.videoHeight) {
            throw new Error('비디오 스트림이 준비되지 않았습니다.');
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // JPEG 품질 0.8로 압축하여 파일 크기 최적화
        capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
        preview.src = capturedImageData;

        console.log('📏 캡처된 이미지 정보:', {
            width: canvas.width,
            height: canvas.height,
            size: Math.round(capturedImageData.length / 1024) + 'KB'
        });

        // UI 업데이트
        capturePhotoBtn.classList.add('hidden');
        retakePhotoBtn.classList.remove('hidden');
        previewSection.classList.remove('hidden');

        // 카메라 스트림 종료
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            stream = null;
        }

        showSuccess('사진이 캡처되었습니다. AI 분석을 시작해보세요!');

    } catch (error) {
        console.error('❌ 사진 캡처 오류:', error);
        showError(`사진 캡처 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 다시 찍기 함수
function retakePhoto() {
    console.log('🔄 다시 찍기 시작');
    
    capturedImageData = null;
    
    startCameraBtn.classList.remove('hidden');
    capturePhotoBtn.classList.add('hidden');
    retakePhotoBtn.classList.add('hidden');
    previewSection.classList.add('hidden');
    aiResultSection.classList.add('hidden');

    showSuccess('다시 찍기 모드로 전환되었습니다.');
}

// 새로운 분석 시작 함수
function startNewAnalysis() {
    console.log('🆕 새로운 분석 시작');
    retakePhoto();
}

// 이미지 분석 시작 함수
async function analyzeImage() {
    console.log('🤖 이미지 분석 시작');
    
    if (!capturedImageData) {
        showError('분석할 이미지가 없습니다. 먼저 사진을 찍어주세요.');
        return;
    }

    await analyzeImageWithDeepSeek(capturedImageData);
}

// 브라우저 지원 체크
function checkBrowserSupport() {
    console.log('🔍 브라우저 지원 확인 중...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('이 브라우저는 카메라 기능을 지원하지 않습니다.');
        startCameraBtn.disabled = true;
        return false;
    }
    
    console.log('✅ 브라우저 카메라 지원 확인');
    return true;
}

// DeepSeek API 연결 테스트 함수 (자동 감지 포함)
async function testDeepSeekAPI() {
    addDebugLog('🧪 ChatAI API 연결 테스트 시작');
    
    try {
        addDebugLog('🔍 API 서버 자동 감지 시작...');
        
        // API 서버 자동 감지
        const apiConfig = await API_CONFIG.detectAPI();
        addDebugLog(`📡 감지된 API: ${apiConfig.type} (${apiConfig.test})`);

        addDebugLog('📤 프록시 서버 테스트 요청');

        const response = await fetch(apiConfig.test, {
            method: 'GET'
        });

        addDebugLog(`📥 응답 상태: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorData = await response.text();
            addDebugLog(`❌ API 오류 응답: ${errorData}`);
            throw new Error(`API 요청 실패: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        addDebugLog(`📥 응답 데이터: ${JSON.stringify(data, null, 2)}`);
        
        if (data.status === 'success' || data.status === 'OK' || data.service) {
            showSuccess(`API 테스트 성공! ${apiConfig.type === 'online' ? 'PythonAnywhere 온라인' : '로컬'} 프록시 서버가 정상 작동중입니다.`);
            
            // 현재 API 설정 업데이트
            currentApiConfig = apiConfig;
            addDebugLog(`✅ 현재 API 설정이 ${apiConfig.type}로 설정되었습니다.`);
        } else {
            throw new Error('프록시 서버 응답이 예상과 다릅니다');
        }

    } catch (error) {
        addDebugLog(`❌ API 테스트 실패: ${error.message}`);
        
        let errorMsg = `API 테스트 실패: ${error.message}`;
        if (error.message.includes('온라인 및 로컬 API 서버')) {
            errorMsg += '\n\n💡 해결방법:\n';
            errorMsg += '1. 로컬 개발: python proxy_server.py 실행\n';
            errorMsg += '2. 온라인 사용: PythonAnywhere에 배포 필요\n';
            errorMsg += '3. script.js에서 yourusername을 실제 계정명으로 변경';
        }
        
        showError(errorMsg);
    }
}

// 카메라 정보 확인 함수
async function testCameraInfo() {
    addDebugLog('📹 카메라 정보 확인 시작');
    
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        addDebugLog(`📹 사용 가능한 카메라 개수: ${videoDevices.length}`);
        
        videoDevices.forEach((device, index) => {
            addDebugLog(`📹 카메라 ${index + 1}: ${device.label || `Camera ${index + 1}`} (ID: ${device.deviceId})`);
        });

        // 현재 카메라 스트림 정보
        if (stream) {
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            addDebugLog(`📹 현재 카메라 설정: ${JSON.stringify(settings, null, 2)}`);
        } else {
            addDebugLog('📹 현재 활성화된 카메라 스트림이 없습니다');
        }

        showSuccess(`카메라 정보 확인 완료! 총 ${videoDevices.length}개의 카메라가 발견되었습니다.`);

    } catch (error) {
        addDebugLog(`❌ 카메라 정보 확인 실패: ${error.message}`);
        showError(`카메라 정보 확인 실패: ${error.message}`);
    }
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AI 퀴즈 솔버 (빠른 분석 Edition) 초기화 중...');
    
    // 브라우저 지원 체크
    if (!checkBrowserSupport()) {
        return;
    }

    // 카메라 관련 이벤트 리스너
    startCameraBtn.addEventListener('click', () => {
        console.log('🎬 카메라 시작 버튼 클릭');
        startCamera();
    });
    
    capturePhotoBtn.addEventListener('click', () => {
        console.log('📷 사진 찍기 버튼 클릭');
        capturePhoto();
    });
    
    retakePhotoBtn.addEventListener('click', () => {
        console.log('🔄 다시 찍기 버튼 클릭');
        retakePhoto();
    });
    
    analyzePhotoBtn.addEventListener('click', () => {
        console.log('🤖 AI 분석 버튼 클릭');
        analyzeImage();
    });
    
    switchCameraBtn.addEventListener('click', () => {
        console.log('🔄 카메라 전환 버튼 클릭');
        switchCamera();
    });
    
    newAnalysisBtn.addEventListener('click', () => {
        console.log('🆕 새로운 분석 버튼 클릭');
        startNewAnalysis();
    });

    testApiBtn.addEventListener('click', testDeepSeekAPI);
    testCameraBtn.addEventListener('click', testCameraInfo);

    // 키보드 단축키
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && !capturePhotoBtn.classList.contains('hidden')) {
            event.preventDefault();
            console.log('⌨️ 스페이스바로 사진 촬영');
            capturePhoto();
        } else if (event.code === 'Enter' && !previewSection.classList.contains('hidden')) {
            event.preventDefault();
            console.log('⌨️ 엔터키로 AI 분석');
            analyzeImage();
        } else if (event.code === 'KeyS' && !switchCameraBtn.classList.contains('hidden')) {
            event.preventDefault();
            console.log('⌨️ S키로 카메라 전환');
            switchCamera();
        }
    });

    console.log('✨ 초기화 완료!');
    console.log('🤖 DeepSeek API 설정:', {
        model: API_CONFIG.MODEL,
        endpoint: API_CONFIG.PROXY_URL
    });
    console.log('📱 사용법: 카메라 시작 → 사진 찍기 → AI 분석');
    console.log('⌨️ 단축키: 스페이스(촬영), 엔터(분석), S(카메라전환)');
});

// 페이지 언로드 시 카메라 스트림 정리
window.addEventListener('beforeunload', function() {
    console.log('🔌 페이지 종료: 카메라 스트림 정리');
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}); 