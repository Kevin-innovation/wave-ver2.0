/**
 * 인증 UI 및 사용자 상태 관리
 */

import { 
    signInWithGoogle, 
    signOut, 
    getCurrentUser, 
    onAuthStateChange,
    currentUser,
    saveGameDataToSupabase,
    loadGameDataFromSupabase,
    supabase,
    SUPABASE_URL
} from './supabase.js';
import { gameData, saveGameData, loadGameData } from './economy.js';

// UI 요소들
let authContainer = null;
let userInfoContainer = null;

/**
 * 인증 UI 초기화
 */
export function initAuthUI() {
    createAuthElements();
    setupAuthEventListeners();
    
    // 초기 사용자 상태 확인
    checkInitialAuthState();
    
    // 인증 상태 변화 감지
    onAuthStateChange(handleAuthStateChange);
}

/**
 * 인증 관련 DOM 요소들 생성
 */
function createAuthElements() {
    // 인증 컨테이너 생성 (화면 하단 고정)
    authContainer = document.createElement('div');
    authContainer.id = 'auth-container';
    authContainer.className = 'auth-container-bottom';
    authContainer.innerHTML = `
        <div class="auth-section-bottom">
            <div id="login-section" class="login-section-bottom">
                <button id="google-login-btn" class="google-login-btn-bottom">
                    <span class="google-icon">🔐</span>
                    Google 로그인하여 랭킹 참여하기
                </button>
            </div>
            
            <div id="user-info-section" class="user-info-section-bottom" style="display: none;">
                <div class="user-info-bottom">
                    <span id="user-name">사용자명</span>
                    <button id="sync-data-btn" class="sync-btn-bottom">
                        🔄 동기화
                    </button>
                    <button id="logout-btn" class="logout-btn-bottom">
                        🚪 로그아웃
                    </button>
                </div>
                <div class="sync-status-bottom" id="sync-status">
                    💾 로컬 저장됨
                </div>
            </div>
        </div>
    `;
    
    // 게임 컨테이너에 추가
    const gameContainer = document.querySelector('.game-container');
    gameContainer.appendChild(authContainer);
}

/**
 * 인증 이벤트 리스너 설정
 */
function setupAuthEventListeners() {
    // Google 로그인 버튼
    document.getElementById('google-login-btn')?.addEventListener('click', handleGoogleLogin);
    
    // 로그아웃 버튼
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // 동기화 버튼
    document.getElementById('sync-data-btn')?.addEventListener('click', handleSyncData);
}

/**
 * Google 로그인 처리
 */
async function handleGoogleLogin() {
    const button = document.getElementById('google-login-btn');
    if (!button) return;
    
    button.disabled = true;
    button.textContent = '🔄 로그인 중...';
    
    try {
        const result = await signInWithGoogle();
        
        if (result.success) {
            console.log('✅ Google 로그인 성공');
            // 페이지 리로드 대기 (OAuth 리다이렉트)
        } else {
            console.error('❌ Google 로그인 실패:', result.error);
            alert('로그인에 실패했습니다: ' + result.error);
        }
    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        alert('로그인 중 오류가 발생했습니다.');
    } finally {
        button.disabled = false;
        button.innerHTML = `
            <span class="google-icon">📧</span>
            Google로 로그인하여 랭킹 참여하기
        `;
    }
}

/**
 * 로그아웃 처리
 */
