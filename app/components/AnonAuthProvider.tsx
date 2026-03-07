"use client";
// localStorage 모드에서는 auth 불필요
export function AnonAuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
