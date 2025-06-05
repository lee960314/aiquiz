import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 퀴즈 분석기 - DeepSeek AI로 문제 해결",
  description: "사진으로 찍은 퀴즈 문제를 AI가 분석하여 정답과 해설을 제공하는 스마트한 학습 도구입니다. 카메라 촬영 또는 파일 업로드로 즉시 분석 가능합니다.",
  keywords: ["AI", "퀴즈", "분석", "DeepSeek", "학습", "문제해결", "교육"],
  authors: [{ name: "LEE YEONGWOONG" }],
  creator: "LEE YEONGWOONG",
  openGraph: {
    title: "AI 퀴즈 분석기",
    description: "AI 기술로 퀴즈 문제를 즉시 분석하고 해설을 제공합니다",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 퀴즈 분석기",
    description: "AI 기술로 퀴즈 문제를 즉시 분석하고 해설을 제공합니다",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/brain-icon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
