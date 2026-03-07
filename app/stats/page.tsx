"use client";

import { useEffect, useState } from "react";
import { getQuarterInfo } from "@/app/lib/rhythm";
import { getDailyEntries, getGoals } from "@/app/lib/storage";

interface DailyEntry {
  date: string;
  mood: string;
  summary: string;
  checked_goals: string[];
}

interface Goal {
  id: string;
  status: string;
  period: string;
}

const moodEmojis = ["😫", "😔", "😐", "😊", "🤩"];
const moodLabels = ["힘들어", "우울해", "보통", "좋아", "최고"];
const moodColors = ["bg-red-300", "bg-orange-300", "bg-yellow-300", "bg-green-300", "bg-emerald-400"];

function getKSTToday(): string {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const d = String(kst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d); // 로컬 시간 기준 (KST)
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

function getMondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface WeekStat {
  monday: string;
  label: string;
  daysRecorded: number;
  totalChecks: number;
}

export default function StatsPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const today = getKSTToday();
  const quarterInfo = getQuarterInfo();

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const since = subtractDays(today, 89); // last 90 days

    const allEntries = getDailyEntries()
      .filter((e) => e.date >= since)
      .sort((a, b) => a.date.localeCompare(b.date));

    const allGoals = getGoals();

    setEntries(allEntries);
    setGoals(allGoals);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // ─── 계산 ─────────────────────────────────────────
  const entryMap = new Map(entries.map((e) => [e.date, e]));

  // 최근 30일 달력 (7열 × 행)
  const last30: string[] = [];
  for (let i = 29; i >= 0; i--) last30.push(subtractDays(today, i));

  // 스트릭 계산 (오늘 미작성 시 어제부터 시작)
  const hasTodayEntry = entryMap.has(today);
  let cursor = hasTodayEntry ? today : subtractDays(today, 1);
  let streak = 0;
  while (entryMap.has(cursor)) {
    streak++;
    cursor = subtractDays(cursor, 1);
  }

  // 최장 스트릭
  let maxStreak = 0, tempStreak = 0;
  for (const d of last30) {
    if (entryMap.has(d)) { tempStreak++; maxStreak = Math.max(maxStreak, tempStreak); }
    else tempStreak = 0;
  }

  // 기분 분포
  const moodCounts: Record<string, number> = {};
  for (const e of entries) if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  const totalMoods = Object.values(moodCounts).reduce((a, b) => a + b, 0);

  // 목표 통계
  const weeklyGoals = goals.filter((g) => g.period === "weekly");
  const quarterlyGoals = goals.filter((g) => g.period === "quarterly");
  const yearlyGoals = goals.filter((g) => g.period === "yearly");
  const weeklyDone = weeklyGoals.filter((g) => g.status === "done").length;
  const quarterlyDone = quarterlyGoals.filter((g) => g.status === "done").length;
  const yearlyDone = yearlyGoals.filter((g) => g.status === "done").length;

  // 월별 기록 수 (최근 6개월)
  const monthCounts: Record<string, number> = {};
  for (const e of entries) {
    const ym = e.date.slice(0, 7); // "YYYY-MM"
    monthCounts[ym] = (monthCounts[ym] || 0) + 1;
  }
  const last6months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today + "T00:00:00");
    d.setMonth(d.getMonth() - i);
    last6months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const maxMonthCount = Math.max(...last6months.map((m) => monthCounts[m] || 0), 1);

  // 지난 4주 달성 히스토리
  const todayMonday = getMondayOfWeek(today);
  const weeks4 = [3, 2, 1, 0].map((weeksAgo) => subtractDays(todayMonday, weeksAgo * 7));

  const week4Stats: WeekStat[] = weeks4.map((monday, idx) => {
    const daysInWeek: string[] = [];
    for (let i = 0; i < 7; i++) daysInWeek.push(addDays(monday, i));

    const daysRecorded = daysInWeek.filter((d) => entryMap.has(d)).length;
    const totalChecks = daysInWeek.reduce((sum, d) => {
      const e = entryMap.get(d);
      return sum + (Array.isArray(e?.checked_goals) ? e!.checked_goals.length : 0);
    }, 0);

    const [, mm, dd] = monday.split("-");
    const label = idx === 3 ? "이번 주" : `${parseInt(mm)}/${parseInt(dd)}`;

    return { monday, label, daysRecorded, totalChecks };
  });

  const maxChecks = Math.max(...week4Stats.map((w) => w.totalChecks), 1);

  // 이번 달 기록율
  const thisMonth = today.slice(0, 7);
  const thisMonthCount = monthCounts[thisMonth] || 0;
  const todayDay = parseInt(today.slice(8));
  const monthRate = Math.round((thisMonthCount / todayDay) * 100);

  return (
    <div className="px-4 pt-6 pb-6">
      {/* 헤더 */}
      <div className="mb-5">
        <h1 className="text-xl font-bold">통계</h1>
        <p className="text-xs text-gray-400 mt-0.5">기록이 쌓이면 패턴이 보입니다</p>
      </div>

      {/* ── 핵심 지표 3개 ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-indigo-600 text-white p-3 text-center">
          <p className="text-2xl font-black">{streak}</p>
          <p className="text-[10px] opacity-80 mt-0.5">현재 스트릭</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-black text-gray-800">{maxStreak}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">최장 스트릭</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-black text-gray-800">{monthRate}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">이달 기록율</p>
        </div>
      </div>

      {/* ── 30일 달력 히트맵 ── */}
      <div className="mb-4 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">최근 30일 기록</p>
        <div className="grid grid-cols-7 gap-1">
          {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
            <div key={d} className="text-center text-[10px] text-gray-300 font-medium mb-0.5">{d}</div>
          ))}
          {/* 첫날 요일 offset */}
          {(() => {
            const firstDate = new Date(last30[0] + "T00:00:00");
            // getDay(): 0=일, 1=월... 월요일 기준 grid
            const dow = firstDate.getDay(); // 0=일
            const offset = dow === 0 ? 6 : dow - 1; // 월=0, 일=6
            const cells = [];
            for (let i = 0; i < offset; i++) {
              cells.push(<div key={`empty-${i}`} />);
            }
            for (const date of last30) {
              const hasEntry = entryMap.has(date);
              const isToday = date === today;
              const entry = entryMap.get(date);
              const moodIdx = entry ? moodEmojis.indexOf(entry.mood) : -1;
              cells.push(
                <div
                  key={date}
                  title={date}
                  className={`aspect-square rounded-md flex items-center justify-center text-[10px] ${
                    isToday ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                  } ${
                    hasEntry
                      ? moodIdx >= 0
                        ? [
                            "bg-red-200",
                            "bg-orange-200",
                            "bg-yellow-200",
                            "bg-green-200",
                            "bg-emerald-300",
                          ][moodIdx]
                        : "bg-indigo-200"
                      : "bg-gray-100"
                  }`}
                >
                  {hasEntry ? (moodIdx >= 0 ? moodEmojis[moodIdx] : "📝") : ""}
                </div>
              );
            }
            return cells;
          })()}
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-[10px] text-gray-400">기분별 색상:</span>
          {moodEmojis.map((e, i) => (
            <div key={e} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${moodColors[i]}`} />
              <span className="text-[10px] text-gray-400">{moodLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 기분 분포 ── */}
      {totalMoods > 0 && (
        <div className="mb-4 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">기분 분포 (최근 {entries.filter(e => e.mood).length}일)</p>
          <div className="space-y-2">
            {moodEmojis.map((emoji, i) => {
              const count = moodCounts[emoji] || 0;
              const pct = totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0;
              return (
                <div key={emoji} className="flex items-center gap-2">
                  <span className="text-base w-6">{emoji}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${moodColors[i]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{count}일</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 목표 달성률 ── */}
      <div className="mb-4 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">목표 달성 현황</p>
        <div className="space-y-3">
          {[
            { label: "주간 목표", total: weeklyGoals.length, done: weeklyDone, color: "bg-blue-400" },
            {
              label: `분기 목표 (Q${quarterInfo.quarter})`,
              total: quarterlyGoals.length,
              done: quarterlyDone,
              color: "bg-violet-400",
            },
            { label: "연간 목표", total: yearlyGoals.length, done: yearlyDone, color: "bg-indigo-500" },
          ].map(({ label, total, done, color }) => {
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className="text-xs text-gray-400">
                    {total === 0 ? "목표 없음" : `${done}/${total} (${pct}%)`}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${color}`}
                    style={{ width: total > 0 ? `${pct}%` : "0%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4주 달성 히스토리 ── */}
      <div className="mb-4 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 mb-1">주간 달성 히스토리</p>
        <p className="text-[10px] text-gray-400 mb-3">지난 4주 기록일수 · 목표 달성 횟수</p>
        <div className="flex items-end gap-3 h-28">
          {week4Stats.map((w) => {
            const checkPct = Math.round((w.totalChecks / maxChecks) * 100);
            const isThisWeek = w.label === "이번 주";
            return (
              <div key={w.monday} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{w.totalChecks}회</span>
                <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isThisWeek ? "bg-indigo-500" : "bg-indigo-200"
                    }`}
                    style={{ height: `${Math.max(checkPct, w.totalChecks > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{w.daysRecorded}/7</span>
                <span className="text-[10px] text-gray-400">{w.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 월별 기록 수 바 차트 ── */}
      <div className="mb-4 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">월별 기록 수 (최근 6개월)</p>
        <div className="flex items-end gap-2 h-24">
          {last6months.map((ym) => {
            const count = monthCounts[ym] || 0;
            const heightPct = Math.round((count / maxMonthCount) * 100);
            const isThisMonth = ym === thisMonth;
            const [y, m] = ym.split("-");
            return (
              <div key={ym} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{count}</span>
                <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isThisMonth ? "bg-indigo-500" : "bg-indigo-200"
                    }`}
                    style={{ height: `${Math.max(heightPct, count > 0 ? 10 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{parseInt(m)}월</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 분기 진행 상황 ── */}
      <div className="mb-3 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-4">
        <p className="text-[10px] font-semibold text-indigo-200 mb-1 uppercase tracking-widest">분기 현황</p>
        <p className="text-base font-bold">Q{quarterInfo.quarter} · {quarterInfo.weekInQuarter}주차</p>
        <p className="text-xs text-indigo-200 mb-3">{quarterInfo.weeksLeft}주 남았습니다</p>
        <div className="h-2 w-full rounded-full bg-white/20">
          <div
            className="h-2 rounded-full bg-white transition-all"
            style={{ width: `${Math.min(Math.round(((12 - quarterInfo.weeksLeft) / 12) * 100), 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-indigo-200">
            {Math.round(((12 - quarterInfo.weeksLeft) / 12) * 100)}% 지남
          </span>
          <span className="text-[10px] text-indigo-200">12주 완주</span>
        </div>
      </div>
    </div>
  );
}
