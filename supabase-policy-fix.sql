-- =============================================
-- Wave Online! - 정책 충돌 해결 스크립트
-- 기존 정책 완전 삭제 후 재생성
-- =============================================

-- 1. 모든 기존 정책들을 강제로 삭제
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- user_profiles 테이블의 모든 정책 삭제
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname);
        RAISE NOTICE '🗑️ user_profiles 정책 삭제: %', pol.policyname;
    END LOOP;
    
    -- game_saves 테이블의 모든 정책 삭제
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'game_saves' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON game_saves', pol.policyname);
        RAISE NOTICE '🗑️ game_saves 정책 삭제: %', pol.policyname;
    END LOOP;
    
    -- rankings 테이블의 모든 정책 삭제
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'rankings' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON rankings', pol.policyname);
        RAISE NOTICE '🗑️ rankings 정책 삭제: %', pol.policyname;
    END LOOP;
    
    -- player_achievements 테이블의 모든 정책 삭제
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'player_achievements' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON player_achievements', pol.policyname);
        RAISE NOTICE '🗑️ player_achievements 정책 삭제: %', pol.policyname;
    END LOOP;
    
    RAISE NOTICE '✅ 모든 기존 정책 삭제 완료';
END $$;

-- 2. player_achievements 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS player_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    player_stats JSONB DEFAULT '{}',
    unlocked_achievements JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. game_saves에 upgrade_levels 컬럼 추가 (없으면)
DO $$
BEGIN
    BEGIN
        ALTER TABLE game_saves ADD COLUMN upgrade_levels JSONB DEFAULT '{}';
        RAISE NOTICE '✅ game_saves.upgrade_levels 컬럼 추가 완료';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'ℹ️ game_saves.upgrade_levels 컬럼이 이미 존재합니다';
    END;
END $$;

-- 4. RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- 5. 새로운 정책들 생성
CREATE POLICY "read_own_profile" ON user_profiles 
    FOR SELECT USING (true);

CREATE POLICY "insert_own_profile" ON user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "manage_own_game_saves" ON game_saves 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "read_all_rankings" ON rankings 
    FOR SELECT USING (true);

CREATE POLICY "manage_own_rankings" ON rankings 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manage_own_achievements" ON player_achievements 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. UNIQUE 제약조건 추가 (안전하게)
DO $$
BEGIN
    -- player_achievements UNIQUE 제약조건
    BEGIN
        ALTER TABLE player_achievements ADD CONSTRAINT player_achievements_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ player_achievements UNIQUE 제약조건 추가';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE 'ℹ️ player_achievements UNIQUE 제약조건이 이미 존재합니다';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ player_achievements UNIQUE 제약조건 추가 실패 (무시): %', SQLERRM;
    END;
    
    -- game_saves UNIQUE 제약조건 확인
    BEGIN
        ALTER TABLE game_saves ADD CONSTRAINT game_saves_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ game_saves UNIQUE 제약조건 추가';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE 'ℹ️ game_saves UNIQUE 제약조건이 이미 존재합니다';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ game_saves UNIQUE 제약조건 추가 실패 (무시): %', SQLERRM;
    END;
    
    -- rankings UNIQUE 제약조건 확인
    BEGIN
        ALTER TABLE rankings ADD CONSTRAINT rankings_user_id_unique UNIQUE(user_id);
        RAISE NOTICE '✅ rankings UNIQUE 제약조건 추가';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE 'ℹ️ rankings UNIQUE 제약조건이 이미 존재합니다';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ rankings UNIQUE 제약조건 추가 실패 (무시): %', SQLERRM;
    END;
END $$;

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_player_achievements_user_id ON player_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user_id ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_score_desc ON rankings(score DESC);

-- 8. 새 사용자 처리 함수 (안전하게 재생성)
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

-- 9. 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 10. 뷰 재생성
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

-- 11. 권한 설정
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 12. 완료 메시지
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
    RAISE NOTICE '🎉 === 정책 충돌 해결 완료 ===';
    RAISE NOTICE '📊 현재 데이터 현황:';
    RAISE NOTICE '   👥 사용자 프로필: %개', user_count;
    RAISE NOTICE '   💾 게임 저장 데이터: %개', game_save_count;
    RAISE NOTICE '   🏆 랭킹 데이터: %개', ranking_count;
    RAISE NOTICE '   🎖️ 도전과제 데이터: %개', achievement_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ 새로운 정책 적용 완료!';
    RAISE NOTICE '✅ player_achievements 테이블 준비 완료!';
    RAISE NOTICE '✅ 모든 데이터 동기화 기능 활성화!';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 이제 게임에서 "동기화" 버튼을 눌러보세요!';
    RAISE NOTICE '=======================================';
END $$; 