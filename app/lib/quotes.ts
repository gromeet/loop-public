/**
 * 일일 명언 — 날짜 기반으로 하루 한 개 고정 표시
 */

export interface Quote {
  text: string;
  author: string;
}

const quotes: Quote[] = [
  { text: "당신이 오늘 하는 행동이 당신의 내일을 만든다.", author: "마하트마 간디" },
  { text: "1%의 개선이 매일 쌓이면 1년 뒤 37배가 된다.", author: "제임스 클리어" },
  { text: "규율이 자유를 만든다.", author: "조코 윌링크" },
  { text: "크게 생각하라. 작게 시작하라. 지금 시작하라.", author: "스티브 잡스" },
  { text: "평범한 하루가 비범한 삶을 만든다.", author: "" },
  { text: "승자는 포기하지 않고, 포기하는 자는 이기지 못한다.", author: "빈스 롬바르디" },
  { text: "어제보다 1%만 나아지면 충분하다.", author: "" },
  { text: "두려움을 느끼면서도 행동하는 것이 용기다.", author: "" },
  { text: "기록하지 않으면 기억하지 못한다.", author: "" },
  { text: "목표는 현실이 되기 전에 종이 위에 먼저 살아야 한다.", author: "브라이언 트레이시" },
  { text: "오늘의 나는 어제의 내가 만든 것이다.", author: "" },
  { text: "지금 힘들다면 올바른 방향으로 가고 있다는 신호다.", author: "" },
  { text: "당신의 루틴이 당신의 결과를 만든다.", author: "" },
  { text: "목표 없이 사는 것은 지도 없이 항해하는 것과 같다.", author: "피츠휴 도슨" },
  { text: "행동이 항상 행복을 가져다주지는 않는다. 그러나 행동 없이는 행복이 없다.", author: "벤자민 디즈레일리" },
  { text: "위대한 일은 충동적으로 이루어지지 않는다. 작은 일들의 연속으로 이루어진다.", author: "빈센트 반 고흐" },
  { text: "자기 자신을 정복하는 것이 가장 위대한 승리다.", author: "플라톤" },
  { text: "인생에서 가장 큰 영광은 한 번도 넘어지지 않는 것이 아니라 넘어질 때마다 일어나는 데 있다.", author: "넬슨 만델라" },
  { text: "당신이 집중하는 곳에 에너지가 흐른다.", author: "토니 로빈스" },
  { text: "시작이 반이다.", author: "아리스토텔레스" },
  { text: "성공은 최선을 다하는 매일이 쌓인 결과다.", author: "" },
  { text: "완벽할 필요 없다. 계속하기만 하면 된다.", author: "" },
  { text: "지금 이 순간에도 누군가는 훈련하고 있다.", author: "" },
  { text: "고통은 일시적이다. 포기는 영원하다.", author: "랜스 암스트롱" },
  { text: "꿈꾸는 것과 실행하는 것의 차이가 결과를 만든다.", author: "" },
  { text: "준비된 자에게 기회가 온다.", author: "세네카" },
  { text: "오늘 할 수 있는 일을 내일로 미루지 말라.", author: "벤자민 프랭클린" },
  { text: "아무것도 하지 않으면 아무것도 얻지 못한다.", author: "" },
];

export function getDailyQuote(): Quote {
  const kstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const start = new Date(kstNow.getFullYear(), 0, 0);
  const diff = kstNow.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
}
