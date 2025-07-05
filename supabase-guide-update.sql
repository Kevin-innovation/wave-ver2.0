-- Wave Ver 2.0 - 해금된 가이드 동기화 추가
-- 이 스크립트를 Supabase SQL 에디터에서 실행하세요

-- 해금된 가이드 테이블 생성
CREATE TABLE IF NOT EXISTS unlocked_guides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    unlocked_guide_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 사용자당 하나의 가이드 데이터만 허용
    UNIQUE(user_id)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE unlocked_guides ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
DROP POLICY IF EXISTS "Users can manage their own guides" ON unlocked_guides;
CREATE POLICY "Users can manage their own guides" ON unlocked_guides
    FOR ALL USING (auth.uid() = user_id);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_unlocked_guides_user_id ON unlocked_guides(user_id);

-- 완료 메시지
DO $$ 
BEGIN 
    RAISE NOTICE '해금된 가이드 동기화 테이블이 생성되었습니다!';
    RAISE NOTICE '- unlocked_guides: 사용자별 해금된 업적 가이드 저장';
    RAISE NOTICE 'RLS 정책이 적용되어 사용자별 데이터 보안이 확보되었습니다.';
END $$; 