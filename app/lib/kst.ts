/**
 * KST 기준 날짜 유틸리티
 * JS Date의 toISOString()은 UTC 기준이라 KST(UTC+9) 자정에서 날짜가 하루 빠지는 버그 발생 → 이 함수로 대체
 */

/** 현재 KST 날짜를 "YYYY-MM-DD" 형식으로 반환 */
export function getKSTDateISO(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** ISO 날짜 문자열에서 days만큼 이동 (로컬 기준, UTC 변환 없음) */
export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
