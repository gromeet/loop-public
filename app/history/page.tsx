"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";

interface DailyEntry {
  id: string;
  date: string;
  mood: string;
  summary: string;
  tomorrow: string;
  checked_goals: string[];
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selected, setSelected] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    const supabase = createClient();
    const { data } = await supabase
      .from("daily_entries")
      .select("*")
      .order("date", { ascending: false })
      .limit(50);
    setEntries(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">기록</h1>
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600"
        >
          ✏️ 날짜 선택해서 쓰기
        </button>
      </div>

      {/* 날짜 직접 선택 */}
      {showDatePicker && (
        <div className="mb-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
          <p className="text-xs font-semibold text-indigo-600 mb-2">어느 날 일기를 쓸까요?</p>
          <div className="flex gap-2">
            <input
              type="date"
              max={today}
              value={pickedDate}
              onChange={(e) => setPickedDate(e.target.value)}
              className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
            {pickedDate && (
              <Link
                href={`/daily?date=${pickedDate}`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                이동
              </Link>
            )}
          </div>
        </div>
      )}

      {selected ? (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="mb-4 text-sm text-indigo-600"
          >
            ← 목록으로
          </button>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">
                {new Date(selected.date + "T00:00:00").toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </p>
              {selected.mood && (
                <span className="text-xl">{selected.mood}</span>
              )}
            </div>
            {selected.summary ? (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-400">한 줄 요약</p>
                <p className="mt-1 text-sm">{selected.summary}</p>
              </div>
            ) : (
              <p className="mb-3 text-sm text-gray-400 italic">일기를 아직 쓰지 않았어요</p>
            )}
            {selected.tomorrow && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-400">내일 할 일</p>
                <p className="mt-1 text-sm">{selected.tomorrow}</p>
              </div>
            )}
            <Link
              href={`/daily?date=${selected.date}`}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600"
            >
              ✏️ {selected.summary ? "수정하기" : "일기 쓰기"}
            </Link>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-sm text-gray-400 mt-10">
          아직 기록이 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelected(entry)}
              className="w-full rounded-xl bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {new Date(entry.date + "T00:00:00").toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </p>
                <div className="flex items-center gap-2">
                  {!entry.summary && (
                    <span className="text-xs text-orange-400 font-medium">미작성</span>
                  )}
                  <span className="text-lg">{entry.mood}</span>
                </div>
              </div>
              {entry.summary && (
                <p className="mt-1 text-xs text-gray-500 truncate">
                  {entry.summary}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
