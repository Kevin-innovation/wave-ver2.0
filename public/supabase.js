/**
 * Supabase 클라이언트 설정 및 인증 시스템
 */

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Supabase 설정 (새로운 프로젝트 정보로 업데이트 필요!)
export const SUPABASE_URL = 'https://lcsqkovxzytarfosrxob.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjc3Frb3Z4enl0YXJmb3NyeG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2Njk2ODEsImV4cCI6MjA2NzI0NTY4MX0.n0ouKA7dv04wwKsnlV_7WTyl4qV0M6LsIwQarCwkJzs';

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 디버깅: 전역 변수로 노출
window.supabase = supabase;
console.log('🔧 Supabase 클라이언트 초기화 완료:', SUPABASE_URL);

// 현재 사용자 상태
export let currentUser = null;

/**
 * Google OAuth 로그인
 */
export async function signInWithGoogle() {
    try {
        const redirectUrl = window.location.origin + '/';
        console.log('🚀 Google 로그인 시도...');
        console.log('🔗 리다이렉트 URL:', redirectUrl);
        console.log('🌐 현재 도메인:', window.location.hostname);
        
        // 기존 세션 확인
        const existingSession = await supabase.auth.getSession();
        console.log('🔍 기존 세션 상태:', existingSession.data.session ? '있음' : '없음');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account', // 계정 선택 강제
                    include_granted_scopes: 'true'
                }
            }
        });

        if (error) {
            console.error('❌ Google 로그인 실패:', error);
            console.error('❌ 에러 코드:', error.status);
            console.error('❌ 에러 메시지:', error.message);
            
            // 에러 타입별 처리
            if (error.message.includes('redirect_uri_mismatch')) {
                console.error('🔗 리다이렉트 URI 불일치 오류');
                alert('리다이렉트 URL 설정 오류입니다. 관리자에게 문의하세요.');
            } else if (error.message.includes('unauthorized_client')) {
                console.error('🔐 클라이언트 인증 오류');
                alert('OAuth 클라이언트 설정 오류입니다. 관리자에게 문의하세요.');
            } else {
                alert('로그인에 실패했습니다: ' + error.message);
            }
            
            return { success: false, error: error.message };
        }

        console.log('✅ Google 로그인 요청 성공');
        console.log('📊 응답 데이터:', data);
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Google 로그인 오류:', error);
        console.error('❌ 스택 트레이스:', error.stack);
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
                upgrade_levels: gameData.upgradeLevels || {},
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
            skillLevels: data.skill_levels || {},
            upgradeLevels: data.upgrade_levels || {}
        };
        
    } catch (error) {
        console.error('❌ 게임 데이터 불러오기 오류:', error);
        return null;
    }
}

/**
 * 랭킹 데이터 추가 (기존 기록보다 높은 점수만 저장)
 * @param {number} score - 달성한 웨이브 점수
 */
