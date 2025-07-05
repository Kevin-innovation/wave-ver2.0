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
    SUPABASE_URL,
    // 이메일/패스워드 인증 함수들
    signUpWithEmail,
    signInWithEmail,
    resetPasswordForEmail
} from './supabase.js';
import { 
    gameData, 
    saveGameData, 
    loadGameData, 
    initializeNewUserData,
    overwriteGameDataFromCloud 
} from './economy.js';
import { 
    initializeNewPlayerStats, 
    loadPlayerStats,
    savePlayerStats,
    playerStats,
    getUnlockedAchievements
} from './achievements.js';
import { 
    initializeNewUpgradeData, 
    loadUpgradeData,
    upgradeData
} from './upgrade.js';
import {
    getUnlockedGuides,
    refreshGuidesFromCloud
} from './shop.js';
import {
    saveGuidesToSupabase,
    loadGuidesFromSupabase
} from './supabase.js';

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
 * 사용자 알림 토스트 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 알림 타입 ('success', 'error', 'info')
 */
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.auth-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 토스트 생성
    const toast = document.createElement('div');
    toast.className = `auth-toast auth-toast-${type}`;
    toast.textContent = message;
    
    // 화면에 추가
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => toast.classList.add('show'), 100);
    
    // 3초 후 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
                <!-- 인증 방법 선택 토글 -->
                <div class="auth-toggle-bottom">
                    <button id="toggle-auth-method" class="toggle-auth-btn-bottom">
                        📧 이메일 로그인
                    </button>
                </div>
                
                <!-- Google 로그인 (기본) -->
                <div id="google-auth-section" class="google-auth-section-bottom">
                    <button id="google-login-btn" class="google-login-btn-bottom">
                        <span class="google-icon">🔐</span>
                        Google 로그인하여 랭킹 참여하기
                    </button>
                </div>
                
                <!-- 이메일 로그인 (숨김) -->
                <div id="email-auth-section" class="email-auth-section-bottom" style="display: none;">
                    <div class="email-auth-tabs-bottom">
                        <button id="login-tab" class="auth-tab-btn-bottom active">로그인</button>
                        <button id="signup-tab" class="auth-tab-btn-bottom">회원가입</button>
                    </div>
                    
                    <!-- 로그인 폼 -->
                    <div id="login-form-section" class="auth-form-section-bottom">
                        <form id="email-login-form" class="auth-form-bottom">
                            <input type="email" id="login-email" placeholder="이메일" required class="auth-input-bottom">
                            <input type="password" id="login-password" placeholder="패스워드" required class="auth-input-bottom">
                            <button type="submit" class="auth-submit-btn-bottom">🔑 로그인</button>
                        </form>
                        <button id="forgot-password-btn" class="forgot-password-btn-bottom">패스워드 찾기</button>
                    </div>
                    
                    <!-- 회원가입 폼 -->
                    <div id="signup-form-section" class="auth-form-section-bottom" style="display: none;">
                        <form id="email-signup-form" class="auth-form-bottom">
                            <input type="email" id="signup-email" placeholder="이메일" required class="auth-input-bottom">
                            <input type="password" id="signup-password" placeholder="패스워드 (최소 6자리)" required class="auth-input-bottom">
                            <input type="password" id="signup-password-confirm" placeholder="패스워드 확인" required class="auth-input-bottom">
                            <button type="submit" class="auth-submit-btn-bottom">📝 회원가입</button>
                        </form>
                    </div>
                    
                    <!-- 패스워드 찾기 폼 -->
                    <div id="forgot-password-section" class="auth-form-section-bottom" style="display: none;">
                        <form id="forgot-password-form" class="auth-form-bottom">
                            <input type="email" id="forgot-email" placeholder="이메일" required class="auth-input-bottom">
                            <button type="submit" class="auth-submit-btn-bottom">🔄 재설정 이메일 전송</button>
                        </form>
                        <button id="back-to-login-btn" class="back-btn-bottom">← 로그인으로 돌아가기</button>
                    </div>
                </div>
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
    
    // 인증 방법 토글 버튼
    document.getElementById('toggle-auth-method')?.addEventListener('click', handleToggleAuthMethod);
    
    // 탭 전환 버튼들
    document.getElementById('login-tab')?.addEventListener('click', () => showAuthTab('login'));
    document.getElementById('signup-tab')?.addEventListener('click', () => showAuthTab('signup'));
    
    // 이메일 로그인 폼
    document.getElementById('email-login-form')?.addEventListener('submit', handleEmailLogin);
    
    // 이메일 회원가입 폼
    document.getElementById('email-signup-form')?.addEventListener('submit', handleEmailSignup);
    
    // 패스워드 찾기 관련
    document.getElementById('forgot-password-btn')?.addEventListener('click', showForgotPasswordForm);
    document.getElementById('forgot-password-form')?.addEventListener('submit', handleForgotPassword);
    document.getElementById('back-to-login-btn')?.addEventListener('click', showLoginForm);
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
 * 인증 방법 토글 처리
 */
