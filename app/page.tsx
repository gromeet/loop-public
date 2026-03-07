"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCurrentRhythm, getQuarterInfo } from "@/app/lib/rhythm";
import { getDailyQuote } from "@/app/lib/quotes";
import {
  getGoals,
  getDailyEntries,
  getDailyEntry,
  upsertDailyEntry,
  getReflectionsByType,
} from "@/app/lib/storage";

interface Goal {
  id: string;
  title: string;
  area: string;
  status: string;
  period: string;
}

interface DailyEntry {
  id: string;
  date: string;
  mood: string;
  summary: string;
  tomorrow: string;
  tomorrow_goal_id?: string | null;
  checked_goals: string[];
}

function getMondayISO(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const dow = now.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

const areaLabels: Record<string, string> = {
  business: "사업",
  health: "건강",
  relationship: "관계",
  finance: "재무",
  growth: "성장",
  other: "기타",
};

function HomeContent() {
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([]);
  const [quarterlyGoals, setQuarterlyGoals] = useState<Goal[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<Goal[]>([]);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [yesterdayTomorrow, setYesterdayTomorrow] = useState("");
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingGoal, setCheckingGoal] = useState<string | null>(null);
  const [weeklyReflectDone, setWeeklyReflectDone] = useState(false);

  const searchParams = useSearchParams();
  const rhythmRaw = getCurrentRhythm();
  const quarterInfo = getQuarterInfo();
  const dailyQuote = getDailyQuote();

  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split("T")[0];

  useEffect(() => {
    loadData();
  }, [searchParams]);

  function loadData() {
    try {
      const todayEntryData = getDailyEntry(todayISO);
      const yesterdayEntryData = getDailyEntry(yesterdayISO);

      const allGoals = getGoals();
      const weekly = allGoals
        .filter((g) => g.period === "weekly" && g.status === "active")
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const quarterly = allGoals
        .filter((g) => g.period === "quarterly")
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const yearly = allGoals
        .filter((g) => g.period === "yearly")
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

      const allEntries = getDailyEntries()
        .filter((e) => e.summary && e.summary.trim())
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 90);

      const mondayISO = getMondayISO();
      const weeklyReflections = getReflectionsByType("weekly");
      const thisWeekReflect = weeklyReflections.find(
        (r) => new Date(r.created_at) >= new Date(mondayISO)
      );

      setTodayEntry(todayEntryData);
      setYesterdayTomorrow(yesterdayEntryData?.tomorrow || "");
      setWeeklyGoals(weekly);
      setQuarterlyGoals(quarterly);
      setYearlyGoals(yearly);
      setWeeklyReflectDone(!!thisWeekReflect);

      if (allEntries.length > 0) {
        let count = 0;
        const hasTodayEntry = allEntries[0]?.date === todayISO;
        const cursor = new Date(hasTodayEntry ? todayISO : yesterdayISO);
        for (const e of allEntries) {
          if (e.date === cursor.toISOString().split("T")[0]) {
            count++;
            cursor.setDate(cursor.getDate() - 1);
          } else break;
        }
        setStreak(count);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleGoalCheck(goalId: string) {
    if (checkingGoal) return;
    setCheckingGoal(goalId);
    try {
      const current = todayEntry?.checked_goals || [];
      const isChecking = !current.includes(goalId);
      const newChecked = isChecking
        ? [...current, goalId]
        : current.filter((id) => id !== goalId);

      const data = upsertDailyEntry(todayISO, {
        checked_goals: newChecked,
        summary: todayEntry?.summary || "",
        mood: todayEntry?.mood || "",
        tomorrow: todayEntry?.tomorrow || "",
        ...(todayEntry?.tomorrow_goal_id ? { tomorrow_goal_id: todayEntry.tomorrow_goal_id } : {}),
      });

      setTodayEntry(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingGoal(null);
    }
  }

  const weeklyChecked = weeklyGoals.filter((g) => todayEntry?.checked_goals?.includes(g.id)).length;
  const quarterlyDone = quarterlyGoals.filter((g) => g.status === "done").length;

  // 오늘 일기 이미 썼으면 배너 교체 (summary 있을 때만 완료 판단)
  const hasDiary = !!(todayEntry?.summary && todayEntry.summary.trim().length > 0);
  const rhythm = (() => {
    // 일기 완료 체크
    if (hasDiary && rhythmRaw.phase === "daily_focus") {
      return {
        ...rhythmRaw,
        banner: {
          icon: "✅",
          title: "오늘 일기 완료!",
          desc: streak > 1 ? `${streak}일 연속 기록 중. 내일도 이어가세요 🔥` : "기록이 습관이 되고 있어요",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-700",
          actionLabel: "목표 보기",
          actionHref: "/goals",
        },
      };
    }
    // 회고 완료 체크
    if (weeklyReflectDone && (rhythmRaw.phase === "weekly_reflect_prep" || rhythmRaw.phase === "weekly_reflect")) {
      return {
        ...rhythmRaw,
        banner: {
          icon: "✅",
          title: "이번 주 회고 완료!",
          desc: "잘 마무리됐어요. 다음 주를 기대해요 🙌",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-700",
          actionLabel: "회고 다시 보기",
          actionHref: "/reflect",
        },
      };
    }
    return rhythmRaw;
  })();

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-6">

      {/* ── 헤더 ── */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-indigo-600">LOOP</h1>
          <p className="text-xs text-gray-400">{rhythm.weeklyStatus.label}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5">
          <span className="text-base">{streak > 0 ? "🔥" : "✨"}</span>
          <span className="text-sm font-semibold text-orange-500">
            {streak > 0 ? `${streak}일 연속` : "첫날"}
          </span>
        </div>
      </div>

      {/* ── 주간 진행 바 ── */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => {
            const dotDow = i + 1 === 7 ? 0 : i + 1; // 월=1..일=0
            const isToday = dotDow === rhythm.weeklyStatus.dayOfWeek;
            const isPast = (i + 1 < rhythm.weeklyStatus.dayOfWeek) || (rhythm.weeklyStatus.dayOfWeek === 0);
            return (
              <div key={d} className="flex flex-col items-center gap-0.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                  isToday ? "bg-indigo-600 text-white" :
                  isPast ? "bg-indigo-100 text-indigo-500" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {d}
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-1 w-full rounded-full bg-gray-100">
          <div
            className="h-1 rounded-full bg-indigo-400 transition-all"
            style={{ width: `${rhythm.weeklyStatus.weekProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>Q{quarterInfo.quarter} · {quarterInfo.weekInQuarter}주차</span>
          <span>{quarterInfo.weeksLeft}주 남음</span>
        </div>
      </div>

      {/* ── 리듬 배너 (지금 해야 할 것) ── */}
      <div className={`mb-3 rounded-xl border ${rhythm.banner.color} p-3 flex items-center justify-between`}>
        <div>
          <p className={`text-xs font-semibold ${rhythm.banner.textColor}`}>
            {rhythm.banner.icon} {rhythm.banner.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{rhythm.banner.desc}</p>
        </div>
        <Link
          href={rhythm.banner.actionHref}
          className={`shrink-0 ml-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white ${
            rhythm.banner.color.includes("indigo") ? "bg-indigo-600" :
            rhythm.banner.color.includes("blue") ? "bg-blue-600" :
            rhythm.banner.color.includes("amber") ? "bg-amber-500" :
            rhythm.banner.color.includes("orange") ? "bg-orange-500" :
            rhythm.banner.color.includes("violet") ? "bg-violet-600" :
            rhythm.banner.color.includes("rose") ? "bg-rose-600" :
            rhythm.banner.color.includes("emerald") ? "bg-emerald-600" :
            "bg-indigo-600"
          }`}
        >
          {rhythm.banner.actionLabel}
        </Link>
      </div>

      {/* ── 어제 정한 오늘 할 일 ── */}
      {yesterdayTomorrow && (
        <div className="mb-3 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
          <p className="text-xs font-medium text-indigo-400 mb-0.5">📌 오늘 할 일</p>
          <p className="text-sm font-semibold text-indigo-700">{yesterdayTomorrow}</p>
        </div>
      )}

      {/* ── 오늘 일기 ── */}
      <div className={`mb-3 rounded-xl p-4 border ${hasDiary ? "bg-green-50 border-green-100" : "bg-white border-gray-100 shadow-sm"}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-xs font-medium text-gray-400">오늘 일기</p>
            {hasDiary ? (
              <p className="mt-0.5 text-sm font-medium text-green-600 truncate">
                ✅ {todayEntry!.summary}
              </p>
            ) : (
              <>
                <p className="mt-0.5 text-sm font-semibold text-gray-700">오늘 아직 기록 안 했어요</p>
                <p className="text-xs text-gray-400">기록이 습관을 만든다</p>
              </>
            )}
          </div>
          <Link
            href="/daily"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              hasDiary ? "bg-green-100 text-green-700" : "bg-indigo-600 text-white"
            }`}
          >
            {hasDiary ? "수정" : "지금 기록"}
          </Link>
        </div>
      </div>

      {/* ── 이번 주 목표 ── */}
      {weeklyGoals.length > 0 ? (
        <div className="mb-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">이번 주 목표</p>
            <span className="text-xs text-gray-400">{weeklyChecked}/{weeklyGoals.length} 체크</span>
          </div>
          <div className="mb-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${weeklyGoals.length > 0 ? (weeklyChecked / weeklyGoals.length) * 100 : 0}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {weeklyGoals.map((goal) => {
              const checked = todayEntry?.checked_goals?.includes(goal.id) ?? false;
              const isChecking = checkingGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoalCheck(goal.id)}
                  disabled={!!checkingGoal}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-1 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                  } ${isChecking ? "opacity-50" : ""}`}>
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${checked ? "text-gray-400 line-through" : "text-gray-700"}`}>
                    {goal.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* 주간 목표 없을 때 안내 */
        <div className="mb-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">📋 이번 주 목표</p>
              <p className="mt-0.5 text-xs text-gray-400">이번 주 집중할 것 3개 이하</p>
            </div>
            <Link href="/goals" className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">
              설정하기
            </Link>
          </div>
        </div>
      )}

      {/* ── 이번 분기 목표 ── */}
      {quarterlyGoals.length > 0 ? (
        <div className="mb-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">이번 분기 (12주)</p>
            <span className="text-xs text-gray-400">{quarterlyDone}/{quarterlyGoals.length} 완료</span>
          </div>
          <div className="mb-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-violet-400 transition-all"
              style={{ width: `${quarterlyGoals.length > 0 ? (quarterlyDone / quarterlyGoals.length) * 100 : 0}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {quarterlyGoals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="flex items-center gap-2">
                <span className={`text-xs font-medium w-10 shrink-0 ${goal.status === "done" ? "text-green-500" : "text-gray-400"}`}>
                  {areaLabels[goal.area] || goal.area}
                </span>
                <span className={`text-sm ${goal.status === "done" ? "text-gray-400 line-through" : "text-gray-700"}`}>
                  {goal.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 분기 목표 없을 때 안내 */
        <div className="mb-3 rounded-xl border border-dashed border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-violet-600">🎯 분기 목표 (12주)</p>
              <p className="mt-0.5 text-xs text-violet-400">연간 목표를 12주 단위로 쪼개세요</p>
            </div>
            <Link href="/goals" className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white">
              설정하기
            </Link>
          </div>
        </div>
      )}

      {/* ── 연간 목표 ── */}
      {yearlyGoals.length > 0 ? (
        <div className="mb-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">올해의 방향</p>
            <Link href="/goals" className="text-xs text-indigo-400">전체보기</Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {yearlyGoals.map((goal) => (
              <span
                key={goal.id}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  goal.status === "done" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                }`}
              >
                {goal.title}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* 연간 목표 없을 때 안내 */
        <div className="mb-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600">🌟 올해의 목표</p>
              <p className="mt-0.5 text-xs text-indigo-400">올해 이루고 싶은 것들을 정해보세요</p>
            </div>
            <Link href="/goals" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">
              설정하기
            </Link>
          </div>
        </div>
      )}

      {/* ── 오늘의 명언 ── */}
      <div className="mb-3 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
        <p className="text-[10px] font-semibold text-indigo-200 mb-2 tracking-widest uppercase">오늘의 한마디</p>
        <p className="text-sm font-semibold leading-relaxed">"{dailyQuote.text}"</p>
        {dailyQuote.author && (
          <p className="mt-2 text-xs text-indigo-200 text-right">— {dailyQuote.author}</p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
