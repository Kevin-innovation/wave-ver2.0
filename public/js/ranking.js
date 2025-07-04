/**
 * 랭킹 보드 시스템
 */

import { 
    getRankings, 
    getPersonalBestRanking, 
    addScoreToRanking,
    currentUser 
} from './supabase.js';
import { isLoggedIn } from './auth.js';

// 랭킹 관련 변수
let rankingContainer = null;
let currentRankings = [];
let personalBest = null;

/**
 * 랭킹 시스템 초기화
 */
export function initRankingSystem() {
    createRankingElements();
    setupRankingEventListeners();
    
    // 초기 랭킹 데이터 로드
    loadRankingData();
}

/**
 * 랭킹 관련 DOM 요소들 생성
 */
function createRankingElements() {
    // 기존 탭 시스템에 랭킹 탭 추가
    const existingTabs = document.querySelector('.tab-buttons');
    if (existingTabs) {
        const rankingTabButton = document.createElement('button');
        rankingTabButton.className = 'tab-button';
        rankingTabButton.setAttribute('data-tab', 'ranking');
        rankingTabButton.innerHTML = '🏆 랭킹';
        existingTabs.appendChild(rankingTabButton);
    }
    
    // 랭킹 탭 컨테이너 생성
    rankingContainer = document.createElement('div');
    rankingContainer.id = 'ranking-tab';
    rankingContainer.className = 'tab-content';
    rankingContainer.style.display = 'none';
    rankingContainer.innerHTML = `
        <div class="ranking-section">
            <h2>🏆 전체 랭킹</h2>
            
            <div class="ranking-controls">
                <button id="refresh-ranking-btn" class="refresh-btn">
                    🔄 새로고침
                </button>
                <div class="ranking-info">
                    <span id="ranking-count">0</span>명의 플레이어가 랭킹에 등록되었습니다
                </div>
            </div>
            
            <div class="personal-best-section" id="personal-best-section">
                <h3>📊 내 최고 기록</h3>
                <div id="personal-best-display" class="personal-best">
                    <span class="login-required">로그인하여 랭킹에 참여해보세요!</span>
                </div>
            </div>
            
            <div class="ranking-list-container">
                <div class="ranking-header">
                    <span class="rank-col">순위</span>
                    <span class="name-col">플레이어</span>
                    <span class="score-col">웨이브</span>
                    <span class="date-col">달성일</span>
                </div>
                
                <div id="ranking-list" class="ranking-list">
                    <div class="loading-message">
                        🔄 랭킹 데이터를 불러오는 중...
                    </div>
                </div>
            </div>
            
            <div class="ranking-footer">
                <p class="ranking-note">
                    🎮 랭킹은 각 게임의 최종 웨이브 기준으로 집계됩니다<br>
                    🏆 같은 점수일 경우 먼저 달성한 플레이어가 상위에 표시됩니다
                </p>
            </div>
        </div>
    `;
    
    // 탭 컨텐츠 영역에 추가
    const tabContainer = document.querySelector('.tab-container');
    if (tabContainer) {
        tabContainer.appendChild(rankingContainer);
    }
}

/**
 * 랭킹 이벤트 리스너 설정
 */
function setupRankingEventListeners() {
    // 새로고침 버튼
    document.getElementById('refresh-ranking-btn')?.addEventListener('click', handleRefreshRanking);
    
    // 인증 상태 변화 감지
    window.addEventListener('gameDataUpdated', handleGameDataUpdate);
    document.addEventListener('authStateChanged', handleAuthStateChange);
}

/**
 * 랭킹 데이터 로드
 */
async function loadRankingData() {
    try {
        // 전체 랭킹 조회
        const rankings = await getRankings(50); // 상위 50명
        currentRankings = rankings;
        updateRankingDisplay(rankings);
        
        // 개인 최고 기록 조회 (로그인한 경우)
        if (isLoggedIn()) {
            const personal = await getPersonalBestRanking();
            personalBest = personal;
            updatePersonalBestDisplay(personal);
        }
        
    } catch (error) {
        console.error('❌ 랭킹 데이터 로드 실패:', error);
        showRankingError('랭킹 데이터를 불러올 수 없습니다.');
    }
}

/**
 * 랭킹 새로고침 처리
 */
async function handleRefreshRanking() {
    const button = document.getElementById('refresh-ranking-btn');
    if (!button) return;
    
    button.disabled = true;
    button.textContent = '🔄 새로고침 중...';
    
    try {
        await loadRankingData();
        console.log('✅ 랭킹 새로고침 완료');
    } catch (error) {
        console.error('❌ 랭킹 새로고침 실패:', error);
    } finally {
        button.disabled = false;
        button.textContent = '🔄 새로고침';
    }
}

/**
 * 랭킹 디스플레이 업데이트
 */