function handleToggleAuthMethod() {
    const googleSection = document.getElementById('google-auth-section');
    const emailSection = document.getElementById('email-auth-section');
    const toggleBtn = document.getElementById('toggle-auth-method');
    
    if (emailSection.style.display === 'none') {
        // 이메일 로그인 모드로 전환
        googleSection.style.display = 'none';
        emailSection.style.display = 'block';
        toggleBtn.textContent = '🔐 Google 로그인';
    } else {
        // Google 로그인 모드로 전환
        googleSection.style.display = 'block';
        emailSection.style.display = 'none';
        toggleBtn.textContent = '📧 이메일 로그인';
    }
}

/**
 * 인증 탭 전환 처리
 */
function showAuthTab(tabName) {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form-section');
    const signupForm = document.getElementById('signup-form-section');
    const forgotForm = document.getElementById('forgot-password-section');
    
    // 모든 폼 숨기기
    loginForm.style.display = 'none';
    signupForm.style.display = 'none';
    forgotForm.style.display = 'none';
    
    // 모든 탭 비활성화
    loginTab.classList.remove('active');
    signupTab.classList.remove('active');
    
    if (tabName === 'login') {
        loginForm.style.display = 'block';
        loginTab.classList.add('active');
    } else if (tabName === 'signup') {
        signupForm.style.display = 'block';
        signupTab.classList.add('active');
    }
}

/**
 * 이메일 로그인 처리
 */
