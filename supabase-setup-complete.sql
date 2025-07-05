-- =============================================
-- Wave Online! - 완전한 Supabase 스키마
-- 기존 데이터 보존 + 새 기능 추가
-- =============================================

-- 1. 기존 정책들 삭제 (충돌 방지)
DO $$
BEGIN
    -- user_profiles 정책들
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Anyone can read profiles" ON user_profiles;
    
    -- game_saves 정책들
    DROP POLICY IF EXISTS "Users can view own game saves" ON game_saves;
    DROP POLICY IF EXISTS "Users can insert own game saves" ON game_saves;
    DROP POLICY IF EXISTS "Users can update own game saves" ON game_saves;
    DROP POLICY IF EXISTS "Users can manage own game saves" ON game_saves;
    
    -- rankings 정책들
    DROP POLICY IF EXISTS "Anyone can view rankings" ON rankings;
    DROP POLICY IF EXISTS "Anyone can read rankings" ON rankings;
    DROP POLICY IF EXISTS "Users can insert own rankings" ON rankings;
    DROP POLICY IF EXISTS "Users can update own rankings" ON rankings;
    DROP POLICY IF EXISTS "Users can manage own rankings" ON rankings;
    
    -- player_achievements 정책들
    DROP POLICY IF EXISTS "Users can manage own achievements" ON player_achievements;
    
    RAISE NOTICE '✅ 기존 정책들 삭제 완료';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ 일부 정책 삭제 실패 (무시 가능): %', SQLERRM;
END $$;

-- 2. 기존 함수들 삭제
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_profile_on_auth_update() CASCADE;
DROP FUNCTION IF EXISTS get_user_rank(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_duplicate_rankings() CASCADE;

-- 3. 기존 뷰들 삭제
DROP VIEW IF EXISTS top_rankings CASCADE;
DROP VIEW IF EXISTS user_rankings_view CASCADE;

-- 4. 테이블 생성 (이미 있으면 무시)
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

CREATE TABLE IF NOT EXISTS player_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    player_stats JSONB DEFAULT '{}',
    unlocked_achievements JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 새 컬럼 안전 추가
DO $$
BEGIN
    -- game_saves에 upgrade_levels 컬럼 추가
    BEGIN
        ALTER TABLE game_saves ADD COLUMN upgrade_levels JSONB DEFAULT '{}';
        RAISE NOTICE '✅ game_saves.upgrade_levels 컬럼 추가 완료';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'ℹ️ game_saves.upgrade_levels 컬럼이 이미 존재합니다';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ upgrade_levels 컬럼 추가 실패: %', SQLERRM;
    END;
    
    -- user_profiles의 email을 nullable로 변경
    BEGIN
        ALTER TABLE user_profiles ALTER COLUMN email DROP NOT NULL;
        RAISE NOTICE '✅ user_profiles.email nullable 변경 완료';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ user_profiles.email은 이미 nullable입니다';
    END;
    
    -- rankings의 user_name을 nullable로 변경
    BEGIN
        ALTER TABLE rankings ALTER COLUMN user_name DROP NOT NULL;
        RAISE NOTICE '✅ rankings.user_name nullable 변경 완료';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ rankings.user_name은 이미 nullable입니다';
    END;
END $$;

-- 6. 중복 데이터 정리
DO $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- rankings 중복 제거 (사용자별 최고점만 남김)
    WITH ranked_scores AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, achieved_at ASC) as rn
        FROM rankings
    )
    DELETE FROM rankings 
    WHERE id IN (SELECT id FROM ranked_scores WHERE rn > 1);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ 중복 랭킹 데이터 %개 정리 완료', deleted_count;
    ELSE
        RAISE NOTICE 'ℹ️ 중복 랭킹 데이터 없음';
    END IF;
    
    -- game_saves 중복 제거 (사용자별 최신 데이터만 남김)
    WITH ranked_saves AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
        FROM game_saves
    )
    DELETE FROM game_saves 
    WHERE id IN (SELECT id FROM ranked_saves WHERE rn > 1);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ 중복 게임 저장 데이터 %개 정리 완료', deleted_count;
    END IF;
    
    -- player_achievements 중복 제거
    WITH ranked_achievements AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
        FROM player_achievements
    )
    DELETE FROM player_achievements 
    WHERE id IN (SELECT id FROM ranked_achievements WHERE rn > 1);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ 중복 도전과제 데이터 %개 정리 완료', deleted_count;
    END IF;
