import { redirect } from "next/navigation";

// 로그인 불필요 — 홈으로 리다이렉트
export default function LoginPage() {
  redirect("/");
}
