-- LOOP 앱 DB 스키마
-- Supabase SQL Editor에서 실행: https://supabase.com/dashboard/project/dnkqmvhiwhraurpisorw/sql/new

-- 1. goals 테이블
CREATE TABLE IF NOT EXISTS goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('yearly', 'monthly', 'weekly')),
  area TEXT NOT NULL,
  title TEXT NOT NULL,
  why TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'done', 'dropped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. daily_entries 테이블
CREATE TABLE IF NOT EXISTS daily_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  tomorrow TEXT NOT NULL DEFAULT '',
  checked_goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. reflections 테이블
CREATE TABLE IF NOT EXISTS reflections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'yearly')),
  good TEXT DEFAULT '',
  bad TEXT DEFAULT '',
  next TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (본인 데이터만 접근 가능)
DROP POLICY IF EXISTS "own_goals" ON goals;
DROP POLICY IF EXISTS "own_daily" ON daily_entries;
DROP POLICY IF EXISTS "own_reflections" ON reflections;

CREATE POLICY "own_goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_daily" ON daily_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_reflections" ON reflections FOR ALL USING (auth.uid() = user_id);
