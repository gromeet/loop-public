import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import GuideButton from "./components/GuideButton";
import { AnonAuthProvider } from "@/app/components/AnonAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LOOP - 목표 추적 일기",
  description: "목표를 세우고, 기록하고, 돌아보세요",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOOP",
  },
  formatDetection: {
    telephone: false,
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LOOP" />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased bg-slate-100`}>
        {/* 데스크탑: 중앙에 모바일 프레임 — flex column으로 내비 항상 하단 고정 */}
        <div className="mx-auto max-w-sm min-h-screen bg-gray-50 shadow-xl">
          <GuideButton />
          <main className="pb-20">
            <AnonAuthProvider>{children}</AnonAuthProvider>
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
