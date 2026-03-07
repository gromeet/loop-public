// localStorage 기반 데이터 레이어 — Supabase 없이 동작
// 데이터는 브라우저 로컬에 저장됨

export type Goal = {
  id: string;
  user_id: string;
  period: 'yearly' | 'monthly' | 'weekly';
  area: string;
  title: string;
  why: string;
  status: 'active' | 'done' | 'dropped';
  created_at: string;
};

export type DailyEntry = {
  id: string;
  user_id: string;
  date: string;
  mood: string;
  summary: string;
  tomorrow: string;
  tomorrow_goal_id?: string | null;
  checked_goals: string[];
  created_at: string;
  updated_at: string;
};

export type Reflection = {
  id: string;
  user_id: string;
  type: 'weekly' | 'monthly' | 'yearly';
  good: string;
  bad: string;
  next: string;
  created_at: string;
};

function genId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// --- Goals ---
export function getGoals(): Goal[] {
  try {
    return JSON.parse(localStorage.getItem('loop_goals') || '[]');
  } catch { return []; }
}

export function saveGoals(goals: Goal[]): void {
  localStorage.setItem('loop_goals', JSON.stringify(goals));
}

export function addGoal(goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>): Goal {
  const goals = getGoals();
  const newGoal: Goal = { ...goal, id: genId(), user_id: 'local', created_at: now() };
  goals.push(newGoal);
  saveGoals(goals);
  return newGoal;
}

export function updateGoal(id: string, updates: Partial<Goal>): Goal | null {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === id);
  if (idx === -1) return null;
  goals[idx] = { ...goals[idx], ...updates };
  saveGoals(goals);
  return goals[idx];
}

export function deleteGoal(id: string): void {
  saveGoals(getGoals().filter(g => g.id !== id));
}

// --- Daily Entries ---
export function getDailyEntries(): DailyEntry[] {
  try {
    return JSON.parse(localStorage.getItem('loop_daily') || '[]');
  } catch { return []; }
}

export function saveDailyEntries(entries: DailyEntry[]): void {
  localStorage.setItem('loop_daily', JSON.stringify(entries));
}

export function getDailyEntry(date: string): DailyEntry | null {
  return getDailyEntries().find(e => e.date === date) || null;
}

export function upsertDailyEntry(date: string, updates: Partial<DailyEntry>): DailyEntry {
  const entries = getDailyEntries();
  const idx = entries.findIndex(e => e.date === date);
  if (idx === -1) {
    const entry: DailyEntry = {
      id: genId(),
      user_id: 'local',
      date,
      mood: '',
      summary: '',
      tomorrow: '',
      tomorrow_goal_id: null,
      checked_goals: [],
      created_at: now(),
      updated_at: now(),
      ...updates,
    };
    entries.push(entry);
    saveDailyEntries(entries);
    return entry;
  }
  entries[idx] = { ...entries[idx], ...updates, updated_at: now() };
  saveDailyEntries(entries);
  return entries[idx];
}

// --- Reflections ---
export function getReflections(): Reflection[] {
  try {
    return JSON.parse(localStorage.getItem('loop_reflections') || '[]');
  } catch { return []; }
}

export function addReflection(ref: Omit<Reflection, 'id' | 'user_id' | 'created_at'>): Reflection {
  const refs = getReflections();
  const newRef: Reflection = { ...ref, id: genId(), user_id: 'local', created_at: now() };
  refs.push(newRef);
  localStorage.setItem('loop_reflections', JSON.stringify(refs));
  return newRef;
}

export function getReflectionsByType(type: string): Reflection[] {
  return getReflections().filter(r => r.type === type);
}
