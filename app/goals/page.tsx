"use client";

import { useEffect, useState } from "react";
import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal as removeGoal,
  getDailyEntry,
  upsertDailyEntry,
} from "@/app/lib/storage";

interface Goal {
  id: string;
  title: string;
  why: string;
  area: string;
  period: string;
  status: string;
  goal_type: string;
}

const periods = [
  { key: "weekly", label: "주간", desc: "이번 주 반드시 이룰 것" },
  { key: "quarterly", label: "분기", desc: "12주 안에 반드시 달성한다" },
  { key: "yearly", label: "연간", desc: "올해가 끝나면 이걸 이뤄낸다" },
];

const areas = [
  { key: "business", label: "사업" },
  { key: "health", label: "건강" },
  { key: "relationship", label: "관계" },
  { key: "finance", label: "재무" },
  { key: "growth", label: "개인성장" },
  { key: "other", label: "기타" },
];

export default function GoalsPage() {
  const [tab, setTab] = useState("weekly");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [area, setArea] = useState("business");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null); // 수정 중인 목표
  const [goalType, setGoalType] = useState<"task" | "habit">("task");
  const [todayCheckedGoals, setTodayCheckedGoals] = useState<string[]>([]);

  const todayISO = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadGoals();
  }, [tab]);

  useEffect(() => {
    loadTodayChecks();
  }, []);

  function loadTodayChecks() {
    const entry = getDailyEntry(todayISO);
    setTodayCheckedGoals(entry?.checked_goals || []);
  }

  function loadGoals() {
    setLoading(true);
    const allGoals = getGoals();
    const filtered = allGoals
      .filter((g) => g.period === tab)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status.localeCompare(b.status);
        return b.created_at.localeCompare(a.created_at);
      });
    setGoals(filtered);
    setLoading(false);
  }

  function openAdd() {
    setEditGoal(null);
    setTitle("");
    setWhy("");
    setArea("business");
    setGoalType("task");
    setShowModal(true);
  }

  function openEdit(goal: Goal) {
    setEditGoal(goal);
    setTitle(goal.title);
    setWhy(goal.why || "");
    setArea(goal.area || "business");
    setGoalType((goal.goal_type as "task" | "habit") || "task");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditGoal(null);
    setTitle("");
    setWhy("");
    setArea("business");
    setGoalType("task");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editGoal) {
      updateGoal(editGoal.id, { title, why, area, goal_type: goalType });
    } else {
      addGoal({
        title,
        why,
        area,
        period: tab as "weekly" | "quarterly" | "yearly",
        status: "active",
        goal_type: goalType,
      });
    }

    closeModal();
    loadGoals();
  }

  function toggleStatus(goal: Goal) {
    const newStatus = goal.status === "active" ? "done" : "active";
    updateGoal(goal.id, { status: newStatus as "active" | "done" });
    loadGoals();
  }

  function toggleDailyCheck(goalId: string) {
    const isChecked = todayCheckedGoals.includes(goalId);
    const newChecked = isChecked
      ? todayCheckedGoals.filter((id) => id !== goalId)
      : [...todayCheckedGoals, goalId];

    upsertDailyEntry(todayISO, { checked_goals: newChecked });
    setTodayCheckedGoals(newChecked);
  }

  function handleDeleteGoal(id: string) {
    removeGoal(id);
    setDeleteId(null);
    loadGoals();
  }

  const activeGoals = goals.filter((g) => g.status !== "done");
  const doneGoals = goals.filter((g) => g.status === "done");

  const activeGrouped = areas
    .map((a) => ({ ...a, goals: activeGoals.filter((g) => g.area === a.key) }))
    .filter((a) => a.goals.length > 0);

  const currentPeriod = periods.find((p) => p.key === tab);

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">목표</h1>
        <button
          onClick={openAdd}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          + 추가
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-1 flex gap-2">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => { setTab(p.key); setShowDone(false); }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === p.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-gray-400">{currentPeriod?.desc}</p>

      {loading ? (
        <p className="text-center text-sm text-gray-400 mt-10">불러오는 중...</p>
      ) : (
        <>
          {activeGoals.length === 0 && doneGoals.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm text-gray-400">아직 목표가 없습니다</p>
              <button
                onClick={openAdd}
                className="mt-3 text-xs text-indigo-600 underline"
              >
                첫 번째 목표 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGrouped.map((group) => (
                <div key={group.key}>
                  <h2 className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {group.label}
                  </h2>
                  <div className="space-y-2">
                    {group.goals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        todayChecked={todayCheckedGoals.includes(goal.id)}
                        onToggle={() => toggleStatus(goal)}
                        onDailyCheck={() => toggleDailyCheck(goal.id)}
                        onEdit={() => openEdit(goal)}
                        onDelete={() => setDeleteId(goal.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {doneGoals.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowDone(!showDone)}
                    className="flex items-center gap-1 text-xs text-gray-400 mb-2"
                  >
                    <span className={`transition-transform ${showDone ? "rotate-90" : ""}`}>▶</span>
                    완료된 목표 {doneGoals.length}개
                  </button>
                  {showDone && (
                    <div className="space-y-2 opacity-60">
                      {doneGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          todayChecked={todayCheckedGoals.includes(goal.id)}
                          onToggle={() => toggleStatus(goal)}
                          onEdit={() => openEdit(goal)}
                          onDelete={() => setDeleteId(goal.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 추가 / 수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-0">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 pb-8">
            <div className="mb-4 h-1 w-10 rounded-full bg-gray-200 mx-auto" />
            <h2 className="mb-4 text-base font-bold">
              {editGoal ? "목표 수정" : `${currentPeriod?.label} 목표 추가`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">목표</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="반드시 이룬다"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">WHY — 왜 중요한가요?</label>
                <input
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="이걸 이뤄야 하는 이유 — 이게 흔들릴 때 날 잡아준다"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">타입</label>
                <div className="flex gap-2">
                  {[
                    { key: "task", label: "📋 일회성 태스크" },
                    { key: "habit", label: "🔄 반복 습관" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setGoalType(t.key as "task" | "habit")}
                      className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        goalType === t.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">영역</label>
                <div className="flex flex-wrap gap-2">
                  {areas.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => setArea(a.key)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        area === a.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                >
                  {editGoal ? "저장" : "추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold mb-2">목표 삭제</h3>
            <p className="text-sm text-gray-500 mb-5">
              &ldquo;{goals.find((g) => g.id === deleteId)?.title}&rdquo; 을 삭제할까요?<br />
              되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteGoal(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  todayChecked,
  onToggle,
  onDailyCheck,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  todayChecked: boolean;
  onToggle: () => void;
  onDailyCheck?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDone = goal.status === "done";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-50">
      {/* 체크 원: active 목표는 데일리 체크, done 목표는 초록 체크(클릭 불가) */}
      {isDone ? (
        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <button
          onClick={onDailyCheck}
          className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            todayChecked ? "bg-green-500 border-green-500" : "border-gray-300"
          }`}
        >
          {todayChecked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${(isDone || todayChecked) ? "text-gray-400 line-through" : "text-gray-800"}`}>
          {goal.title}
        </p>
        {goal.why && (
          <p className="text-xs text-gray-400 truncate mt-0.5">WHY: {goal.why}</p>
        )}
      </div>
      {/* 영구 완료 버튼: task 타입만 표시 */}
      {(goal.goal_type !== "habit") && (
        <button
          onClick={onToggle}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-green-600 px-2 transition-colors"
        >
          {isDone ? "완료 취소" : "완료"}
        </button>
      )}
      {/* 수정 버튼 */}
      <button
        onClick={onEdit}
        className="flex-shrink-0 text-gray-300 hover:text-indigo-400 transition-colors text-sm px-1"
        title="수정"
      >
        ✏️
      </button>
      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
        title="삭제"
      >
        ×
      </button>
    </div>
  );
}
