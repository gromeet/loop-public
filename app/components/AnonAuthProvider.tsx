"use client";

import { useEffect } from "react";
import { ensureAnonymousSession } from "@/app/lib/auth";

export function AnonAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureAnonymousSession();
  }, []);

  return <>{children}</>;
}