export async function addScoreToRanking(score) {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 랭킹에 등록되지 않습니다.');
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        // 1. 기존 최고 기록 확인
        const { data: existingRecord, error: checkError } = await supabase
            .from('rankings')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('score', { ascending: false })
            .limit(1);
            
        if (checkError) {
            console.error('❌ 기존 기록 확인 실패:', checkError);
            return { success: false, error: checkError.message };
        }
        
        // 2. 기존 기록이 있는 경우
        if (existingRecord && existingRecord.length > 0) {
            const currentBest = existingRecord[0];
            
            if (score <= currentBest.score) {
                console.log(`ℹ️ 기존 최고 기록(${currentBest.score}웨이브)보다 낮아 랭킹에 등록하지 않습니다.`);
                return { success: false, error: 'Score not high enough' };
            }
            
            // 기존 기록 업데이트
            const { data: updateData, error: updateError } = await supabase
                .from('rankings')
                .update({
                    score: score,
                    achieved_at: new Date().toISOString()
                })
                .eq('id', currentBest.id);
                
            if (updateError) {
                console.error('❌ 랭킹 업데이트 실패:', updateError);
                return { success: false, error: updateError.message };
            }
            
            console.log(`✅ 랭킹 업데이트 성공: ${currentBest.score}웨이브 → ${score}웨이브`);
            return { success: true, data: updateData, updated: true };
        }
        
        // 3. 첫 번째 기록인 경우 새로 추가
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
        
        console.log('✅ 첫 랭킹 등록 성공:', score, '웨이브');
        return { success: true, data, inserted: true };
        
    } catch (error) {
        console.error('❌ 랭킹 등록 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 랭킹 보드 데이터 가져오기 (사용자별 최고점만)
 * @param {number} limit - 가져올 순위 수 (기본값: 100)
 */
export async function getRankings(limit = 100) {
    try {
        // 모든 랭킹 데이터를 가져온 후 클라이언트에서 중복 제거
        const { data, error } = await supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .order('achieved_at', { ascending: true }); // 같은 점수면 먼저 달성한 사람이 위
            
        if (error) {
            console.error('❌ 랭킹 조회 실패:', error);
            return [];
        }
        
        // 사용자별 최고점만 추출
        const userBestScores = new Map();
        
        data.forEach(record => {
            const userId = record.user_id;
            const existingRecord = userBestScores.get(userId);
            
            if (!existingRecord || record.score > existingRecord.score) {
                userBestScores.set(userId, record);
            } else if (record.score === existingRecord.score && 
                       new Date(record.achieved_at) < new Date(existingRecord.achieved_at)) {
                // 같은 점수면 먼저 달성한 기록 선택
                userBestScores.set(userId, record);
            }
        });
        
        // Map을 배열로 변환하고 점수순으로 정렬
        const uniqueRankings = Array.from(userBestScores.values())
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score; // 점수 내림차순
                }
                return new Date(a.achieved_at) - new Date(b.achieved_at); // 같은 점수면 먼저 달성한 순
            })
            .slice(0, limit); // 상위 limit개만 선택
        
        console.log(`✅ 랭킹 조회 성공: ${data.length}개 기록 → ${uniqueRankings.length}개 고유 사용자`);
        return uniqueRankings;
        
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
            .order('achieved_at', { ascending: true }) // 같은 점수면 먼저 달성한 기록
            .limit(1);
            
        if (error) {
            console.error('❌ 개인 최고 기록 조회 실패:', error);
            return null;
        }
        
        if (!data || data.length === 0) {
            console.log('ℹ️ 개인 랭킹 기록이 없습니다.');
            return null;
        }
        
        return data[0]; // 첫 번째(최고) 기록 반환
        
    } catch (error) {
        console.error('❌ 개인 최고 기록 조회 오류:', error);
        return null;
    }
}

/**
 * 기존 중복 랭킹 데이터 정리 (개발자용 유틸리티)
 * 각 사용자의 최고 점수만 남기고 나머지 삭제
 */
