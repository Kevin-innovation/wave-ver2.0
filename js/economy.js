/**
 * 게임 경제 시스템 (코인, 상점 등)
 */

import { saveGameDataToSupabase as saveToCloud } from './supabase.js';
import { isLoggedIn, getCurrentUserInfo } from './auth.js';

// ==================== 코인 시스템 ====================
export const gameData = {
    coins: 0,
    totalMonstersAvoided: 0,
    bestScore: 0,  // 최고 웨이브 기록
    unlockedSkills: {
        h: true,   // 대시 (기본 해제)
        j: false,  // 실드 (잠금)
        k: false,  // 슬로우 (잠금)
        l: false   // 스톱 (잠금)
    },
    skillLevels: {
        h: 1, j: 1, k: 1, l: 1
    }
};

/**
 * 사용자별 로컬스토리지 키 생성
 */
function getUserStorageKey(baseKey) {
    const user = getCurrentUserInfo();
    if (user && user.id) {
        return `${baseKey}-${user.id}`;
    }
    return baseKey; // 로그인하지 않은 경우 기본 키 사용
}

/**
 * 게임 데이터를 localStorage에서 불러오기
 */
export function loadGameData() {
    try {
        const storageKey = getUserStorageKey('wave-ver2-gamedata');
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            const parsedData = JSON.parse(saved);
            gameData.coins = parsedData.coins || 0;
            gameData.totalMonstersAvoided = parsedData.totalMonstersAvoided || 0;
            gameData.bestScore = parsedData.bestScore || 0;
            gameData.unlockedSkills = parsedData.unlockedSkills || {
                h: true, j: false, k: false, l: false
            };
            gameData.skillLevels = parsedData.skillLevels || {
                h: 1, j: 1, k: 1, l: 1
            };
            console.log('게임 데이터 로드 완료:', gameData);
        } else {
            // 저장된 데이터가 없으면 초기 데이터 사용
            resetGameDataToDefault();
            console.log('초기 게임 데이터 설정 완료');
        }
    } catch (error) {
        console.error('게임 데이터 로드 실패:', error);
        resetGameDataToDefault();
    }
}

/**
 * 게임 데이터를 초기값으로 리셋
 */
function resetGameDataToDefault() {
    gameData.coins = 0;
    gameData.totalMonstersAvoided = 0;
    gameData.bestScore = 0;
    gameData.unlockedSkills = { h: true, j: false, k: false, l: false };
    gameData.skillLevels = { h: 1, j: 1, k: 1, l: 1 };
}

/**
 * 새 사용자 로그인 시 로컬 데이터 초기화
 */
export function initializeNewUserData() {
    console.log('🆕 새 사용자 데이터 초기화');
    resetGameDataToDefault();
    saveGameData();
}

/**
 * 클라우드 데이터로 로컬 데이터 덮어쓰기 (병합 아님)
 */
export function overwriteGameDataFromCloud(cloudData) {
    console.log('☁️ 클라우드 데이터로 로컬 데이터 덮어쓰기');
    console.log('클라우드 데이터:', cloudData);
    
    gameData.coins = cloudData.coins || 0;
    gameData.totalMonstersAvoided = cloudData.totalMonstersAvoided || 0;
    gameData.bestScore = cloudData.bestScore || 0;
    gameData.unlockedSkills = cloudData.unlockedSkills || { h: true, j: false, k: false, l: false };
    gameData.skillLevels = cloudData.skillLevels || { h: 1, j: 1, k: 1, l: 1 };
    
    saveGameData();
    console.log('✅ 클라우드 데이터로 덮어쓰기 완료:', gameData);
    
    // UI 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent('gameDataUpdated', { detail: gameData }));
}

/**
 * 게임 데이터를 localStorage에 저장
 */
export function saveGameData() {
    try {
        const storageKey = getUserStorageKey('wave-ver2-gamedata');
        localStorage.setItem(storageKey, JSON.stringify(gameData));
        console.log('게임 데이터 저장 완료:', gameData);
    } catch (error) {
        console.error('게임 데이터 저장 실패:', error);
    }
}

/**
 * 게임 데이터를 Supabase에 저장
 */
