"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, BookOpen, RefreshCw, BarChart2 } from "lucide-react";

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/goals", label: "목표", icon: Target },
  { href: "/daily", label: "일기", icon: BookOpen },
  { href: "/reflect", label: "회고", icon: RefreshCw },
  { href: "/stats", label: "통계", icon: BarChart2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className="w-full max-w-sm border-t border-gray-100 bg-white pointer-events-auto"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <div className="flex items-center justify-around pt-2 pb-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                  active ? "text-indigo-600 bg-indigo-50" : "text-gray-400"
                }`}
              >
                <tab.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
