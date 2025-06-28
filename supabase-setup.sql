-- =============================================
-- Supabase 데이터베이스 스키마 설정
-- wave-ver2.0 게임용 데이터베이스 구조
-- =============================================

-- 1. 사용자 프로필 테이블
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 게임 저장 데이터 테이블
CREATE TABLE game_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    coins INTEGER DEFAULT 0,
    total_monsters_avoided INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    unlocked_skills JSONB DEFAULT '{"h": true, "j": false, "k": false, "l": false}'::jsonb,
    skill_levels JSONB DEFAULT '{"h": 1, "j": 1, "k": 1, "l": 1}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. 랭킹 테이블
CREATE TABLE rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성 (성능 최적화)
-- =============================================

-- 랭킹 테이블 인덱스 (점수 기준 정렬)
CREATE INDEX idx_rankings_score ON rankings(score DESC, achieved_at ASC);

-- 사용자별 랭킹 조회 인덱스
CREATE INDEX idx_rankings_user ON rankings(user_id, score DESC);

-- 게임 저장 데이터 조회 인덱스
CREATE INDEX idx_game_saves_user ON game_saves(user_id);

-- =============================================
-- RLS (Row Level Security) 정책 설정
-- =============================================

-- 모든 테이블에서 RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 사용자 프로필 정책
CREATE POLICY "Users can view own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 게임 저장 데이터 정책
CREATE POLICY "Users can view own game data" ON game_saves 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own game data" ON game_saves 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game data" ON game_saves 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 랭킹 정책 (읽기는 모든 사용자, 쓰기는 본인만)
CREATE POLICY "Anyone can view rankings" ON rankings 
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own rankings" ON rankings 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 트리거 함수 (자동 타임스탬프 업데이트)
-- =============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_saves_updated_at 
    BEFORE UPDATE ON game_saves 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 초기 데이터 삽입 함수
-- =============================================

-- 사용자 등록 시 자동으로 프로필과 게임 데이터 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 사용자 프로필 생성
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- 게임 저장 데이터 초기화
    INSERT INTO public.game_saves (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 생성 시 자동 실행되는 트리거
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 유용한 뷰 생성
-- =============================================

-- 사용자별 최고 점수 뷰
CREATE VIEW user_best_scores AS
SELECT 
    user_id,
    user_name,
    user_email,
    MAX(score) as best_score,
    MIN(achieved_at) as first_achieved_at
FROM rankings
GROUP BY user_id, user_name, user_email;

-- 전체 랭킹 뷰 (중복 제거된 최고 점수만)
CREATE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY best_score DESC, first_achieved_at ASC) as rank,
    user_name,
    user_email,
    best_score,
    first_achieved_at
FROM user_best_scores
ORDER BY best_score DESC, first_achieved_at ASC
LIMIT 100; 