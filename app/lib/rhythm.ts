/**
 * KST 기반 "지금 뭘 해야 하는가" 로직
 * Asia/Seoul (UTC+9) 기준
 */

export type RhythmPhase =
  | "weekly_goal_set"    // 월요일: 이번 주 목표 설정
  | "daily_focus"        // 화~목: 일기 + 목표 집중
  | "weekly_reflect_prep" // 금~토: 주간 회고 준비
  | "weekly_reflect"     // 일요일: 주간 회고
  | "quarterly_start"    // 분기 시작 (1,4,7,10월 1~7일)
  | "quarterly_end"      // 분기 말 (3,6,9,12월 마지막 주)
  | "yearly_start";      // 연초 (1월 1~7일)

export interface RhythmInfo {
  phase: RhythmPhase;
  banner: {
    icon: string;
    title: string;
    desc: string;
    color: string;   // tailwind bg class
    textColor: string;
    actionLabel: string;
    actionHref: string;
  };
  weeklyStatus: {
    label: string;     // "이번 주 3일째"
    dayOfWeek: number; // 0-6
    weekProgress: number; // 0-100 (월=0, 일=100)
  };
}

function getKSTDate(): Date {
  // 브라우저에서 KST 기준 현재 날짜/시각
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

export function getCurrentRhythm(): RhythmInfo {
  const now = getKSTDate();
  const dow = now.getDay();   // 0=일, 1=월, ..., 6=토
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // 주간 진행도 (월=0%, 일=100%)
  const weekProgress = dow === 0 ? 100 : Math.round(((dow - 1) / 6) * 100);
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const weekLabel =
    dow === 0 ? "일요일 — 오늘 주간 회고 마무리해요" :
    dow === 1 ? "월요일 — 새로운 한 주, 첫 발을 내딛어요" :
    dow === 2 ? "화요일 — 한 주가 달리기 시작했어요 🏃" :
    dow === 3 ? "수요일 — 이번 주 절반 왔어요 💪" :
    dow === 4 ? "목요일 — 마무리가 시작됩니다" :
    dow === 5 ? "금요일 — 이번 주 거의 다 왔어요!" :
    "토요일 — 주말, 회고하고 쉬어가요";

  // 분기 시작/말 감지
  const isQuarterStart = [1, 4, 7, 10].includes(month) && day <= 7;
  const isYearStart = month === 1 && day <= 7;
  const isQuarterEnd = [3, 6, 9, 12].includes(month) && day >= 24;

  let phase: RhythmPhase;

  if (isYearStart && day <= 3) {
    phase = "yearly_start";
  } else if (isQuarterStart) {
    phase = "quarterly_start";
  } else if (isQuarterEnd) {
    phase = "quarterly_end";
  } else if (dow === 0) {
    phase = "weekly_reflect";
  } else if (dow === 1) {
    phase = "weekly_goal_set";
  } else if (dow >= 5) {
    phase = "weekly_reflect_prep";
  } else {
    phase = "daily_focus";
  }

  const banners: Record<RhythmPhase, RhythmInfo["banner"]> = {
    weekly_goal_set: {
      icon: "🗓",
      title: "월요일 — 이번 주 목표 설정",
      desc: "이번 주 집중할 것 3개 이하로 정하세요",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
      actionLabel: "주간 목표 설정",
      actionHref: "/goals",
    },
    daily_focus: {
      icon: "✍️",
      title: "오늘 일기 쓸 시간",
      desc: "3분이면 충분해요. 오늘 하루를 기록하세요",
      color: "bg-indigo-50 border-indigo-200",
      textColor: "text-indigo-700",
      actionLabel: "일기 쓰기",
      actionHref: "/daily",
    },
    weekly_reflect_prep: {
      icon: "📝",
      title: `${dayLabels[dow]}요일 — 주간 회고 준비`,
      desc: "이번 주 어땠나요? 일요일 전에 미리 돌아봐요",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
      actionLabel: "회고 미리 하기",
      actionHref: "/reflect",
    },
    weekly_reflect: {
      icon: "🪞",
      title: "일요일 — 주간 회고 날",
      desc: "이번 주를 돌아보고 다음 주 목표를 준비하세요",
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-700",
      actionLabel: "주간 회고 하기",
      actionHref: "/reflect",
    },
    quarterly_start: {
      icon: "🚀",
      title: `${month}월 — 새 분기 시작`,
      desc: "12주 목표를 지금 설정하면 분기가 달라져요",
      color: "bg-violet-50 border-violet-200",
      textColor: "text-violet-700",
      actionLabel: "분기 목표 설정",
      actionHref: "/goals",
    },
    quarterly_end: {
      icon: "📊",
      title: "분기 마무리",
      desc: "이번 분기를 회고하고 다음 분기를 준비하세요",
      color: "bg-rose-50 border-rose-200",
      textColor: "text-rose-700",
      actionLabel: "분기 회고 하기",
      actionHref: "/reflect",
    },
    yearly_start: {
      icon: "🌟",
      title: "새해 — 연간 목표 설정",
      desc: "올 한 해의 방향을 지금 정하세요",
      color: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-700",
      actionLabel: "연간 목표 설정",
      actionHref: "/goals",
    },
  };

  return {
    phase,
    banner: banners[phase],
    weeklyStatus: {
      label: weekLabel,
      dayOfWeek: dow,
      weekProgress,
    },
  };
}

export function getQuarterInfo(): { quarter: number; weekInQuarter: number; weeksLeft: number } {
  const now = getKSTDate();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const quarter = Math.ceil(month / 3);
  const quarterStartMonth = (quarter - 1) * 3 + 1;
  const quarterStartDate = new Date(now.getFullYear(), quarterStartMonth - 1, 1);
  const diffMs = now.getTime() - quarterStartDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weekInQuarter = Math.floor(diffDays / 7) + 1;
  const weeksLeft = 12 - weekInQuarter + 1;

  return { quarter, weekInQuarter, weeksLeft: Math.max(0, weeksLeft) };
}
