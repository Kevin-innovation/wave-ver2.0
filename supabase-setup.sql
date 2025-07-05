-- =============================================
-- Supabase 데이터베이스 스키마 설정
-- wave online! 게임용 데이터베이스 구조
-- =============================================

-- ==========================================
-- Wave Ver 2.0 - Supabase 데이터베이스 안전 업데이트
-- ==========================================

-- 1. 기존 정책 안전 삭제
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
DROP POLICY IF EXISTS "Users can manage own achievements" ON player_achievements;

-- 2. 기존 함수 삭제
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_profile_on_auth_update() CASCADE;

-- 3. 기존 뷰 삭제
DROP VIEW IF EXISTS top_rankings CASCADE;
DROP VIEW IF EXISTS user_rankings_view CASCADE;

-- 4. 테이블 생성
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
    upgrade_levels JSONB DEFAULT '{}',
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

CREATE TABLE IF NOT EXISTS unlocked_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    unlocked_guide_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 중복 데이터 정리
DO $$
DECLARE
    deleted_count INTEGER := 0;
    duplicate_count INTEGER := 0;
BEGIN
    -- rankings 중복 정리
    SELECT COUNT(*) - COUNT(DISTINCT user_id) INTO duplicate_count FROM rankings;
    IF duplicate_count > 0 THEN
        WITH ranked_scores AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, achieved_at ASC) as rn
            FROM rankings
        )
        DELETE FROM rankings WHERE id IN (SELECT id FROM ranked_scores WHERE rn > 1);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ 중복 랭킹 데이터 %개 정리', deleted_count;
    END IF;
    
    -- game_saves 중복 정리
    WITH ranked_saves AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM game_saves
    )
    DELETE FROM game_saves WHERE id IN (SELECT id FROM ranked_saves WHERE rn > 1);
    
    -- player_achievements 중복 정리
    WITH ranked_achievements AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
        FROM player_achievements
    )
    DELETE FROM player_achievements WHERE id IN (SELECT id FROM ranked_achievements WHERE rn > 1);
END $$;

-- 6. UNIQUE 제약조건 추가
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- game_saves UNIQUE 제약조건
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'game_saves' AND constraint_name = 'game_saves_user_id_unique'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        ALTER TABLE game_saves ADD CONSTRAINT game_saves_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ game_saves UNIQUE 제약조건 추가';
    END IF;
    
    -- rankings UNIQUE 제약조건
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'rankings' AND constraint_name = 'rankings_user_id_unique'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        ALTER TABLE rankings ADD CONSTRAINT rankings_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ rankings UNIQUE 제약조건 추가';
    END IF;
    
    -- player_achievements UNIQUE 제약조건
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'player_achievements' AND constraint_name = 'player_achievements_user_id_unique'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        ALTER TABLE player_achievements ADD CONSTRAINT player_achievements_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ player_achievements UNIQUE 제약조건 추가';
    END IF;
END $$;

-- 7. RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_guides ENABLE ROW LEVEL SECURITY;

-- 8. RLS 정책 생성
CREATE POLICY "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own game saves" ON game_saves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read rankings" ON rankings FOR SELECT USING (true);
CREATE POLICY "Users can manage own rankings" ON rankings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own achievements" ON player_achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own guides" ON unlocked_guides FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. 새 사용자 처리 함수
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
            RAISE WARNING 'Failed to create profile for %: %', NEW.email, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 11. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user_id ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_score_desc ON rankings(score DESC);
CREATE INDEX IF NOT EXISTS idx_player_achievements_user_id ON player_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_guides_user_id ON unlocked_guides(user_id);

-- 12. 뷰 생성
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

-- 13. 권한 설정
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 14. 완료 메시지
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
    
    RAISE NOTICE '=== Wave Online! 데이터베이스 설정 완료 ===';
    RAISE NOTICE '✅ 사용자 프로필: %개', user_count;
    RAISE NOTICE '✅ 게임 저장: %개', game_save_count;
    RAISE NOTICE '✅ 랭킹: %개', ranking_count;
    RAISE NOTICE '✅ 도전과제: %개', achievement_count;
    RAISE NOTICE '==========================================';
END $$; 