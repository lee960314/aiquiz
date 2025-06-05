from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import uuid
from datetime import datetime
import shutil
from pathlib import Path
import base64
from pydantic import BaseModel
from typing import Optional
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI 퀴즈 솔버 API", version="1.0.0")

# CORS 설정 (프론트엔드와 통신을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포시에는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 폴더 설정
UPLOAD_FOLDER = "uploads"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/jpg', 'image/png', 
    'image/gif', 'image/webp'
}

# uploads 폴더 생성
Path(UPLOAD_FOLDER).mkdir(exist_ok=True)

# Base64 이미지 데이터 모델
class ImageData(BaseModel):
    image_data: str
    filename: Optional[str] = None

def get_file_extension(filename: str) -> str:
    """파일 확장자 추출"""
    return filename.lower().split('.')[-1] if '.' in filename else ''

def is_allowed_file(filename: str) -> bool:
    """허용된 파일 확장자인지 확인"""
    extension = get_file_extension(filename)
    return extension in ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename: str) -> str:
    """고유한 파일명 생성"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    extension = get_file_extension(original_filename)
    return f"quiz_{timestamp}_{unique_id}.{extension}"

@app.get("/")
async def root():
    """서버 상태 확인"""
    return {
        "message": "AI 퀴즈 솔버 API 서버가 정상 작동 중입니다.",
        "version": "1.0.0",
        "upload_folder": UPLOAD_FOLDER
    }

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """파일 업로드 방식으로 이미지 업로드"""
    try:
        # 파일 크기 확인
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"파일 크기가 너무 큽니다. 최대 {MAX_FILE_SIZE // 1024 // 1024}MB까지 허용됩니다."
            )
        
        # 파일 확장자 확인
        if not is_allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 파일 형식입니다. 허용된 형식: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # MIME 타입 확인 (추가 보안)
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail="유효하지 않은 이미지 파일입니다."
            )
        
        # 고유한 파일명 생성
        unique_filename = generate_unique_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        logger.info(f"파일 업로드 성공: {file_path}")
        
        return JSONResponse(content={
            "success": True,
            "message": "이미지가 성공적으로 업로드되었습니다.",
            "file_path": file_path,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_size": len(file_content)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"파일 업로드 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")

@app.post("/api/upload-base64")
async def upload_base64_image(image_data: ImageData):
    """Base64 형식으로 이미지 업로드"""
    try:
        # Base64 데이터 파싱
        if not image_data.image_data.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="유효하지 않은 Base64 이미지 데이터입니다.")
        
        # Base64 헤더 제거 및 디코딩
        header, data = image_data.image_data.split(',', 1)
        image_bytes = base64.b64decode(data)
        
        # 파일 크기 확인
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"파일 크기가 너무 큽니다. 최대 {MAX_FILE_SIZE // 1024 // 1024}MB까지 허용됩니다."
            )
        
        # MIME 타입 추출
        mime_type = header.split(';')[0].split(':')[1]
        if mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail="지원하지 않는 이미지 형식입니다."
            )
        
        # 확장자 결정
        extension_map = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp'
        }
        extension = extension_map.get(mime_type, 'jpg')
        
        # 고유한 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"quiz_{timestamp}_{unique_id}.{extension}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # 파일 저장
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        
        logger.info(f"Base64 이미지 업로드 성공: {file_path}")
        
        return JSONResponse(content={
            "success": True,
            "message": "이미지가 성공적으로 업로드되었습니다.",
            "file_path": file_path,
            "filename": filename,
            "mime_type": mime_type,
            "file_size": len(image_bytes)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Base64 이미지 업로드 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")

@app.get("/api/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """업로드된 파일 조회"""
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    return JSONResponse(content={
        "success": True,
        "file_path": file_path,
        "filename": filename,
        "file_size": os.path.getsize(file_path)
    })

@app.get("/api/health")
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "upload_folder_exists": os.path.exists(UPLOAD_FOLDER),
        "upload_folder_writable": os.access(UPLOAD_FOLDER, os.W_OK)
    }

# 정적 파일 서빙 (업로드된 이미지 조회용)
app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 