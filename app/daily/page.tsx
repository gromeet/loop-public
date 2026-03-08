"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getGoals,
  getDailyEntry,
  upsertDailyEntry,
  addGoal,
} from "@/app/lib/storage";

interface WeeklyGoal {
  id: string;
  title: string;
}

const moods = [
  { emoji: "😫", label: "힘들어" },
  { emoji: "😔", label: "우울해" },
  { emoji: "😐", label: "보통" },
  { emoji: "😊", label: "좋아" },
  { emoji: "🤩", label: "최고" },
];

function getKSTToday(): string {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const d = String(kst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function DailyContent() {
  const [mood, setMood] = useState("");
  const [summary, setSummary] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [tomorrowGoalId, setTomorrowGoalId] = useState<string | null>(null);
  const [addingGoal, setAddingGoal] = useState(false);
  const [addedAsGoal, setAddedAsGoal] = useState(false);
  const [gratitude, setGratitude] = useState(["", "", ""]); // 3가지 감사
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [checkedGoals, setCheckedGoals] = useState<string[]>([]);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [yesterdayTomorrow, setYesterdayTomorrow] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pickedDate, setPickedDate] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // date 파라미터가 있으면 그 날짜, 없으면 오늘 (KST 기준)
  const todayISO = getKSTToday();
  const dateParam = searchParams.get("date");
  const targetISO = dateParam || todayISO;
  const isPastDate = targetISO < todayISO;

  const targetDate = new Date(targetISO + "T00:00:00");

  // toISOString()은 UTC 기준이라 KST 자정에서 날짜가 하루 빠짐 → 로컬 기준으로 직접 계산
  function shiftISO(iso: string, days: number): string {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  const prevISO = shiftISO(targetISO, -1);
  const nextISO = shiftISO(targetISO, 1);

  const dateStr = targetDate.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  useEffect(() => {
    loadData();
  }, [targetISO]);

  function loadData() {
    try {
      const allGoals = getGoals();
      const goals = allGoals
        .filter((g) => g.period === "weekly" && g.status === "active")
        .map((g) => ({ id: g.id, title: g.title }));

      const entry = getDailyEntry(targetISO);
      const prevEntry = getDailyEntry(prevISO);

      setWeeklyGoals(goals);
      setYesterdayTomorrow(prevEntry?.tomorrow || "");

      if (entry) {
        setEntryId(entry.id);
        setMood(entry.mood || "");
        setSummary(entry.summary || "");
        setTomorrow(entry.tomorrow || "");
        const lines = (entry.gratitude || "").split("\n");
        setGratitude([lines[0] || "", lines[1] || "", lines[2] || ""]);
        setTomorrowGoalId(entry.tomorrow_goal_id || null);
        setCheckedGoals(entry.checked_goals || []);
      } else {
        setEntryId(null);
        setMood("");
        setSummary("");
        setTomorrow("");
        setGratitude(["", "", ""]);
        setTomorrowGoalId(null);
        setCheckedGoals([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!summary.trim()) {
      setSaveError("한 줄 요약은 필수입니다.");
      return;
    }
    setSaving(true);
    setSaveError("");

    try {
      const payload = {
        mood,
        summary,
        tomorrow,
        gratitude: gratitude.filter(Boolean).join("\n"),
        checked_goals: checkedGoals,
      };

      const data = upsertDailyEntry(targetISO, payload);

      if (entryId) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        setEntryId(data.id);
        setSaveSuccess(true);
        // 과거 날짜면 히스토리로, 오늘이면 홈으로
        setTimeout(() => router.push(isPastDate ? "/history" : "/?t=" + Date.now()), 800);
      }
    } catch (e) {
      console.error(e);
      setSaveError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function toggleGoal(goalId: string) {
    setCheckedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  }

  function addTomorrowAsGoal() {
    if (!tomorrow.trim() || addingGoal) return;
    setAddingGoal(true);
    try {
      addGoal({
        title: tomorrow.trim(),
        period: "weekly",
        status: "active",
        area: "business",
        why: "",
        goal_type: "task",
      });
      setAddedAsGoal(true);
      const allGoals = getGoals();
      const goals = allGoals
        .filter((g) => g.period === "weekly" && g.status === "active")
        .map((g) => ({ id: g.id, title: g.title }));
      setWeeklyGoals(goals);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingGoal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const charCount = summary.length;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 헤더 */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPastDate && (
              <button onClick={() => router.back()} className="text-indigo-400 text-sm">←</button>
            )}
            <h1 className="text-xl font-bold">{isPastDate ? "지난 일기 쓰기" : "오늘의 일기"}</h1>
          </div>
          {entryId && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-500">편집 중</span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
      </div>

      {/* 날짜 빠른 이동 */}
      <div className="mb-4 flex gap-2">
        {[
          { label: "← 이전", iso: prevISO },
          { label: "오늘", iso: todayISO },
          { label: "다음 →", iso: nextISO },
        ].map(({ label, iso }) => {
          const isActive = targetISO === iso;
          return (
            <Link
              key={label}
              href={iso === todayISO ? "/daily" : `/daily?date=${iso}`}
              className={`flex-1 rounded-lg py-1.5 text-center text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <label className="flex-1 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 cursor-pointer hover:border-indigo-400 transition-colors py-1.5 text-base">
          📅
          <input
            type="date"
            value={pickedDate}
            onChange={(e) => {
              setPickedDate(e.target.value);
              if (e.target.value) router.push(`/daily?date=${e.target.value}`);
            }}
            className="sr-only"
          />
        </label>
      </div>

      {/* 전날 할 일 */}
      {yesterdayTomorrow && (
        <div className="mb-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3">
          <p className="text-xs font-medium text-indigo-400 mb-0.5">📌 전날 정한 이날 할 일</p>
          <p className="text-sm font-semibold text-indigo-700">{yesterdayTomorrow}</p>
        </div>
      )}

      {/* 무드 */}
      <div className="mb-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <p className="mb-3 text-xs font-semibold text-gray-500">그날의 기분</p>
        <div className="flex justify-between">
          {moods.map((m) => (
            <button
              key={m.emoji}
              onClick={() => setMood(m.emoji)}
              className="flex flex-col items-center gap-1"
            >
              <span className={`text-2xl transition-all duration-150 ${
                mood === m.emoji ? "scale-125" : "opacity-30 hover:opacity-60"
              }`}>
                {m.emoji}
              </span>
              <span className={`text-[10px] ${mood === m.emoji ? "text-indigo-600 font-semibold" : "text-gray-300"}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 주간 목표 체크 */}
      {weeklyGoals.length > 0 && (
        <div className="mb-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <p className="mb-2 text-xs font-semibold text-gray-500">
            이번 주 목표 — {checkedGoals.filter(id => weeklyGoals.some(g => g.id === id)).length}/{weeklyGoals.length}
          </p>
          <div className="space-y-2.5">
            {weeklyGoals.map((goal) => {
              const checked = checkedGoals.includes(goal.id);
              return (
                <label key={goal.id} className="flex items-center gap-3 cursor-pointer">
                  <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                  }`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm ${checked ? "text-gray-400 line-through" : "text-gray-700"}`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    {goal.title}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 한 줄 요약 */}
      <div className="mb-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">
            한 줄 요약 <span className="text-red-400">*</span>
          </label>
          <span className={`text-xs ${charCount > 80 ? "text-orange-400" : "text-gray-300"}`}>
            {charCount}/100
          </span>
        </div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value.slice(0, 100))}
          rows={3}
          placeholder="그날 하루, 한 문장으로 기억한다"
          className="w-full resize-none text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
        />
      </div>

      {/* 감사한 것 */}
      <div className="mb-3 rounded-xl bg-white border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🙏</span>
          <p className="text-xs font-semibold text-gray-700">감사한 것</p>
        </div>
        <p className="text-[10px] text-gray-400 mb-3">작은 것도 괜찮아요 — 쓸수록 행복해집니다</p>
        <div className="space-y-2">
          {([
            "첫 번째 감사한 것",
            "두 번째 감사한 것",
            "세 번째 감사한 것",
          ] as const).map((placeholder, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-amber-500 text-xs font-bold w-4 shrink-0">{i + 1}.</span>
              <input
                value={gratitude[i]}
                onChange={(e) => {
                  const next = [...gratitude];
                  next[i] = e.target.value;
                  setGratitude(next);
                }}
                placeholder={placeholder}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-amber-300 focus:bg-white transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 내일 한 가지 — 오늘 쓸 때만 표시 */}
      {!isPastDate && (
        <div className="mb-5 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2">내일 반드시 이룰 한 가지 🎯</label>
          <input
            value={tomorrow}
            onChange={(e) => { setTomorrow(e.target.value); setAddedAsGoal(false); }}
            placeholder="내일 무조건 해낸다"
            className="w-full text-sm font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none"
          />
          {tomorrow.trim() && (
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">이걸 주간 목표에도 추가할까요?</p>
              {addedAsGoal ? (
                <span className="text-xs text-green-600 font-medium">✅ 추가됨</span>
              ) : (
                <button
                  type="button"
                  onClick={addTomorrowAsGoal}
                  disabled={addingGoal}
                  className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {addingGoal ? "추가 중..." : "📌 주간 목표로 추가"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {saveError && (
        <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-500">{saveError}</div>
      )}
      {saveSuccess && (
        <div className="mb-3 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600">
          ✅ 저장됐습니다!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !summary.trim()}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {saving ? "기록 중..." : entryId ? "다시 기록하기" : "기록했다 ✓"}
      </button>
    </div>
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <DailyContent />
    </Suspense>
  );
}
