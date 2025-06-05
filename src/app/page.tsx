'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Brain, Loader2, CheckCircle, X } from 'lucide-react'

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
        setError(null)
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage.split(',')[1], // base64 부분만 전송
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setResult(data.result)
      } else {
        setError(data.error || '분석 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다. 다시 시도해주세요.')
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetApp = () => {
    setSelectedImage(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">AI 퀴즈 분석기</h1>
          </div>
          <p className="text-lg text-gray-600">
            퀴즈 문제를 업로드하면 AI가 정답을 분석해드립니다
          </p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!selectedImage && (
            <div className="text-center space-y-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 mx-auto max-w-md"
              >
                <Upload className="w-16 h-16 text-blue-500 mb-4" />
                <span className="text-blue-700 font-semibold text-lg">퀴즈 이미지 업로드</span>
                <span className="text-gray-500 mt-2">이미지를 선택해주세요</span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* 선택된 이미지 표시 */}
          {selectedImage && (
            <div className="space-y-6">
              <div className="text-center">
                <img
                  src={selectedImage}
                  alt="Selected quiz"
                  className="max-w-full h-auto max-h-96 mx-auto rounded-lg shadow-lg"
                />
              </div>
              
              <div className="flex justify-center gap-4">
                {!isAnalyzing && !result && (
                  <button
                    onClick={analyzeImage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                  >
                    <Brain className="w-5 h-5" />
                    AI 분석 시작
                  </button>
                )}
                
                <button
                  onClick={resetApp}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  다시 선택
                </button>
              </div>
            </div>
          )}

          {/* 로딩 상태 */}
          {isAnalyzing && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-lg text-gray-600">AI가 퀴즈를 분석하고 있습니다...</p>
            </div>
          )}

          {/* 결과 표시 */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-green-700 mb-4">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-xl font-semibold">분석 완료!</h3>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-gray-800 mb-2">AI 분석 결과:</h4>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              </div>
              
              <button
                onClick={resetApp}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                새로운 퀴즈 분석하기
              </button>
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                확인
              </button>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-gray-500">
          <p>© 2024 AI 퀴즈 분석기</p>
        </div>
      </div>
    </div>
  )
}