function updateRankingDisplay(rankings) {
    const rankingList = document.getElementById('ranking-list');
    const rankingCount = document.getElementById('ranking-count');
    
    if (!rankingList) return;
    
    // 랭킹 개수 업데이트
    if (rankingCount) {
        rankingCount.textContent = rankings.length;
    }
    
    if (rankings.length === 0) {
        rankingList.innerHTML = `
            <div class="empty-ranking">
                🎮 아직 랭킹에 등록된 플레이어가 없습니다.<br>
                첫 번째 기록을 남겨보세요!
            </div>
        `;
        return;
    }
    
    // 랭킹 리스트 생성
    const rankingHTML = rankings.map((record, index) => {
        const rank = index + 1;
        const isPersonal = currentUser && record.user_id === currentUser.id;
        const rankClass = getRankClass(rank);
        const personalClass = isPersonal ? 'personal-record' : '';
        
        return `
            <div class="ranking-item ${rankClass} ${personalClass}">
                <span class="rank-col">
                    ${getRankDisplay(rank)}
                </span>
                <span class="name-col">
                    ${escapeHtml(record.user_name)}
                    ${isPersonal ? '👤' : ''}
                </span>
                <span class="score-col">
                    ${record.score}웨이브
                </span>
                <span class="date-col">
                    ${formatDate(record.achieved_at)}
                </span>
            </div>
        `;
    }).join('');
    
    rankingList.innerHTML = rankingHTML;
}

/**
 * 개인 최고 기록 디스플레이 업데이트
 */
function updatePersonalBestDisplay(personalRecord) {
    const personalBestDisplay = document.getElementById('personal-best-display');
    if (!personalBestDisplay) return;
    
    if (!isLoggedIn()) {
        personalBestDisplay.innerHTML = `
            <span class="login-required">로그인하여 랭킹에 참여해보세요!</span>
        `;
        return;
    }
    
    if (!personalRecord) {
        personalBestDisplay.innerHTML = `
            <div class="no-record">
                <span class="no-record-text">아직 랭킹 기록이 없습니다</span>
                <span class="encouragement">게임을 플레이하여 첫 기록을 남겨보세요! 🎮</span>
            </div>
        `;
        return;
    }
    
    // 전체 랭킹에서의 순위 찾기
    const globalRank = currentRankings.findIndex(r => r.id === personalRecord.id) + 1;
    const rankDisplay = globalRank > 0 ? `전체 ${globalRank}위` : '순위 집계 중';
    
    personalBestDisplay.innerHTML = `
        <div class="personal-record-display">
            <div class="personal-main">
                <span class="personal-score">${personalRecord.score}웨이브</span>
                <span class="personal-rank">${rankDisplay}</span>
            </div>
            <div class="personal-details">
                <span class="personal-date">달성일: ${formatDate(personalRecord.achieved_at)}</span>
            </div>
        </div>
    `;
}

/**
 * 게임 종료 시 점수 랭킹 등록
 */
export async function submitScoreToRanking(score) {
    if (!isLoggedIn()) {
        console.log('ℹ️ 로그인하지 않아 랭킹에 등록되지 않습니다.');
        return { success: false, error: 'Not logged in' };
    }
    
    try {
        console.log('🏆 랭킹에 점수 등록 중:', score, '웨이브');
        
        const result = await addScoreToRanking(score);
        
        if (result.success) {
            console.log('✅ 랭킹 등록 성공');
            
            // 랭킹 데이터 갱신
            setTimeout(() => {
                loadRankingData();
            }, 1000);
            
            return { success: true };
        } else {
            console.error('❌ 랭킹 등록 실패:', result.error);
            return { success: false, error: result.error };
        }
        
    } catch (error) {
        console.error('❌ 랭킹 등록 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 랭킹 오류 표시
 */
function showRankingError(message) {
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;
    
    rankingList.innerHTML = `
        <div class="error-message">
            ❌ ${message}
        </div>
    `;
}

/**
 * 순위에 따른 CSS 클래스 반환
 */
function getRankClass(rank) {
    if (rank === 1) return 'rank-1st';
    if (rank === 2) return 'rank-2nd';
    if (rank === 3) return 'rank-3rd';
    if (rank <= 10) return 'rank-top10';
    return '';
}

/**
 * 순위 표시 문자열 반환
 */
function getRankDisplay(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}위`;
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return '오늘';
    } else if (diffDays === 1) {
        return '어제';
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    }
}

/**
 * HTML 이스케이프
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 게임 데이터 업데이트 핸들러
 */
function handleGameDataUpdate(event) {
    // 게임 데이터가 업데이트되면 개인 최고 기록도 갱신
    if (isLoggedIn()) {
        setTimeout(() => {
            loadRankingData();
        }, 500);
    }
}

/**
 * 인증 상태 변화 핸들러
 */
function handleAuthStateChange(event) {
    // 로그인/로그아웃 시 랭킹 데이터 갱신
    setTimeout(() => {
        loadRankingData();
    }, 1000);
}

/**
 * 랭킹 탭 표시
 */
export function showRankingTab() {
    const rankingTab = document.getElementById('ranking-tab');
    if (rankingTab) {
        rankingTab.style.display = 'block';
        
        // 다른 탭들 숨기기
        document.querySelectorAll('.tab-content').forEach(tab => {
            if (tab.id !== 'ranking-tab') {
                tab.style.display = 'none';
            }
        });
        
        // 탭 버튼 활성화 상태 변경
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-tab="ranking"]')?.classList.add('active');
        
        // 랭킹 데이터 새로고침
        loadRankingData();
    }
}

/**
 * 랭킹 탭 숨기기
 */
export function hideRankingTab() {
    const rankingTab = document.getElementById('ranking-tab');
    if (rankingTab) {
        rankingTab.style.display = 'none';
    }
} 