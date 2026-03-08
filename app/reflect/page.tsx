"use client";

import { useEffect, useState } from "react";
import {
  getReflectionsByType,
  addReflection,
  updateReflection,
  getDailyEntries,
} from "@/app/lib/storage";
import { getKSTDateISO, shiftISO } from "@/app/lib/kst";

interface Reflection {
  id: string;
  type: string;
  good: string;
  bad: string;
  next: string;
  created_at: string;
}

interface WeekSummary {
  recorded: number;
  avgMood: string;
  totalChecked: number;
  highlights: { date: string; summary: string }[];
}

interface QuarterSummary {
  recorded: number;
  totalChecked: number;
  moodDist: string;
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

function getQuarterStart(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const month = now.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  const d = new Date(now.getFullYear(), quarterStartMonth, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ReflectPage() {
  const [tab, setTab] = useState<"weekly" | "quarterly">("weekly");
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [next, setNext] = useState("");
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [quarterSummary, setQuarterSummary] = useState<QuarterSummary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadReflections();
  }, [tab]);

  function loadReflections() {
    setLoading(true);
    if (tab === "quarterly") {
      setEditingId(null);
    }

    const data = getReflectionsByType(tab)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    setReflections(data);

    // 주간 탭: 이번 주 저장된 회고 있으면 폼에 불러오기
    if (tab === "weekly" && data.length > 0) {
      const mondayISO = getMondayISO();
      const thisWeekReflect = data.find(
        (r) => new Date(r.created_at) >= new Date(mondayISO)
      );
      if (thisWeekReflect) {
        setGood(thisWeekReflect.good || "");
        setBad(thisWeekReflect.bad || "");
        setNext(thisWeekReflect.next || "");
        setEditingId(thisWeekReflect.id);
      } else {
        setGood("");
        setBad("");
        setNext("");
        setEditingId(null);
      }
    }

    if (tab === "weekly") {
      loadWeekSummary();
    } else {
      loadQuarterSummary();
    }

    setLoading(false);
  }

  function loadWeekSummary() {
    const todayKST = getKSTDateISO();
    const days7 = Array.from({ length: 7 }, (_, i) => shiftISO(todayKST, -i));

    const allEntries = getDailyEntries();
    const entries = allEntries.filter((e) => days7.includes(e.date));

    if (entries.length === 0) {
      setWeekSummary(null);
      return;
    }

    const moods = entries.map((e) => e.mood).filter(Boolean);
    let avgMood = "-";
    if (moods.length > 0) {
      const freq: Record<string, number> = {};
      moods.forEach((m) => { freq[m] = (freq[m] || 0) + 1; });
      avgMood = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    }

    const totalChecked = entries.reduce(
      (sum, e) => sum + (Array.isArray(e.checked_goals) ? e.checked_goals.length : 0),
      0
    );

    const highlights = entries
      .filter((e) => e.summary && e.summary.trim())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map((e) => ({ date: e.date, summary: e.summary }));

    setWeekSummary({ recorded: entries.length, avgMood, totalChecked, highlights });
  }

  function loadQuarterSummary() {
    const today = getKSTDateISO();
    const qStart = getQuarterStart();

    const allEntries = getDailyEntries();
    const qEntries = allEntries.filter((e) => e.date >= qStart && e.date <= today);

    if (qEntries.length === 0) {
      setQuarterSummary(null);
      return;
    }

    const totalChecked = qEntries.reduce(
      (sum, e) => sum + (Array.isArray(e.checked_goals) ? e.checked_goals.length : 0),
      0
    );

    const moodFreq: Record<string, number> = {};
    qEntries.forEach((e) => {
      if (e.mood) moodFreq[e.mood] = (moodFreq[e.mood] || 0) + 1;
    });
    const moodDist = Object.entries(moodFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([emoji, count]) => `${emoji}×${count}`)
      .join("  ") || "-";

    setQuarterSummary({ recorded: qEntries.length, totalChecked, moodDist });
  }

  async function generateDraft() {
    if (tab !== "weekly") return;
    setGenerating(true);
    try {
      // Send diary data from localStorage to API
      const todayKST2 = getKSTDateISO();
      const days7 = Array.from({ length: 7 }, (_, i) => shiftISO(todayKST2, -i));
      const allEntries = getDailyEntries();
      const weekEntries = allEntries
        .filter((e) => days7.includes(e.date))
        .map((e) => ({
          date: e.date,
          mood: e.mood,
          summary: e.summary,
          tomorrow: e.tomorrow,
          checked_goals: e.checked_goals,
        }));

      const res = await fetch("/api/reflect-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: weekEntries }),
      });
      if (!res.ok) throw new Error("생성 실패");
      const draft = await res.json();
      if (draft.good) setGood(draft.good);
      if (draft.bad) setBad(draft.bad);
      if (draft.next) setNext(draft.next);
    } catch {
      alert("AI 초안 생성 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setGenerating(false);
    }
  }

  function handleSave() {
    if (!good && !bad && !next) return;
    setSaving(true);
    try {
      if (editingId) {
        updateReflection(editingId, { good, bad, next });
      } else {
        addReflection({ type: tab, good, bad, next });
      }
      loadReflections();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-8">
      <h1 className="mb-4 text-xl font-bold">회고</h1>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(["weekly", "quarterly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              tab === t
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {t === "weekly" ? "주간 회고" : "분기 회고"}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-gray-400">
        {tab === "weekly" ? "이번 주를 돌아봅니다" : "12주 단위로 깊게 돌아봅니다"}
      </p>

      {/* 주간 요약 카드 */}
      {weekSummary && tab === "weekly" && (
        <div className="mb-5 rounded-2xl bg-indigo-50 p-4">
          <p className="mb-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            지난 7일 요약
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-700">{weekSummary.recorded}/7</p>
              <p className="text-xs text-gray-500">기록</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-700">{weekSummary.avgMood}</p>
              <p className="text-xs text-gray-500">평균 기분</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-700">{weekSummary.totalChecked}</p>
              <p className="text-xs text-gray-500">목표 달성</p>
            </div>
          </div>
          {weekSummary.highlights.length > 0 && (
            <div className="space-y-1">
              {weekSummary.highlights.map((h) => (
                <div key={h.date} className="text-xs text-gray-600">
                  <span className="text-indigo-400 font-medium">{h.date.slice(5)}</span>{" "}{h.summary}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 분기 요약 카드 */}
      {quarterSummary && tab === "quarterly" && (
        <div className="mb-5 rounded-2xl bg-purple-50 p-4">
          <p className="mb-2 text-xs font-semibold text-purple-600 uppercase tracking-wide">
            이번 분기 요약
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <p className="text-lg font-bold text-purple-700">{quarterSummary.recorded}일</p>
              <p className="text-xs text-gray-500">기록한 날</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-700">{quarterSummary.totalChecked}회</p>
              <p className="text-xs text-gray-500">목표 달성</p>
            </div>
          </div>
          {quarterSummary.moodDist !== "-" && (
            <div className="text-center text-sm text-gray-600">
              {quarterSummary.moodDist}
            </div>
          )}
        </div>
      )}

      {/* AI 초안 버튼 — 주간만 */}
      {tab === "weekly" && (
        <button
          onClick={generateDraft}
          disabled={generating}
          className="mb-4 w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              AI 초안 생성 중...
            </>
          ) : (
            <>✨ AI로 회고 초안 채우기</>
          )}
        </button>
      )}

      {/* Form */}
      <div className="mb-6 space-y-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-green-600">
            잘한 것
          </label>
          <textarea
            value={good}
            onChange={(e) => setGood(e.target.value)}
            rows={3}
            placeholder="이번 기간에 잘한 것을 적어보세요"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-red-500">
            못 한 것
          </label>
          <textarea
            value={bad}
            onChange={(e) => setBad(e.target.value)}
            rows={3}
            placeholder="아쉬웠던 점을 적어보세요"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-indigo-600">
            다음에 바꿀 것
          </label>
          <textarea
            value={next}
            onChange={(e) => setNext(e.target.value)}
            rows={3}
            placeholder="다음에는 어떻게 할지 적어보세요"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : editingId ? "회고 수정하기" : "회고 저장"}
        </button>
      </div>

      {/* Previous reflections */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-500">이전 회고</h2>
        {loading ? (
          <p className="text-center text-sm text-gray-400">불러오는 중...</p>
        ) : reflections.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            아직 회고가 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {reflections.map((r) => (
              <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("ko-KR")}
                </p>
                {r.good && (
                  <p className="text-sm">
                    <span className="text-green-600">✓</span> {r.good}
                  </p>
                )}
                {r.bad && (
                  <p className="mt-1 text-sm">
                    <span className="text-red-500">✗</span> {r.bad}
                  </p>
                )}
                {r.next && (
                  <p className="mt-1 text-sm">
                    <span className="text-indigo-600">→</span> {r.next}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
