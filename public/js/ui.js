/**
 * UI 시스템 (탭, 메뉴 등)
 */

import { isSkillUnlocked, getCoins } from './economy.js';
import { canPerformGacha } from './shop.js';
import { getSkillLevel, canUpgradeSkill, getUpgradeCost, UPGRADE_CONFIG } from './upgrade.js';
import { showRankingTab, hideRankingTab } from './ranking.js';

// ==================== UI 상태 정의 ====================
export const UI_STATES = {
    GAME: 0,     // 메인 게임 화면
    SHOP: 1,     // 상점 화면
    UPGRADE: 2,  // 성장/업그레이드 화면
    RANKING: 3   // 랭킹 화면
};

// ==================== UI 상태 관리 ====================
export let currentUIState = UI_STATES.GAME;

/**
 * 현재 UI 상태 반환
 * @returns {number} - 현재 UI 상태
 */
export function getCurrentUIState() {
    return currentUIState;
}

/**
 * UI 상태 변경
 * @param {number} newState - 새로운 UI 상태
 */
export function setUIState(newState) {
    const oldState = currentUIState;
    currentUIState = newState;
    
    const stateNames = {
        [UI_STATES.GAME]: '게임',
        [UI_STATES.SHOP]: '상점',
        [UI_STATES.UPGRADE]: '성장',
        [UI_STATES.RANKING]: '랭킹'
    };
    
    console.log(`UI 상태 변경: ${stateNames[oldState]} → ${stateNames[newState]}`);
    
    // 랭킹 탭 표시/숨기기
    if (newState === UI_STATES.RANKING) {
        showRankingTab();
    } else {
        hideRankingTab();
    }
}

/**
 * 게임 화면으로 전환
 */
export function switchToGame() {
    setUIState(UI_STATES.GAME);
}

/**
 * 상점 화면으로 전환
 */
export function switchToShop() {
    setUIState(UI_STATES.SHOP);
}

/**
 * 성장 화면으로 전환
 */
export function switchToUpgrade() {
    setUIState(UI_STATES.UPGRADE);
}

/**
 * 랭킹 화면으로 전환
 */
export function switchToRanking() {
    setUIState(UI_STATES.RANKING);
}

/**
 * 탭 버튼 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 */
export function renderTabButtons(ctx, canvasWidth) {
    const tabWidth = 80;
    const tabHeight = 40;
    const tabY = 10;
    const spacing = 8;
    
    // 탭 정보
    const tabs = [
        { state: UI_STATES.GAME, label: '게임', x: canvasWidth - (tabWidth * 4 + spacing * 3) - 20 },
        { state: UI_STATES.SHOP, label: '상점', x: canvasWidth - (tabWidth * 3 + spacing * 2) - 20 },
        { state: UI_STATES.UPGRADE, label: '성장', x: canvasWidth - (tabWidth * 2 + spacing) - 20 },
        { state: UI_STATES.RANKING, label: '랭킹', x: canvasWidth - tabWidth - 20 }
    ];
    
    tabs.forEach(tab => {
        // 탭 배경
        if (currentUIState === tab.state) {
            ctx.fillStyle = '#4CAF50';  // 활성 탭 (녹색)
        } else {
            ctx.fillStyle = '#666666';  // 비활성 탭 (회색)
        }
        
        ctx.fillRect(tab.x, tabY, tabWidth, tabHeight);
        
        // 탭 테두리
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(tab.x, tabY, tabWidth, tabHeight);
        
        // 탭 텍스트
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(tab.label, tab.x + tabWidth/2, tabY + 26);
    });
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
}

