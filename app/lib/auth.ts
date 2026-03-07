// Auth is no longer needed — localStorage-based, no server auth
export async function ensureAnonymousSession() {
  // no-op: localStorage doesn't require authentication
}
