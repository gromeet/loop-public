# LOOP — 목표 추적 일기

로그인 없이 바로 사용하세요. 링크를 열면 자동으로 나만의 공간이 생깁니다.

## 주요 기능

- 📅 **데일리 일기** — 오늘 한 일, 기분, 내일 할 일 기록
- 🎯 **목표 관리** — 연간/월간/주간 목표 설정 및 추적
- 📊 **통계** — 목표 달성률, 기분 트렌드 확인
- 🔄 **회고** — 주간/월간/연간 회고 작성

## 사용 방법

1. 링크 접속 → 자동으로 나만의 공간 생성 (가입 불필요)
2. **목표 설정** → 상단 메뉴 "목표"에서 연/월/주 목표 추가
3. **데일리 기록** → 매일 "오늘" 탭에서 할 일 체크 + 일기 작성
4. **회고** → "회고" 탭에서 주간/월간 돌아보기

> **주의**: 같은 브라우저에서만 데이터가 유지됩니다. 브라우저 데이터를 삭제하면 초기화됩니다.

## 배포 방법 (개발자용)

### 1. Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 접속 → 새 프로젝트 생성
2. `supabase/schema.sql` 내용을 SQL Editor에서 실행
3. **Authentication > Settings > Anonymous sign-ins 활성화**
4. Project Settings > API에서 URL과 anon key 복사

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local에 Supabase URL과 anon key 입력
```

### 3. Vercel 배포
```bash
vercel --prod
# 또는 GitHub 연동으로 자동 배포
```