async function handleEmailLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
        showToast('이메일과 패스워드를 입력해주세요.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 로그인 중...';
    
    try {
        const result = await signInWithEmail(email, password);
        
        if (result.success) {
            console.log('✅ 이메일 로그인 성공');
            // 폼 리셋
            event.target.reset();
            // UI는 onAuthStateChange에서 자동으로 업데이트됨
        } else {
            showToast('로그인 실패: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        showToast('로그인 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🔑 로그인';
    }
}

/**
 * 이메일 회원가입 처리
 */
async function handleEmailSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!email || !password || !passwordConfirm) {
        showToast('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showToast('패스워드가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('패스워드는 최소 6자리 이상이어야 합니다.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 회원가입 중...';
    
    try {
        const result = await signUpWithEmail(email, password);
        
        if (result.success) {
            console.log('✅ 이메일 회원가입 성공');
            
            // 회원가입 성공 시 바로 완료 처리
            showToast(result.message || '회원가입이 완료되었습니다! 바로 게임을 시작할 수 있습니다.', 'success');
            
            // 폼 리셋
            event.target.reset();
            
            // UI는 onAuthStateChange에서 자동으로 업데이트됨
        } else {
            showToast('회원가입 실패: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('❌ 회원가입 오류:', error);
        showToast('회원가입 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '📝 회원가입';
    }
}

/**
 * 패스워드 찾기 폼 표시
 */
function showForgotPasswordForm() {
    const loginForm = document.getElementById('login-form-section');
    const forgotForm = document.getElementById('forgot-password-section');
    
    loginForm.style.display = 'none';
    forgotForm.style.display = 'block';
}

/**
 * 로그인 폼 표시
 */
function showLoginForm() {
    const loginForm = document.getElementById('login-form-section');
    const forgotForm = document.getElementById('forgot-password-section');
    
    loginForm.style.display = 'block';
    forgotForm.style.display = 'none';
}

/**
 * 패스워드 찾기 처리
 */
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!email) {
        showToast('이메일을 입력해주세요.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 전송 중...';
    
    try {
        const result = await resetPasswordForEmail(email);
        
        if (result.success) {
            showToast('패스워드 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.', 'success');
            event.target.reset();
            showLoginForm();
        } else {
            showToast('이메일 전송 실패: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('❌ 패스워드 재설정 오류:', error);
        showToast('패스워드 재설정 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🔄 재설정 이메일 전송';
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
        // 1. 게임 데이터 (스킬 + 업그레이드 + 경제 데이터) 저장
        const gameDataWithUpgrades = {
            ...gameData,
            upgradeLevels: upgradeData.levels || {}
        };
        
        const saveGameResult = await saveGameDataToSupabase(gameDataWithUpgrades);
        
        if (!saveGameResult.success) {
            throw new Error('게임 데이터 저장 실패: ' + saveGameResult.error);
        }
        
        // 2. 도전과제 데이터 저장
        await savePlayerStats();
        
        // 3. 해금된 가이드 데이터 저장
        const unlockedGuides = getUnlockedGuides();
        const guideIds = unlockedGuides.map(guide => guide.id);
        const saveGuidesResult = await saveGuidesToSupabase(guideIds);
        
        if (!saveGuidesResult.success) {
            console.warn('⚠️ 가이드 데이터 저장 실패:', saveGuidesResult.error);
        }
        
        statusDiv.textContent = '✅ 모든 데이터 동기화 완료!';
        console.log('✅ 전체 데이터 동기화 성공 (게임 + 도전과제 + 가이드)');
        
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
        button.textContent = '🔄 동기화';
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
                    
                    // UI 업데이트 및 데이터 처리
                    if (data.user) {
                        console.log('👤 사용자 정보:', data.user.email);
                        updateAuthUI(true, data.user);
                        
                        // 새 사용자 처리
                        await handleUserLogin(data.user);
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
        
        // 기존 사용자 데이터 로드
        await handleUserLogin(user);
    } else {
        console.log('ℹ️ 로그인되지 않은 상태');
        updateAuthUI(false, null);
    }
}

/**
 * 사용자 로그인 처리 (새 사용자 vs 기존 사용자 구분)
 */
async function handleUserLogin(user) {
    try {
        console.log('👤 사용자 로그인 처리 시작:', user.email);
        
        // 클라우드 데이터 확인
        const cloudData = await loadGameDataFromSupabase();
        
        if (cloudData) {
            // 기존 사용자 - 클라우드 데이터로 덮어쓰기
            console.log('🔄 기존 사용자 - 클라우드 데이터로 덮어쓰기');
            overwriteGameDataFromCloud(cloudData);
            
            // 업그레이드 데이터와 통계 데이터도 다시 로드
            loadUpgradeData();
            await loadPlayerStats();
            
            // 해금된 가이드 데이터도 클라우드에서 새로고침
            await refreshGuidesFromCloud();
            
        } else {
            // 새 사용자 - 초기 데이터로 시작
            console.log('🆕 새 사용자 - 초기 데이터로 시작');
            initializeNewUserData();
            await initializeNewPlayerStats();
            initializeNewUpgradeData();
            
            // 초기 데이터를 클라우드에 저장
            await saveGameDataToSupabase(gameData);
        }
        
        console.log('✅ 사용자 로그인 처리 완료');
        
    } catch (error) {
        console.error('❌ 사용자 로그인 처리 실패:', error);
        
        // 에러 발생 시 로컬 데이터 사용
        console.log('🔄 에러 발생으로 로컬 데이터 사용');
        loadGameData();
        loadUpgradeData();
        await loadPlayerStats();
    }
}

/**
 * 인증 상태 변화 처리
 */
function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN' && session) {
        updateAuthUI(true, session.user);
        
        // 로그인 직후 사용자 데이터 처리
        setTimeout(async () => {
            await handleUserLogin(session.user);
        }, 1000);
        
    } else if (event === 'SIGNED_OUT') {
        updateAuthUI(false, null);
        
        // 로그아웃 시 로컬 데이터 다시 로드
        loadGameData();
        loadUpgradeData();
        loadPlayerStats();
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