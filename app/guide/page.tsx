"use client";

import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📖 사용설명서</h1>
        <p className="text-sm text-gray-400 mt-1">Loop 시작 가이드</p>
      </div>

      {/* 데이터 저장 안내 */}
      <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ 데이터 저장 방식 안내</p>
        <p className="text-sm text-amber-700">
          데이터는 <strong>이 브라우저(기기)</strong>에만 저장됩니다. 같은 브라우저에서는 언제든 내 기록을 볼 수 있어요.
          다른 기기로 옮기거나 브라우저 데이터를 삭제하면 기록이 사라집니다.
        </p>
      </div>

      {/* STEP 1 */}
      <Section
        step="1"
        icon="🎯"
        title="목표 설정부터 시작해요"
        color="bg-indigo-50 border-indigo-100"
        stepColor="bg-indigo-600"
      >
        <p>하단 메뉴 <strong>목표</strong>를 눌러 목표를 추가하세요.</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li>📅 <strong>연간 목표</strong> — 올해 이루고 싶은 큰 목표</li>
          <li>📆 <strong>분기 목표</strong> — 3개월 단위 목표</li>
          <li>🗓 <strong>주간 목표</strong> — 이번 주에 집중할 것</li>
        </ul>
        <p className="mt-2 text-sm text-gray-500">
          목표 유형을 <strong>할 일</strong>(체크로 완료)과 <strong>습관</strong>(매일 체크)으로 구분할 수 있어요.
        </p>
      </Section>

      {/* STEP 2 */}
      <Section
        step="2"
        icon="📅"
        title="매일 데일리 기록"
        color="bg-green-50 border-green-100"
        stepColor="bg-green-600"
      >
        <p>하단 메뉴 <strong>홈</strong>에서 오늘의 기록을 작성하세요.</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li>✅ 오늘 달성한 <strong>목표 체크</strong></li>
          <li>😊 <strong>오늘 기분</strong> 선택</li>
          <li>✍️ <strong>오늘 한 일</strong> 간단히 기록</li>
          <li>🌙 <strong>내일 할 것</strong> 미리 적기</li>
          <li>🙏 감사한 일 (선택)</li>
        </ul>
      </Section>

      {/* STEP 3 */}
      <Section
        step="3"
        icon="🔄"
        title="주간 회고로 마무리"
        color="bg-violet-50 border-violet-100"
        stepColor="bg-violet-600"
      >
        <p>하단 메뉴 <strong>회고</strong>에서 돌아보세요.</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li>📝 <strong>주간 회고</strong> — 매주 말 잘한 것·아쉬운 것·다음 주 계획</li>
          <li>📝 <strong>분기 회고</strong> — 3개월 돌아보기</li>
          <li>✨ AI가 내 일기를 바탕으로 <strong>회고 초안</strong>을 자동으로 써줘요</li>
        </ul>
      </Section>

      {/* STEP 4 */}
      <Section
        step="4"
        icon="📊"
        title="통계로 패턴 파악"
        color="bg-blue-50 border-blue-100"
        stepColor="bg-blue-600"
      >
        <p>하단 메뉴 <strong>통계</strong>에서 내 기록 패턴을 확인하세요.</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li>🔥 <strong>연속 기록 스트릭</strong></li>
          <li>📅 <strong>30일 히트맵</strong> — 기분별 색상으로 한눈에</li>
          <li>📈 <strong>월별 기록 수</strong>, 목표 달성률</li>
        </ul>
      </Section>

      {/* 히스토리 */}
      <Section
        step="+"
        icon="📚"
        title="과거 기록 보기"
        color="bg-gray-50 border-gray-100"
        stepColor="bg-gray-500"
      >
        <p>하단 메뉴 <strong>기록</strong>에서 날짜별로 과거 일기를 확인할 수 있어요.</p>
      </Section>

      {/* FAQ */}
      <div className="mt-6 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">❓ 자주 묻는 질문</p>
        <div className="space-y-3">
          <Faq q="다른 기기에서도 쓸 수 있나요?">
            현재 버전은 브라우저 로컬 저장 방식이라 기기 간 동기화는 지원하지 않아요.
            같은 기기·브라우저에서만 데이터가 이어집니다.
          </Faq>
          <Faq q="데이터를 백업할 수 있나요?">
            브라우저 개발자도구(F12) &gt; Application &gt; Local Storage에서 직접 복사할 수 있어요. 추후 내보내기 기능을 추가할 예정입니다.
          </Faq>
          <Faq q="AI 회고 초안이 작동하지 않아요">
            AI 초안 기능은 OpenAI 연동이 필요해요. 연동이 없는 경우 수동으로 회고를 작성해주세요.
          </Faq>
        </div>
      </div>

      {/* 돌아가기 */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block rounded-xl bg-indigo-600 text-white px-6 py-3 text-sm font-semibold"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function Section({
  step,
  icon,
  title,
  color,
  stepColor,
  children,
}: {
  step: string;
  icon: string;
  title: string;
  color: string;
  stepColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-4 rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${stepColor}`}>
          STEP {step}
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {icon} {title}
        </span>
      </div>
      <div className="text-sm text-gray-700 space-y-1">{children}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">Q. {q}</p>
      <p className="text-sm text-gray-500 mt-0.5">{children}</p>
    </div>
  );
}