async function handleLogout() {
    const button = document.getElementById('logout-btn');
    if (!button) return;
    
    button.disabled = true;
    button.textContent = '🔄 로그아웃 중...';
    
    try {
        const result = await signOut();
        
        if (result.success) {
            console.log('✅ 로그아웃 성공');
            updateAuthUI(false, null);
        } else {
            console.error('❌ 로그아웃 실패:', result.error);
            alert('로그아웃에 실패했습니다: ' + result.error);
        }
    } catch (error) {
        console.error('❌ 로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    } finally {
        button.disabled = false;
        button.textContent = '🚪 로그아웃';
    }
}

/**
 * 데이터 동기화 처리
 */
async function handleSyncData() {
    const button = document.getElementById('sync-data-btn');
    const statusDiv = document.getElementById('sync-status');
    if (!button || !statusDiv) return;
    
    button.disabled = true;
    button.textContent = '🔄 동기화 중...';
    statusDiv.textContent = '🔄 클라우드와 동기화 중...';
    
    try {
        // 1. 로컬 데이터 클라우드에 저장
        const saveResult = await saveGameDataToSupabase(gameData);
        
        if (saveResult.success) {
            statusDiv.textContent = '✅ 클라우드 저장 완료!';
            console.log('✅ 데이터 동기화 성공');
        } else {
            statusDiv.textContent = '❌ 동기화 실패: ' + saveResult.error;
            console.error('❌ 데이터 동기화 실패:', saveResult.error);
        }
        
        // 3초 후 상태 원복
        setTimeout(() => {
            if (statusDiv) {
                statusDiv.textContent = '☁️ 클라우드 저장됨';
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ 동기화 오류:', error);
        statusDiv.textContent = '❌ 동기화 오류 발생';
        
        setTimeout(() => {
            if (statusDiv) {
                statusDiv.textContent = '💾 로컬 저장 중...';
            }
        }, 3000);
    } finally {
        button.disabled = false;
        button.textContent = '🔄 클라우드와 동기화';
    }
}

/**
 * 초기 인증 상태 확인
 */
async function checkInitialAuthState() {
    console.log('🔍 초기 인증 상태 확인 중...');
    console.log('🌐 현재 URL:', window.location.href);
    console.log('🔗 Origin:', window.location.origin);
    console.log('📍 Pathname:', window.location.pathname);
    console.log('🔐 Hash:', window.location.hash);
    
    // URL 파라미터에서 OAuth 에러 확인 (Supabase 데이터베이스 에러 등)
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    const urlErrorCode = urlParams.get('error_code');
    const urlErrorDescription = urlParams.get('error_description');
    
    if (urlError) {
        console.error('❌ URL 파라미터 OAuth 에러:', { urlError, urlErrorCode, urlErrorDescription });
        
        let userMessage = '로그인 중 오류가 발생했습니다.';
        
        if (urlErrorDescription) {
            const decodedDescription = decodeURIComponent(urlErrorDescription.replace(/\+/g, ' '));
            
            if (decodedDescription.includes('Database error saving new user')) {
                userMessage = '새 사용자 등록 중 데이터베이스 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.';
                console.error('🗄️ Supabase 데이터베이스 에러: 새 사용자 저장 실패');
            } else if (decodedDescription.includes('permission')) {
                userMessage = '데이터베이스 권한 오류가 발생했습니다.\n관리자에게 문의해 주세요.';
            }
            
            console.error('📝 상세 에러 설명:', decodedDescription);
        }
        
        alert(userMessage);
        
        // URL에서 에러 파라미터 제거
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        return;
    }
    
    // URL 해시 확인 (OAuth 콜백 처리)
    const urlHash = window.location.hash;
    if (urlHash && urlHash.includes('access_token')) {
        console.log('🔑 OAuth 콜백 감지:', urlHash);
        
        try {
            // URL 해시에서 토큰 정보 추출
            const hashParams = new URLSearchParams(urlHash.slice(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const expiresIn = hashParams.get('expires_in');
            const tokenType = hashParams.get('token_type');
            const errorCode = hashParams.get('error');
            const errorDescription = hashParams.get('error_description');
            
            console.log('📝 토큰 정보:', { 
                accessToken: accessToken ? accessToken.slice(0, 20) + '...' : 'None', 
                refreshToken: refreshToken ? refreshToken.slice(0, 20) + '...' : 'None', 
                expiresIn,
                tokenType,
                error: errorCode,
                errorDescription
            });
            
            // 에러 체크
            if (errorCode) {
                console.error('❌ OAuth 에러 발생:', errorCode, errorDescription);
                alert(`로그인 오류: ${errorDescription || errorCode}`);
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }
            
            if (accessToken && refreshToken) {
                console.log('🔄 Supabase 세션 설정 시도...');
                
                // Supabase 세션 수동 설정
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });
                
                if (error) {
                    console.error('❌ 세션 설정 실패:', error);
                    alert(`세션 설정 실패: ${error.message}`);
                } else {
                    console.log('✅ 세션 설정 성공:', data);
                    
                    // 페이지 새로고침 방지를 위해 해시 제거
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    // UI 업데이트 및 데이터 병합
                    if (data.user) {
                        console.log('👤 사용자 정보:', data.user.email);
                        updateAuthUI(true, data.user);
                        
                        // 클라우드 데이터 로드 및 병합
                        try {
                            const cloudData = await loadGameDataFromSupabase();
                            if (cloudData) {
                                await mergeGameData(cloudData);
                            }
                        } catch (error) {
                            console.error('❌ OAuth 콜백 후 데이터 병합 실패:', error);
                        }
                    }
                    
                    return;
                }
            } else {
                console.warn('⚠️ 토큰 정보 불완전:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
            }
        } catch (error) {
            console.error('❌ OAuth 콜백 처리 오류:', error);
            alert(`콜백 처리 오류: ${error.message}`);
        }
        
        // 페이지 새로고침 방지를 위해 해시 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    // 일반적인 사용자 상태 확인
    console.log('🔄 기존 세션 확인 중...');
    const user = await getCurrentUser();
    
    if (user) {
        console.log('✅ 기존 사용자 로그인 상태:', user.email);
        updateAuthUI(true, user);
        
        // 클라우드 데이터 확인 및 로드
        try {
            const cloudData = await loadGameDataFromSupabase();
            if (cloudData) {
                await mergeGameData(cloudData);
            }
        } catch (error) {
            console.error('❌ 초기 클라우드 데이터 로드 실패:', error);
        }
    } else {
        console.log('ℹ️ 로그인되지 않은 상태');
        updateAuthUI(false, null);
    }
}

/**
 * 인증 상태 변화 처리
 */
function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN' && session) {
        updateAuthUI(true, session.user);
        
        // 로그인 직후 클라우드 데이터와 병합
        setTimeout(async () => {
            try {
                const cloudData = await loadGameDataFromSupabase();
                if (cloudData) {
                    await mergeGameData(cloudData);
                }
            } catch (error) {
                console.error('❌ 로그인 후 데이터 병합 실패:', error);
            }
        }, 1000);
        
    } else if (event === 'SIGNED_OUT') {
        updateAuthUI(false, null);
    }
}

/**
 * 인증 UI 업데이트
 */
function updateAuthUI(isLoggedIn, user) {
    const loginSection = document.getElementById('login-section');
    const userInfoSection = document.getElementById('user-info-section');
    const userNameSpan = document.getElementById('user-name');
    const userEmailSpan = document.getElementById('user-email');
    const syncStatus = document.getElementById('sync-status');
    
    if (!loginSection || !userInfoSection) return;
    
    if (isLoggedIn && user) {
        // 로그인된 상태
        loginSection.style.display = 'none';
        userInfoSection.style.display = 'block';
        
        if (userNameSpan) {
            userNameSpan.textContent = user.user_metadata?.full_name || user.email;
        }
        if (userEmailSpan) {
            userEmailSpan.textContent = user.email;
        }
        if (syncStatus) {
            syncStatus.textContent = '☁️ 클라우드 저장됨';
        }
        
    } else {
        // 로그아웃된 상태
        loginSection.style.display = 'block';
        userInfoSection.style.display = 'none';
        
        if (syncStatus) {
            syncStatus.textContent = '💾 로컬 저장 중...';
        }
    }
}

/**
 * 클라우드 데이터와 로컬 데이터 병합
 */
async function mergeGameData(cloudData) {
    const localData = { ...gameData };
    
    console.log('🔄 데이터 병합 중...');
    console.log('로컬 데이터:', localData);
    console.log('클라우드 데이터:', cloudData);
    
    // 병합 전략: 최고값 기준
    const mergedData = {
        coins: Math.max(localData.coins, cloudData.coins),
        totalMonstersAvoided: Math.max(localData.totalMonstersAvoided, cloudData.totalMonstersAvoided),
        bestScore: Math.max(localData.bestScore, cloudData.bestScore),
        unlockedSkills: { ...localData.unlockedSkills },
        skillLevels: { ...localData.skillLevels }
    };
    
    // 스킬 해제 상태 병합 (OR 연산)
    for (const skill in cloudData.unlockedSkills) {
        mergedData.unlockedSkills[skill] = 
            localData.unlockedSkills[skill] || cloudData.unlockedSkills[skill];
    }
    
    // 스킬 레벨 병합 (최고값)
    for (const skill in cloudData.skillLevels) {
        mergedData.skillLevels[skill] = Math.max(
            localData.skillLevels[skill] || 1,
            cloudData.skillLevels[skill] || 1
        );
    }
    
    // 로컬 데이터 업데이트
    Object.assign(gameData, mergedData);
    saveGameData();
    
    // 클라우드에 병합된 데이터 저장
    await saveGameDataToSupabase(mergedData);
    
    console.log('✅ 데이터 병합 완료:', mergedData);
    
    // UI 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent('gameDataUpdated', { detail: mergedData }));
}

/**
 * 현재 로그인 상태 확인
 */
export function isLoggedIn() {
    const loggedIn = currentUser !== null;
    console.log('🔧 로그인 상태 확인:', loggedIn, currentUser?.email || 'No user');
    return loggedIn;
}

/**
 * 현재 사용자 정보 반환
 */
export function getCurrentUserInfo() {
    console.log('🔧 현재 사용자 정보:', currentUser);
    return currentUser;
}

// 디버깅: 전역 변수로 노출
window.currentUser = currentUser;
window.isLoggedIn = isLoggedIn;

// 디버깅: 로그인 상태 체크 함수 추가
window.checkAuthStatus = async function() {
    console.log('🔍 === 로그인 상태 체크 ===');
    console.log('🌐 현재 URL:', window.location.href);
    console.log('🔗 Origin:', window.location.origin);
    console.log('📍 Pathname:', window.location.pathname);
    console.log('🔐 Hash:', window.location.hash);
    
    // Supabase 세션 확인
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('📊 Supabase 세션:', session ? '있음' : '없음');
    if (session) {
        console.log('👤 사용자 이메일:', session.user.email);
        console.log('🔑 토큰 만료:', new Date(session.expires_at * 1000));
    }
    if (error) {
        console.error('❌ 세션 확인 오류:', error);
    }
    
    // 현재 사용자 변수 확인
    console.log('👤 currentUser:', currentUser);
    console.log('🔧 isLoggedIn():', isLoggedIn());
    
    // 로컬 스토리지 확인
    const localKeys = ['supabase.auth.token', 'sb-' + SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token'];
    localKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`💾 LocalStorage[${key}]:`, value ? '있음' : '없음');
    });
    
    console.log('🔍 === 체크 완료 ===');
};

// 디버깅: 강제 로그아웃 함수
window.forceLogout = async function() {
    console.log('🚪 강제 로그아웃 시도...');
    
    // Supabase 로그아웃
    await supabase.auth.signOut();
    
    // 로컬 변수 초기화
    currentUser = null;
    
    // UI 업데이트
    updateAuthUI(false, null);
    
    console.log('✅ 강제 로그아웃 완료');
};

// 디버깅: 토큰 갱신 함수
window.refreshAuthToken = async function() {
    console.log('🔄 토큰 갱신 시도...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
        console.error('❌ 토큰 갱신 실패:', error);
    } else {
        console.log('✅ 토큰 갱신 성공:', data);
        if (data.user) {
            currentUser = data.user;
            updateAuthUI(true, data.user);
        }
    }
};

console.log('🛠️ 디버깅 도구 사용법:');
console.log('- window.checkAuthStatus() : 로그인 상태 확인');
console.log('- window.forceLogout() : 강제 로그아웃');
console.log('- window.refreshAuthToken() : 토큰 갱신');
console.log('- window.currentUser : 현재 사용자 정보');
console.log('- window.isLoggedIn() : 로그인 상태 확인'); 