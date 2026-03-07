"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";

export default function GuideButton() {
  const pathname = usePathname();
  // 가이드 페이지에서는 버튼 숨김
  if (pathname === "/guide") return null;

  return (
    <Link
      href="/guide"
      className="fixed top-3 right-3 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-md"
      title="사용설명서"
    >
      <HelpCircle size={16} strokeWidth={2} />
    </Link>
  );
}