export async function saveGameDataToSupabase() {
    try {
        // 로컬 저장도 함께 실행
        saveGameData();
        
        // 클라우드 저장 시도
        const result = await saveToCloud(gameData);
        return result;
    } catch (error) {
        console.error('클라우드 저장 중 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 몬스터를 피했을 때 코인 획득
 * @param {number} amount - 획득할 코인 수 (기본값: 1)
 */
export function earnCoins(amount = 1) {
    gameData.coins += amount;
    gameData.totalMonstersAvoided++;
    
    // 10마리마다 보너스 코인 (예: +2 추가)
    if (gameData.totalMonstersAvoided % 10 === 0) {
        gameData.coins += 2;
        console.log(`🎉 보너스! 10마리 달성으로 +2 코인 추가! 총 ${gameData.coins}코인`);
    }
    
    // 실시간 저장
    saveGameData();
    
    console.log(`💰 코인 +${amount}! 총 ${gameData.coins}코인`);
}

/**
 * 코인 사용
 * @param {number} amount - 사용할 코인 수
 * @returns {Object} - {success: boolean, message: string}
 */
export function spendCoins(amount) {
    if (gameData.coins >= amount) {
        gameData.coins -= amount;
        saveGameData();
        console.log(`💸 코인 -${amount}! 남은 코인: ${gameData.coins}`);
        return {
            success: true,
            message: `${amount} 코인을 소모했습니다`
        };
    } else {
        console.log(`❌ 코인 부족! 필요: ${amount}, 보유: ${gameData.coins}`);
        return {
            success: false,
            message: `코인이 부족합니다 (보유: ${gameData.coins}, 필요: ${amount})`
        };
    }
}

/**
 * 현재 코인 수 반환
 * @returns {number} - 현재 코인 수
 */
export function getCoins() {
    return gameData.coins;
}

/**
 * 스킬 해제 여부 확인
 * @param {string} skillKey - 스킬 키 ('h', 'j', 'k', 'l')
 * @returns {boolean} - 해제 여부
 */
export function isSkillUnlocked(skillKey) {
    return gameData.unlockedSkills[skillKey] || false;
}

/**
 * 스킬 해제
 * @param {string} skillKey - 스킬 키 ('h', 'j', 'k', 'l')
 */
export function unlockSkill(skillKey) {
    const skillNames = {
        h: '대시',
        j: '실드', 
        k: '슬로우',
        l: '스톱'
    };
    
    if (!gameData.unlockedSkills[skillKey]) {
        gameData.unlockedSkills[skillKey] = true;
        saveGameData();
        console.log(`🔓 ${skillNames[skillKey]} 스킬 해제!`);
        return true;
    } else {
        console.log(`ℹ️ ${skillNames[skillKey]} 스킬은 이미 해제됨`);
        return false;
    }
}

/**
 * 해제된 스킬 목록 반환
 * @returns {Object} - 스킬 해제 상태 객체
 */
export function getUnlockedSkills() {
    return { ...gameData.unlockedSkills };
}

/**
 * 현재 웨이브 기록 업데이트
 * @param {number} currentWave - 현재 웨이브
 */
export function updateBestScore(currentWave) {
    if (currentWave > gameData.bestScore) {
        const oldBest = gameData.bestScore;
        gameData.bestScore = currentWave;
        saveGameData();
        
        if (oldBest > 0) {
            console.log(`🏆 새로운 최고 기록! ${oldBest} → ${currentWave} 웨이브`);
        } else {
            console.log(`🏆 첫 번째 기록 달성! ${currentWave} 웨이브`);
        }
        return true; // 신기록 달성
    }
    return false; // 기존 기록 유지
}

/**
 * 최고 기록 반환
 * @returns {number} - 최고 웨이브 기록
 */
export function getBestScore() {
    return gameData.bestScore;
}

/**
 * 경제 시스템 초기화
 */
export function initEconomy() {
    loadGameData();
    console.log('경제 시스템 초기화 완료');
    console.log('해제된 스킬:', gameData.unlockedSkills);
    console.log('최고 기록:', gameData.bestScore, '웨이브');
} 