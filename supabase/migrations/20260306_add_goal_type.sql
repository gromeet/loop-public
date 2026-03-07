-- 목표 타입 컬럼 추가 (task: 일회성, habit: 반복 습관)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'task' CHECK (goal_type IN ('task', 'habit'));