/**
 * 상점 화면 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function renderShopScreen(ctx, canvasWidth, canvasHeight) {
    // 배경
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 60, canvasWidth, canvasHeight - 60);
    
    // 제목
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🛒 상점', canvasWidth/2, 120);
    
    // 설명
    ctx.font = '20px Arial';
    ctx.fillText('스킬을 뽑아서 획득하세요!', canvasWidth/2, 160);
    
    // 뽑기 박스
    const boxWidth = 200;
    const boxHeight = 150;
    const boxX = canvasWidth/2 - boxWidth/2;
    const boxY = 200;
    
    // 마우스 호버 효과를 위한 색상 (나중에 추가)
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // 뽑기 박스 내용
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('스킬 뽑기', canvasWidth/2, boxY + 40);
    ctx.font = '16px Arial';
    ctx.fillText('💰 300 코인', canvasWidth/2, boxY + 70);
    ctx.font = '14px Arial';
    ctx.fillText('클릭하여 뽑기!', canvasWidth/2, boxY + 100);
    ctx.fillText('J/K/L 스킬 랜덤', canvasWidth/2, boxY + 120);
    
    // 현재 잠긴 스킬 표시
    const lockedSkills = [];
    if (!isSkillUnlocked('j')) lockedSkills.push('J-실드');
    if (!isSkillUnlocked('k')) lockedSkills.push('K-슬로우');
    if (!isSkillUnlocked('l')) lockedSkills.push('L-스톱');
    
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    if (lockedSkills.length > 0) {
        ctx.fillText(`잠긴 스킬: ${lockedSkills.join(', ')}`, canvasWidth/2, 380);
    } else {
        ctx.fillText('모든 스킬을 보유하고 있습니다!', canvasWidth/2, 380);
    }
    
    // 뽑기 가능 여부 표시
    const gachaStatus = canPerformGacha();
    ctx.fillStyle = gachaStatus.canGacha ? '#4CAF50' : '#F44336';
    ctx.font = '14px Arial';
    ctx.fillText(gachaStatus.reason, canvasWidth/2, 410);
    
    // 현재 코인 표시
    ctx.fillStyle = '#FF9800';
    ctx.font = '18px Arial';
    ctx.fillText(`보유 코인: 🪙 ${getCoins()}`, canvasWidth/2, 440);
    
    // 하단 안내
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText('1/2/3/4 키로 탭 전환', canvasWidth/2, canvasHeight - 30);
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
}

/**
 * 성장 화면 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function renderUpgradeScreen(ctx, canvasWidth, canvasHeight) {
    // 배경
    ctx.fillStyle = '#E8F5E8';
    ctx.fillRect(0, 60, canvasWidth, canvasHeight - 60);
    
    // 제목
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📈 성장 시스템', canvasWidth/2, 120);
    
    // 설명
    ctx.font = '18px Arial';
    ctx.fillText('코인으로 스킬을 업그레이드하세요!', canvasWidth/2, 150);
    
    // 스킬별 업그레이드 정보
    const skills = [
        { key: 'h', name: 'H-대시', icon: '⚡', color: '#2196F3' },
        { key: 'j', name: 'J-실드', icon: '🛡️', color: '#4CAF50' },
        { key: 'k', name: 'K-슬로우', icon: '🐌', color: '#FF9800' },
        { key: 'l', name: 'L-스톱', icon: '⏸️', color: '#F44336' }
    ];
    
    const startY = 180;
    const skillHeight = 100;
    const skillWidth = 350;
    const skillX = canvasWidth/2 - skillWidth/2;
    
    skills.forEach((skill, index) => {
        const y = startY + index * (skillHeight + 10);
        
        // 스킬이 해제되지 않은 경우 회색으로 표시
        const isUnlocked = isSkillUnlocked(skill.key);
        const skillLevel = getSkillLevel(skill.key);
        const canUpgrade = canUpgradeSkill(skill.key);
        const upgradeCost = getUpgradeCost(skill.key);
        
        // 배경색
        ctx.fillStyle = isUnlocked ? skill.color + '20' : '#CCCCCC20';
        ctx.fillRect(skillX, y, skillWidth, skillHeight);
        
        // 테두리
        ctx.strokeStyle = isUnlocked ? skill.color : '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.strokeRect(skillX, y, skillWidth, skillHeight);
        
        // 스킬 정보
        ctx.fillStyle = isUnlocked ? '#333333' : '#999999';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${skill.icon} ${skill.name}`, skillX + 15, y + 30);
        
        if (isUnlocked) {
            // 레벨 표시
            ctx.font = '16px Arial';
            ctx.fillText(`레벨: ${skillLevel}/20`, skillX + 15, y + 55);
            
            // 업그레이드 비용 및 상태
            if (skillLevel < 20) {
                ctx.fillStyle = canUpgrade ? '#4CAF50' : '#F44336';
                ctx.fillText(`업그레이드: ${upgradeCost}코인`, skillX + 15, y + 75);
                
                if (!canUpgrade) {
                    ctx.fillStyle = '#F44336';
                    ctx.fillText('코인 부족', skillX + 200, y + 75);
                }
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.fillText('최대 레벨 달성!', skillX + 15, y + 75);
            }
        } else {
            ctx.fillStyle = '#999999';
            ctx.font = '16px Arial';
            ctx.fillText('스킬을 먼저 해제하세요', skillX + 15, y + 55);
        }
    });
    
    // 현재 코인 표시
    ctx.fillStyle = '#FF9800';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`보유 코인: 🪙 ${getCoins()}`, canvasWidth/2, canvasHeight - 60);
    
    // 하단 안내
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText('1/2/3/4 키로 탭 전환', canvasWidth/2, canvasHeight - 30);
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
}

/**
 * 랭킹 화면 렌더링 (캔버스 위에 HTML 요소 사용)
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function renderRankingScreen(ctx, canvasWidth, canvasHeight) {
    // 배경만 렌더링 (실제 랭킹은 HTML 요소로 표시)
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 60, canvasWidth, canvasHeight - 60);
    
    // 안내 메시지
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('랭킹은 아래 영역에서 확인하세요', canvasWidth/2, canvasHeight - 30);
    ctx.fillText('1/2/3/4 키로 탭 전환', canvasWidth/2, canvasHeight - 10);
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
} 