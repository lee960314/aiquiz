'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, Brain, Loader2, CheckCircle, X, Sparkles, Zap } from 'lucide-react'

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setShowCamera(true)
      setError(null)
    } catch (err) {
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setSelectedImage(imageData)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
        setError(null)
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
          image: selectedImage.split(',')[1],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
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
    stopCamera()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-slate-900/20"></div>
        </div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <Brain className="w-16 h-16 text-cyan-400 animate-pulse" />
                <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-spin" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI 퀴즈 분석기
              </h1>
            </div>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              최첨단 AI 기술로 퀴즈 문제를 촬영하거나 업로드하면 
              <span className="text-cyan-400 font-semibold"> 즉시 정확한 분석과 해설</span>을 제공합니다
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 relative overflow-hidden">
              {/* Glassmorphism effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
              
              <div className="relative z-10">
                {!selectedImage && !showCamera && (
                  <div className="text-center space-y-8 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                      <button
                        onClick={startCamera}
                        className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/80 to-blue-600/80 hover:from-cyan-400/90 hover:to-blue-500/90 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Camera className="w-14 h-14 text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-white font-bold text-lg">카메라로 촬영</span>
                        <div className="absolute top-2 right-2">
                          <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                        </div>
                      </button>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/80 to-green-600/80 hover:from-emerald-400/90 hover:to-green-500/90 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Upload className="w-14 h-14 text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-white font-bold text-lg">파일 업로드</span>
                        <div className="absolute top-2 right-2">
                          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        </div>
                      </button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Camera Screen */}
                {showCamera && (
                  <div className="text-center space-y-6 animate-fade-in">
                    <div className="relative inline-block">
                      <video
                        ref={videoRef}
                        className="max-w-full h-auto rounded-2xl shadow-2xl border-4 border-white/20"
                        playsInline
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 rounded-2xl border-4 border-cyan-400/50 animate-pulse"></div>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={capturePhoto}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25 flex items-center gap-3"
                      >
                        <Camera className="w-6 h-6" />
                        사진 촬영
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 flex items-center gap-3"
                      >
                        <X className="w-6 h-6" />
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Image */}
                {selectedImage && !showCamera && (
                  <div className="space-y-6 animate-slide-up">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <img
                          src={selectedImage}
                          alt="Selected quiz"
                          className="max-w-full h-auto max-h-96 mx-auto rounded-2xl shadow-2xl border-4 border-white/20"
                        />
                        <div className="absolute inset-0 rounded-2xl border-4 border-purple-400/50 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      {!isAnalyzing && !result && (
                        <button
                          onClick={analyzeImage}
                          className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 flex items-center gap-3"
                        >
                          <Brain className="w-6 h-6 group-hover:animate-pulse" />
                          AI 분석 시작
                          <Sparkles className="w-5 h-5 animate-spin" />
                        </button>
                      )}
                      
                      <button
                        onClick={resetApp}
                        className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 flex items-center gap-3"
                      >
                        <X className="w-6 h-6" />
                        다시 선택
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="relative mb-8">
                      <Loader2 className="w-16 h-16 text-cyan-400 mx-auto animate-spin" />
                      <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-cyan-400/30 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">AI가 퀴즈를 분석하고 있습니다</h3>
                    <p className="text-slate-300">딥러닝 모델이 문제를 해석하고 정답을 찾고 있어요...</p>
                    <div className="mt-6 flex justify-center">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div className="animate-slide-up">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 text-emerald-300 mb-6">
                          <CheckCircle className="w-8 h-8 animate-pulse" />
                          <h3 className="text-2xl font-bold">분석 완료!</h3>
                          <Sparkles className="w-6 h-6 animate-spin" />
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                          <h4 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
                            <Brain className="w-6 h-6 text-cyan-400" />
                            AI 분석 결과:
                          </h4>
                          <div className="text-slate-200 whitespace-pre-wrap leading-relaxed text-lg">
                            {result}
                          </div>
                        </div>
                        
                        <button
                          onClick={resetApp}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 flex items-center justify-center gap-3"
                        >
                          <Zap className="w-6 h-6" />
                          새로운 퀴즈 분석하기
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="animate-shake">
                    <div className="bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-8 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
                      
                      <div className="relative z-10">
                        <X className="w-12 h-12 text-red-400 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-xl font-bold text-red-300 mb-4">오류가 발생했습니다</h3>
                        <p className="text-red-200 mb-6 text-lg">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-slate-400 animate-fade-in">
            <p className="text-lg">
              © 2024 AI 퀴즈 분석기 | 
              <span className="text-cyan-400 font-semibold"> AI 기술로 더 스마트한 학습</span>을 지원합니다
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </>
  )
} 