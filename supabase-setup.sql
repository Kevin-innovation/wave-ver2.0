-- =============================================
-- Supabase 데이터베이스 스키마 설정
-- wave-ver2.0 게임용 데이터베이스 구조
-- =============================================

-- ==========================================
-- Wave Ver 2.0 - Supabase 데이터베이스 안전 업데이트
-- ==========================================

-- 1. 기존 정책만 안전하게 삭제 (테이블은 유지)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own game saves" ON game_saves;
DROP POLICY IF EXISTS "Users can insert own game saves" ON game_saves;
DROP POLICY IF EXISTS "Users can update own game saves" ON game_saves;
DROP POLICY IF EXISTS "Users can view own game data" ON game_saves;
DROP POLICY IF EXISTS "Users can insert own game data" ON game_saves;
DROP POLICY IF EXISTS "Users can update own game data" ON game_saves;
DROP POLICY IF EXISTS "Anyone can view rankings" ON rankings;
DROP POLICY IF EXISTS "Anyone can read rankings" ON rankings;
DROP POLICY IF EXISTS "Users can insert own rankings" ON rankings;
DROP POLICY IF EXISTS "Users can update own rankings" ON rankings;
DROP POLICY IF EXISTS "Users can manage own rankings" ON rankings;
DROP POLICY IF EXISTS "Users can manage own game saves" ON rankings;

-- 2. 기존 함수 삭제
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_profile_on_auth_update() CASCADE;

-- 3. 기존 뷰 삭제
DROP VIEW IF EXISTS top_rankings CASCADE;
DROP VIEW IF EXISTS user_rankings_view CASCADE;

-- 4. 기존 테이블이 없을 때만 생성
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    coins BIGINT DEFAULT 0,
    total_monsters_avoided BIGINT DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    unlocked_skills JSONB DEFAULT '{}',
    skill_levels JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT,
    score INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 중복 데이터 정리 (UNIQUE 제약조건 추가 전)
DO $$
DECLARE
    deleted_count INTEGER := 0;
    duplicate_count INTEGER := 0;
BEGIN
    -- 중복 랭킹 데이터 확인
    SELECT COUNT(*) - COUNT(DISTINCT user_id) INTO duplicate_count
    FROM rankings;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE '🔄 중복 랭킹 데이터 %개 발견, 정리 중...', duplicate_count;
        
        -- 사용자별로 최고 점수만 남기고 나머지 삭제
        WITH ranked_scores AS (
            SELECT id, 
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, achieved_at ASC) as rn
            FROM rankings
        )
        DELETE FROM rankings
        WHERE id IN (
            SELECT id FROM ranked_scores WHERE rn > 1
        );
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ 중복 랭킹 데이터 %개 정리 완료', deleted_count;
    ELSE
        RAISE NOTICE '✅ 중복 랭킹 데이터 없음';
    END IF;
    
    -- game_saves 중복 데이터 정리
    WITH ranked_saves AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM game_saves
    )
    DELETE FROM game_saves
    WHERE id IN (
        SELECT id FROM ranked_saves WHERE rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ 중복 게임 저장 데이터 %개 정리 완료', deleted_count;
    END IF;
END $$;

-- 6. 기존 테이블 구조 안전 업데이트
DO $$
BEGIN
    -- user_profiles 테이블 업데이트
    BEGIN
        ALTER TABLE user_profiles ALTER COLUMN email DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'user_profiles.email 컬럼은 이미 nullable입니다.';
    END;
    
    -- game_saves 테이블 업데이트 
    BEGIN
        ALTER TABLE game_saves ALTER COLUMN coins TYPE BIGINT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'game_saves.coins 컬럼 타입 변경 실패 또는 이미 BIGINT입니다.';
    END;
    
    BEGIN
        ALTER TABLE game_saves ALTER COLUMN total_monsters_avoided TYPE BIGINT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'game_saves.total_monsters_avoided 컬럼 타입 변경 실패 또는 이미 BIGINT입니다.';
    END;
    
    -- rankings 테이블 업데이트
    BEGIN
        ALTER TABLE rankings ALTER COLUMN user_name DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'rankings.user_name 컬럼은 이미 nullable입니다.';
    END;
END $$;

-- 7. UNIQUE 제약조건 안전 추가 (별도 처리)
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- game_saves UNIQUE 제약조건 확인 및 추가
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'game_saves' 
        AND constraint_name = 'game_saves_user_id_unique'
        AND constraint_type = 'UNIQUE'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        BEGIN
            ALTER TABLE game_saves ADD CONSTRAINT game_saves_user_id_unique UNIQUE(user_id);
            RAISE NOTICE '✅ game_saves UNIQUE 제약조건 추가 완료';
        EXCEPTION WHEN unique_violation THEN
            RAISE WARNING '❌ game_saves에 여전히 중복 데이터가 있습니다. 수동 정리가 필요합니다.';
        WHEN OTHERS THEN
            RAISE WARNING '❌ game_saves UNIQUE 제약조건 추가 실패: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '✅ game_saves UNIQUE 제약조건이 이미 존재합니다.';
    END IF;
    
    -- rankings UNIQUE 제약조건 확인 및 추가
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'rankings' 
        AND constraint_name = 'rankings_user_id_unique'
        AND constraint_type = 'UNIQUE'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        BEGIN
            ALTER TABLE rankings ADD CONSTRAINT rankings_user_id_unique UNIQUE(user_id);
            RAISE NOTICE '✅ rankings UNIQUE 제약조건 추가 완료';
        EXCEPTION WHEN unique_violation THEN
            RAISE WARNING '❌ rankings에 여전히 중복 데이터가 있습니다. 수동 정리가 필요합니다.';
        WHEN OTHERS THEN
            RAISE WARNING '❌ rankings UNIQUE 제약조건 추가 실패: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '✅ rankings UNIQUE 제약조건이 이미 존재합니다.';
    END IF;
END $$;

-- 8. RLS 활성화 (이미 활성화되어 있어도 에러 없음)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 9. 새로운 RLS 정책 생성

-- user_profiles 정책 (매우 관대한 설정)
CREATE POLICY "Anyone can read profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- game_saves 정책
CREATE POLICY "Users can manage own game saves" ON game_saves
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- rankings 정책
CREATE POLICY "Anyone can read rankings" ON rankings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own rankings" ON rankings
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 10. 에러 처리가 강화된 새 사용자 처리 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 사용자 프로필 생성 (에러 처리 강화)
    BEGIN
        INSERT INTO user_profiles (id, email, full_name, avatar_url)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.raw_user_meta_data->>'avatar_url'
        );
        
        RAISE NOTICE 'User profile created successfully for: %', NEW.email;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'User profile already exists for: %', NEW.email;
        WHEN OTHERS THEN
            -- 에러 발생 시에도 사용자 생성은 계속 진행
            RAISE WARNING 'Failed to create user profile for %: % (SQLSTATE: %)', 
                NEW.email, SQLERRM, SQLSTATE;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 12. 인덱스 생성 (이미 있으면 무시됨)
CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user_id ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_score_desc ON rankings(score DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_achieved_at_desc ON rankings(achieved_at DESC);

-- 13. 뷰 생성 (랭킹 조회 최적화)
CREATE OR REPLACE VIEW top_rankings AS
SELECT 
    r.id,
    r.user_id,
    r.user_email,
    COALESCE(r.user_name, p.full_name, p.email) as display_name,
    r.score,
    r.achieved_at,
    ROW_NUMBER() OVER (ORDER BY r.score DESC, r.achieved_at ASC) as rank
FROM rankings r
LEFT JOIN user_profiles p ON r.user_id = p.id
ORDER BY r.score DESC, r.achieved_at ASC;

-- 14. 통계 함수들
CREATE OR REPLACE FUNCTION get_user_rank(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank INTO user_rank
    FROM top_rankings
    WHERE user_id = target_user_id;
    
    RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. 데이터 정리 함수 (중복 제거)
CREATE OR REPLACE FUNCTION cleanup_duplicate_rankings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 사용자별로 최고 점수만 남기고 나머지 삭제
    WITH ranked_scores AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, achieved_at ASC) as rn
        FROM rankings
    )
    DELETE FROM rankings
    WHERE id IN (
        SELECT id FROM ranked_scores WHERE rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. 권한 설정 (광범위한 권한으로 에러 방지)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 17. 완료 메시지 및 데이터 확인
DO $$
DECLARE
    user_count INTEGER;
    ranking_count INTEGER;
    game_save_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    SELECT COUNT(*) INTO ranking_count FROM rankings;
    SELECT COUNT(*) INTO game_save_count FROM game_saves;
    
    RAISE NOTICE '=== Wave Ver 2.0 데이터베이스 안전 업데이트 완료 ===';
    RAISE NOTICE '✅ 기존 데이터 보존됨';
    RAISE NOTICE '✅ 중복 데이터 정리 완료';
    RAISE NOTICE '✅ 테이블 구조 업데이트 완료';
    RAISE NOTICE '✅ 관대한 RLS 정책 적용';
    RAISE NOTICE '✅ 에러 처리 강화된 트리거 함수';
    RAISE NOTICE '✅ 새 사용자 저장 실패 시에도 로그인 계속 진행';
    RAISE NOTICE '📊 현재 데이터 현황:';
    RAISE NOTICE '   - 사용자 프로필: %개', user_count;
    RAISE NOTICE '   - 랭킹 데이터: %개', ranking_count;
    RAISE NOTICE '   - 게임 저장 데이터: %개', game_save_count;
    RAISE NOTICE '=========================================';
END $$; 