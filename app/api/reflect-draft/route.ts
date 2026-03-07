import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const entries = body?.entries;

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "일기 데이터 없음" }, { status: 400 });
  }

  // 프롬프트 구성
  const diaryText = entries
    .map((e: { date: string; mood?: string; summary?: string; tomorrow?: string; checked_goals?: string[] }) => {
      const lines: string[] = [];
      lines.push(`[${e.date}]`);
      if (e.mood) lines.push(`기분: ${e.mood}`);
      if (e.summary) lines.push(`오늘: ${e.summary}`);
      if (e.tomorrow) lines.push(`내일 할 것: ${e.tomorrow}`);
      if (Array.isArray(e.checked_goals) && e.checked_goals.length > 0) {
        lines.push(`목표 달성: ${e.checked_goals.length}개`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const prompt = `다음은 지난 7일간의 일기 내용입니다:

${diaryText}

위 일기를 바탕으로 주간 회고를 한국어로 간결하게 작성해주세요.
아래 JSON 형식으로만 답하세요 (다른 텍스트 없이):
{
  "good": "잘한 점 2-3가지를 구체적으로 서술 (2-3문장)",
  "bad": "아쉬운 점이나 개선이 필요한 부분 (1-2문장)",
  "next": "다음 주에 구체적으로 바꿀 행동 (1-2문장)"
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "OpenAI API 오류" }, { status: 500 });
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    const draft = JSON.parse(content);
    return NextResponse.json(draft);
  } catch {
    return NextResponse.json({ error: "응답 파싱 실패" }, { status: 500 });
  }
}
