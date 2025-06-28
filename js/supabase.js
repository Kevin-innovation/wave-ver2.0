/**
 * Supabase 클라이언트 설정 및 인증 시스템
 */

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Supabase 설정 (환경변수 또는 설정값)
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // 실제 Supabase URL로 교체 필요
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // 실제 Anon Key로 교체 필요

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 현재 사용자 상태
export let currentUser = null;

/**
 * Google OAuth 로그인
 */
export async function signInWithGoogle() {
    try {
        console.log('🚀 Google 로그인 시도...');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) {
            console.error('❌ Google 로그인 실패:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Google 로그인 요청 성공');
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Google 로그인 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 로그아웃
 */
export async function signOut() {
    try {
        console.log('🚪 로그아웃 시도...');
        
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('❌ 로그아웃 실패:', error);
            return { success: false, error: error.message };
        }
        
        currentUser = null;
        console.log('✅ 로그아웃 성공');
        return { success: true };
        
    } catch (error) {
        console.error('❌ 로그아웃 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 현재 사용자 세션 확인
 */
export async function getCurrentUser() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ 세션 확인 실패:', error);
            return null;
        }
        
        if (session) {
            currentUser = session.user;
            console.log('✅ 로그인된 사용자:', currentUser.email);
            return currentUser;
        }
        
        console.log('ℹ️ 로그인되지 않은 상태');
        return null;
        
    } catch (error) {
        console.error('❌ 사용자 확인 오류:', error);
        return null;
    }
}

/**
 * 인증 상태 변화 감지
 * @param {Function} callback - 상태 변화 시 호출될 콜백 함수
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 인증 상태 변화:', event, session?.user?.email || 'No user');
        
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
        }
        
        // 콜백 함수 호출
        if (callback) {
            callback(event, session);
        }
    });
}

/**
 * 사용자 프로필 데이터 가져오기
 * @param {string} userId - 사용자 ID
 */
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) {
            console.error('❌ 프로필 조회 실패:', error);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ 프로필 조회 오류:', error);
        return null;
    }
}

/**
 * 사용자 프로필 생성/업데이트
 * @param {Object} profileData - 프로필 데이터
 */
export async function upsertUserProfile(profileData) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert(profileData, { 
                onConflict: 'id',
                returning: 'minimal'
            });
            
        if (error) {
            console.error('❌ 프로필 업데이트 실패:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ 프로필 업데이트 성공');
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ 프로필 업데이트 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 게임 데이터 저장
 * @param {Object} gameData - 저장할 게임 데이터
 */
export async function saveGameDataToSupabase(gameData) {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 로컬에만 저장됩니다.');
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        const { data, error } = await supabase
            .from('game_saves')
            .upsert({
                user_id: currentUser.id,
                coins: gameData.coins,
                total_monsters_avoided: gameData.totalMonstersAvoided,
                best_score: gameData.bestScore,
                unlocked_skills: gameData.unlockedSkills,
                skill_levels: gameData.skillLevels || {},
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'user_id',
                returning: 'minimal'
            });
            
        if (error) {
            console.error('❌ 게임 데이터 저장 실패:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ 게임 데이터 클라우드 저장 성공');
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ 게임 데이터 저장 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 게임 데이터 불러오기
 */
export async function loadGameDataFromSupabase() {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 로컬 데이터를 사용합니다.');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('game_saves')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                console.log('ℹ️ 클라우드에 저장된 게임 데이터가 없습니다.');
                return null;
            }
            console.error('❌ 게임 데이터 불러오기 실패:', error);
            return null;
        }
        
        console.log('✅ 게임 데이터 클라우드에서 불러오기 성공');
        return {
            coins: data.coins || 0,
            totalMonstersAvoided: data.total_monsters_avoided || 0,
            bestScore: data.best_score || 0,
            unlockedSkills: data.unlocked_skills || { h: true, j: false, k: false, l: false },
            skillLevels: data.skill_levels || {}
        };
        
    } catch (error) {
        console.error('❌ 게임 데이터 불러오기 오류:', error);
        return null;
    }
}

/**
 * 랭킹 데이터 추가
 * @param {number} score - 달성한 웨이브 점수
 */
export async function addScoreToRanking(score) {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 랭킹에 등록되지 않습니다.');
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        const { data, error } = await supabase
            .from('rankings')
            .insert({
                user_id: currentUser.id,
                user_email: currentUser.email,
                user_name: currentUser.user_metadata?.full_name || currentUser.email,
                score: score,
                achieved_at: new Date().toISOString()
            });
            
        if (error) {
            console.error('❌ 랭킹 등록 실패:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ 랭킹 등록 성공:', score, '웨이브');
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ 랭킹 등록 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 랭킹 보드 데이터 가져오기
 * @param {number} limit - 가져올 순위 수 (기본값: 100)
 */
export async function getRankings(limit = 100) {
    try {
        const { data, error } = await supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .order('achieved_at', { ascending: true }) // 같은 점수면 먼저 달성한 사람이 위
            .limit(limit);
            
        if (error) {
            console.error('❌ 랭킹 조회 실패:', error);
            return [];
        }
        
        console.log('✅ 랭킹 조회 성공:', data.length, '개 기록');
        return data;
        
    } catch (error) {
        console.error('❌ 랭킹 조회 오류:', error);
        return [];
    }
}

/**
 * 개인 최고 기록 가져오기
 */
export async function getPersonalBestRanking() {
    if (!currentUser) return null;
    
    try {
        const { data, error } = await supabase
            .from('rankings')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('score', { ascending: false })
            .limit(1)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                console.log('ℹ️ 개인 랭킹 기록이 없습니다.');
                return null;
            }
            console.error('❌ 개인 최고 기록 조회 실패:', error);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ 개인 최고 기록 조회 오류:', error);
        return null;
    }
} 