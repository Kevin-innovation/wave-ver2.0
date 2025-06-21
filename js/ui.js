/**
 * UI 시스템 (탭, 메뉴 등)
 */

import { isSkillUnlocked, getCoins } from './economy.js';
import { canPerformGacha } from './shop.js';
import { getSkillLevel, canUpgradeSkill, getUpgradeCost, UPGRADE_CONFIG } from './upgrade.js';

// ==================== UI 상태 정의 ====================
export const UI_STATES = {
    GAME: 0,     // 메인 게임 화면
    SHOP: 1,     // 상점 화면
    UPGRADE: 2   // 성장/업그레이드 화면
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
        [UI_STATES.UPGRADE]: '성장'
    };
    
    console.log(`UI 상태 변경: ${stateNames[oldState]} → ${stateNames[newState]}`);
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
 * 탭 버튼 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 */
export function renderTabButtons(ctx, canvasWidth) {
    const tabWidth = 100;
    const tabHeight = 40;
    const tabY = 10;
    const spacing = 10;
    
    // 탭 정보
    const tabs = [
        { state: UI_STATES.GAME, label: '게임', x: canvasWidth - (tabWidth * 3 + spacing * 2) - 20 },
        { state: UI_STATES.SHOP, label: '상점', x: canvasWidth - (tabWidth * 2 + spacing) - 20 },
        { state: UI_STATES.UPGRADE, label: '성장', x: canvasWidth - tabWidth - 20 }
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
        ctx.font = 'bold 16px Arial';
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
    ctx.fillText('1/2/3 키로 탭 전환', canvasWidth/2, canvasHeight - 30);
    
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
    ctx.fillText('⚡ 스킬 성장', canvasWidth/2, 120);
    
    // 설명
    ctx.font = '18px Arial';
    ctx.fillText('코인으로 스킬을 업그레이드하세요!', canvasWidth/2, 160);
    
    // 현재 코인 표시
    ctx.fillStyle = '#FF9800';
    ctx.font = '16px Arial';
    ctx.fillText(`보유 코인: 🪙 ${getCoins()}`, canvasWidth/2, 185);
    
    // 스킬 업그레이드 박스들
    const skillData = [
        { key: 'h', name: 'H-대시', desc: '쿨타임↓ 거리↑', y: 220 },
        { key: 'j', name: 'J-실드', desc: '쿨타임↓ 지속시간↑', y: 280 },
        { key: 'k', name: 'K-슬로우', desc: '쿨타임↓ 지속시간↑ 강도↑', y: 340 },
        { key: 'l', name: 'L-스톱', desc: '쿨타임↓ 지속시간↑', y: 400 }
    ];
    
    skillData.forEach(skill => {
        const level = getSkillLevel(skill.key);
        const upgradeCheck = canUpgradeSkill(skill.key);
        const isUnlocked = isSkillUnlocked(skill.key);
        
        // 스킬 박스 색상 결정
        let boxColor, borderColor, textColor;
        if (!isUnlocked) {
            boxColor = '#EEEEEE';
            borderColor = '#BDBDBD';
            textColor = '#757575';
        } else if (upgradeCheck.canUpgrade) {
            boxColor = '#C8E6C9';
            borderColor = '#4CAF50';
            textColor = '#1B5E20';
        } else if (level >= UPGRADE_CONFIG.maxLevel) {
            boxColor = '#FFE0B2';
            borderColor = '#FF9800';
            textColor = '#E65100';
        } else {
            boxColor = '#FFCDD2';
            borderColor = '#F44336';
            textColor = '#C62828';
        }
        
        // 스킬 박스
        ctx.fillStyle = boxColor;
        ctx.fillRect(canvasWidth/2 - 150, skill.y, 300, 40);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(canvasWidth/2 - 150, skill.y, 300, 40);
        
        // 스킬 정보
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        
        if (!isUnlocked) {
            ctx.fillText(`${skill.name} (🔒 잠김)`, canvasWidth/2 - 140, skill.y + 16);
            ctx.font = '12px Arial';
            ctx.fillText('상점에서 스킬을 먼저 획득하세요', canvasWidth/2 - 140, skill.y + 32);
        } else {
            ctx.fillText(`${skill.name} Lv.${level}`, canvasWidth/2 - 140, skill.y + 16);
            ctx.font = '12px Arial';
            ctx.fillText(skill.desc, canvasWidth/2 - 140, skill.y + 32);
        }
        
        // 우측 정보 (가격 또는 상태)
        ctx.textAlign = 'right';
        ctx.font = 'bold 14px Arial';
        
        if (!isUnlocked) {
            ctx.fillText('잠김', canvasWidth/2 + 140, skill.y + 25);
        } else if (level >= UPGRADE_CONFIG.maxLevel) {
            ctx.fillText('MAX', canvasWidth/2 + 140, skill.y + 25);
        } else {
            const cost = getUpgradeCost(skill.key, level);
            if (upgradeCheck.canUpgrade) {
                ctx.fillStyle = '#2E7D32';
                ctx.fillText(`💰 ${cost}`, canvasWidth/2 + 140, skill.y + 20);
                ctx.font = '10px Arial';
                ctx.fillText('클릭!', canvasWidth/2 + 140, skill.y + 32);
            } else {
                ctx.fillStyle = '#D32F2F';
                ctx.fillText(`💰 ${cost}`, canvasWidth/2 + 140, skill.y + 20);
                ctx.font = '10px Arial';
                ctx.fillText('부족', canvasWidth/2 + 140, skill.y + 32);
            }
        }
    });
    
    // 하단 안내
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('1/2/3 키로 탭 전환 | 스킬 박스 클릭으로 업그레이드', canvasWidth/2, canvasHeight - 30);
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
} 