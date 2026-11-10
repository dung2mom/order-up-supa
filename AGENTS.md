# Development Guidelines for Agents

## Database (Supabase / PostgreSQL) Rules

Supabase 데이터베이스에서 테이블을 생성하거나 액세스 권한 및 스키마를 구성할 때는 다음 규칙을 **반드시** 준수해야 합니다.

### 1. 명시적 역할(Role) 권한 부여 (GRANT)
PostgREST API를 통해 `anon` 및 `authenticated` 역할이 테이블에 정상적으로 접근할 수 있도록 명시적인 GRANT SQL 문을 반드시 포함합니다.

- 테이블 생성 시 기본 CRUD 권한 부여:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table_name> TO anon, authenticated;
  ```
- 자동 증가 시퀀스(Serial/Identity)를 사용하는 경우 시퀀스 권한도 함께 부여:
  ```sql
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  ```

---

### 2. RLS (Row Level Security) 활성화 및 정책(Policy) 작성
모든 테이블에는 RLS를 활성화하고, 인증된 유저(`authenticated`)만 읽고 쓸 수 있도록 보안 정책을 필수로 작성합니다.

- RLS 활성화:
  ```sql
  ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
  ```
- 인증된 사용자 전용 읽기/쓰기 정책 작성 (예: `user_id` 기준):
  ```sql
  -- 인증된 사용자의 본인 데이터 조회(SELECT) 정책
  CREATE POLICY "Allow authenticated users to read their own data"
    ON public.<table_name>
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  -- 인증된 사용자의 본인 데이터 생성(INSERT) 정책
  CREATE POLICY "Allow authenticated users to insert their own data"
    ON public.<table_name>
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  -- 인증된 사용자의 본인 데이터 수정(UPDATE) 정책
  CREATE POLICY "Allow authenticated users to update their own data"
    ON public.<table_name>
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- 인증된 사용자의 본인 데이터 삭제(DELETE) 정책
  CREATE POLICY "Allow authenticated users to delete their own data"
    ON public.<table_name>
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  ```
- 전체 허용(ALL) 정책 축약 예시 (단일 정책 적용 시):
  ```sql
  CREATE POLICY "Allow authenticated users full access to own data"
    ON public.<table_name>
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  ```

---

### 3. 표준 테이블 생성 템플릿 예시
테이블 생성 SQL 작성 시 아래 구조를 기본 표준으로 따릅니다.

```sql
-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. PostgREST 접근을 위한 역할 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.example_table TO anon, authenticated;

-- 3. RLS 활성화
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- 4. 인증된 유저 전용 RLS 정책 적용
CREATE POLICY "Authenticated users can access their own records"
  ON public.example_table
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