export async function cleanupDuplicateRankings() {
    if (!currentUser) {
        console.log('ℹ️ 관리자 권한이 필요합니다.');
        return { success: false, error: 'Admin access required' };
    }
    
    try {
        console.log('🧹 중복 랭킹 데이터 정리 시작...');
        
        // 모든 랭킹 데이터 가져오기
        const { data: allRankings, error } = await supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false });
            
        if (error) {
            console.error('❌ 랭킹 데이터 조회 실패:', error);
            return { success: false, error: error.message };
        }
        
        // 사용자별 최고 기록만 추출
        const userBestRecords = new Map();
        const recordsToDelete = [];
        
        allRankings.forEach(record => {
            const userId = record.user_id;
            const existing = userBestRecords.get(userId);
            
            if (!existing) {
                userBestRecords.set(userId, record);
            } else {
                // 더 높은 점수가 있으면 기존 것을 삭제 목록에 추가
                if (record.score > existing.score) {
                    recordsToDelete.push(existing.id);
                    userBestRecords.set(userId, record);
                } else {
                    // 현재 기록이 더 낮으면 삭제 목록에 추가
                    recordsToDelete.push(record.id);
                }
            }
        });
        
        // 중복 기록 삭제
        if (recordsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('rankings')
                .delete()
                .in('id', recordsToDelete);
                
            if (deleteError) {
                console.error('❌ 중복 기록 삭제 실패:', deleteError);
                return { success: false, error: deleteError.message };
            }
            
            console.log(`✅ 중복 랭킹 정리 완료: ${recordsToDelete.length}개 중복 기록 삭제`);
            console.log(`📊 정리 결과: ${allRankings.length}개 → ${userBestRecords.size}개 고유 사용자`);
        } else {
            console.log('ℹ️ 중복 기록이 없습니다.');
        }
        
        return { 
            success: true, 
            deleted: recordsToDelete.length,
            remaining: userBestRecords.size 
        };
        
    } catch (error) {
        console.error('❌ 중복 랭킹 정리 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 도전과제 데이터 클라우드 저장
 * @param {Object} playerStats - 플레이어 통계 데이터
 * @param {Array} unlockedAchievements - 달성한 도전과제 목록
 */
export async function saveAchievementsToSupabase(playerStats, unlockedAchievements) {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 로컬에만 저장됩니다.');
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        const { data, error } = await supabase
            .from('player_achievements')
            .upsert({
                user_id: currentUser.id,
                player_stats: playerStats,
                unlocked_achievements: unlockedAchievements,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id',
                returning: 'minimal'
            });
            
        if (error) {
            console.error('❌ 도전과제 데이터 저장 실패:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ 도전과제 데이터 클라우드 저장 성공');
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ 도전과제 데이터 저장 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 도전과제 데이터 클라우드에서 불러오기
 */
export async function loadAchievementsFromSupabase() {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 로컬 데이터를 사용합니다.');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('player_achievements')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                console.log('ℹ️ 클라우드에 저장된 도전과제 데이터가 없습니다.');
                return null;
            }
            console.error('❌ 도전과제 데이터 불러오기 실패:', error);
            return null;
        }
        
        console.log('✅ 도전과제 데이터 클라우드에서 불러오기 성공');
        return {
            playerStats: data.player_stats || {},
            unlockedAchievements: data.unlocked_achievements || []
        };
        
    } catch (error) {
        console.error('❌ 도전과제 데이터 불러오기 오류:', error);
        return null;
    }
}

/**
 * 해금된 가이드 데이터 클라우드 저장
 * @param {Array} unlockedGuideIds - 해금된 가이드 ID 배열
 */
export async function saveGuidesToSupabase(unlockedGuideIds) {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 로컬에만 저장됩니다.');
        return { success: false, error: 'Not authenticated' };
    }
    
    try {
        const { data, error } = await supabase
            .from('unlocked_guides')
            .upsert({
                user_id: currentUser.id,
                unlocked_guide_ids: unlockedGuideIds,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id',
                returning: 'minimal'
            });
            
        if (error) {
            console.error('❌ 해금된 가이드 데이터 저장 실패:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ 해금된 가이드 데이터 클라우드 저장 성공');
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ 해금된 가이드 데이터 저장 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 해금된 가이드 데이터 클라우드에서 불러오기
 */
export async function loadGuidesFromSupabase() {
    if (!currentUser) {
        console.log('ℹ️ 로그인하지 않아 로컬 데이터를 사용합니다.');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('unlocked_guides')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                console.log('ℹ️ 클라우드에 저장된 가이드 데이터가 없습니다.');
                return [];
            }
            console.error('❌ 해금된 가이드 데이터 불러오기 실패:', error);
            return null;
        }
        
        console.log('✅ 해금된 가이드 데이터 클라우드에서 불러오기 성공');
        return data.unlocked_guide_ids || [];
        
    } catch (error) {
        console.error('❌ 해금된 가이드 데이터 불러오기 오류:', error);
        return null;
    }
} 