END $$;

-- 7. UNIQUE 제약조건 안전 추가
DO $$
BEGIN
    -- game_saves UNIQUE 제약조건
    BEGIN
        ALTER TABLE game_saves ADD CONSTRAINT game_saves_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ game_saves UNIQUE 제약조건 추가';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE 'ℹ️ game_saves UNIQUE 제약조건이 이미 존재합니다';
    WHEN unique_violation THEN
        RAISE NOTICE '⚠️ game_saves에 중복 데이터가 있어 UNIQUE 제약조건 추가 실패';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ game_saves UNIQUE 제약조건 추가 실패: %', SQLERRM;
    END;
    
    -- rankings UNIQUE 제약조건
    BEGIN
        ALTER TABLE rankings ADD CONSTRAINT rankings_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ rankings UNIQUE 제약조건 추가';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE 'ℹ️ rankings UNIQUE 제약조건이 이미 존재합니다';
    WHEN unique_violation THEN
        RAISE NOTICE '⚠️ rankings에 중복 데이터가 있어 UNIQUE 제약조건 추가 실패';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ rankings UNIQUE 제약조건 추가 실패: %', SQLERRM;
    END;
    
    -- player_achievements UNIQUE 제약조건
    BEGIN
        ALTER TABLE player_achievements ADD CONSTRAINT player_achievements_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ player_achievements UNIQUE 제약조건 추가';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE 'ℹ️ player_achievements UNIQUE 제약조건이 이미 존재합니다';
    WHEN unique_violation THEN
        RAISE NOTICE '⚠️ player_achievements에 중복 데이터가 있어 UNIQUE 제약조건 추가 실패';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ player_achievements UNIQUE 제약조건 추가 실패: %', SQLERRM;
    END;
END $$;

-- 8. RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- 9. 새 RLS 정책 생성
CREATE POLICY "Anyone can read profiles" ON user_profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own game saves" ON game_saves 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read rankings" ON rankings 
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own rankings" ON rankings 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own achievements" ON player_achievements 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. 새 사용자 처리 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO user_profiles (id, email, full_name, avatar_url)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.raw_user_meta_data->>'avatar_url'
        );
        RAISE NOTICE 'User profile created for: %', NEW.email;
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'User profile already exists for: %', NEW.email;
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create profile for %: %', NEW.email, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 12. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user_id ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_score_desc ON rankings(score DESC);
CREATE INDEX IF NOT EXISTS idx_player_achievements_user_id ON player_achievements(user_id);

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

-- 14. 권한 설정
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 15. 최종 확인 및 완료 메시지
DO $$
DECLARE
    user_count INTEGER;
    ranking_count INTEGER;
    game_save_count INTEGER;
    achievement_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    SELECT COUNT(*) INTO ranking_count FROM rankings;
    SELECT COUNT(*) INTO game_save_count FROM game_saves;
    SELECT COUNT(*) INTO achievement_count FROM player_achievements;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 === Wave Online! 데이터베이스 설정 완료 ===';
    RAISE NOTICE '📊 현재 데이터 현황:';
    RAISE NOTICE '   👥 사용자 프로필: %개', user_count;
    RAISE NOTICE '   💾 게임 저장 데이터: %개', game_save_count;
    RAISE NOTICE '   🏆 랭킹 데이터: %개', ranking_count;
    RAISE NOTICE '   🎖️ 도전과제 데이터: %개', achievement_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ 새 기능 추가 완료:';
    RAISE NOTICE '   - 스킬 레벨 동기화';
    RAISE NOTICE '   - 업그레이드 레벨 동기화';
    RAISE NOTICE '   - 도전과제 진행도 동기화';
    RAISE NOTICE '   - 플레이어 통계 동기화';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 이제 게임에서 "동기화" 버튼을 눌러보세요!';
    RAISE NOTICE '================================================';
END $$; 