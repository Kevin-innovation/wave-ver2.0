/**
 * UI 시스템 (탭, 메뉴 등)
 */

import { isSkillUnlocked, getCoins } from './economy.js';
import { canPerformGacha } from './shop.js';
import { getSkillLevel, canUpgradeSkill, getUpgradeCost, UPGRADE_CONFIG } from './upgrade.js';
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS, getPlayerStats, getUnlockedAchievements, getAchievementProgress } from './achievements.js';

// ==================== UI 상태 정의 ====================
export const UI_STATES = {
    GAME: 0,         // 메인 게임 화면
    SHOP: 1,         // 상점 화면
    UPGRADE: 2,      // 성장/업그레이드 화면
    ACHIEVEMENTS: 3  // 도전과제 화면
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
        [UI_STATES.ACHIEVEMENTS]: '도전과제'
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
 * 도전과제 화면으로 전환
 */
export function switchToAchievements() {
    setUIState(UI_STATES.ACHIEVEMENTS);
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
        { state: UI_STATES.ACHIEVEMENTS, label: '도전과제', x: canvasWidth - tabWidth - 20 }
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
        const upgradeInfo = canUpgradeSkill(skill.key);
        const canUpgrade = upgradeInfo.canUpgrade;
        const upgradeCost = upgradeInfo.cost;
        
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
 * 도전과제 화면 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function renderAchievementsScreen(ctx, canvasWidth, canvasHeight) {
    // 배경
    ctx.fillStyle = '#F8F4E6';
    ctx.fillRect(0, 60, canvasWidth, canvasHeight - 60);
    
    // 제목
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 도전과제', canvasWidth/2, 110);
    
    // 진행도 표시
    const progress = getAchievementProgress();
    ctx.fillStyle = '#654321';
    ctx.font = '18px Arial';
    ctx.fillText(`달성률: ${progress.unlocked}/${progress.total} (${progress.percentage}%)`, canvasWidth/2, 140);
    
    // 플레이어 통계 요약
    const stats = getPlayerStats();
    const unlockedIds = new Set(getUnlockedAchievements());
    
    // 스크롤 영역 설정 (캔버스 크기에 맞게 조정)
    const scrollY = 0; // 나중에 스크롤 기능 추가 가능
    const startY = 170;
    const achievementHeight = 70;
    const achievementWidth = 240;
    const itemsPerRow = 3; // 한 줄에 3개씩 배치
    const rowSpacing = 8;
    const colSpacing = 10;
    
    // 업적들을 등급별로 정렬
    const sortedAchievements = Object.values(ACHIEVEMENTS).sort((a, b) => {
        const tierOrder = {
            [ACHIEVEMENT_TIERS.BRONZE]: 0,
            [ACHIEVEMENT_TIERS.SILVER]: 1,
            [ACHIEVEMENT_TIERS.GOLD]: 2,
            [ACHIEVEMENT_TIERS.PLATINUM]: 3,
            [ACHIEVEMENT_TIERS.DIAMOND]: 4
        };
        return tierOrder[a.tier] - tierOrder[b.tier];
    });
    
    // 업적 렌더링 (3열 그리드 레이아웃)
    sortedAchievements.forEach((achievement, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        
        // 3열 레이아웃에 맞게 x 좌표 계산
        const totalWidth = itemsPerRow * achievementWidth + (itemsPerRow - 1) * colSpacing;
        const startX = (canvasWidth - totalWidth) / 2;
        const x = startX + col * (achievementWidth + colSpacing);
        const y = startY + row * (achievementHeight + rowSpacing) - scrollY;
        
        // 화면 밖이면 스킵
        if (y + achievementHeight < 60 || y > canvasHeight - 20) return;
        
        const isUnlocked = unlockedIds.has(achievement.id);
        
        renderAchievementCard(ctx, achievement, x, y, achievementWidth, achievementHeight, isUnlocked);
    });
    
    // 하단 안내
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('1/2/3/4 키로 탭 전환', canvasWidth/2, canvasHeight - 10);
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
}

/**
 * 개별 업적 카드 렌더링 (등급별 액자 디자인)
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {Object} achievement - 업적 객체
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @param {number} width - 너비
 * @param {number} height - 높이
 * @param {boolean} isUnlocked - 달성 여부
 */
function renderAchievementCard(ctx, achievement, x, y, width, height, isUnlocked) {
    // 등급별 색상 정의
    const tierColors = {
        [ACHIEVEMENT_TIERS.BRONZE]: {
            bg: isUnlocked ? '#CD7F32' : '#8B5A2B',
            border: isUnlocked ? '#B8860B' : '#654321',
            glow: '#FFD700'
        },
        [ACHIEVEMENT_TIERS.SILVER]: {
            bg: isUnlocked ? '#C0C0C0' : '#808080',
            border: isUnlocked ? '#A9A9A9' : '#696969',
            glow: '#E0E0E0'
        },
        [ACHIEVEMENT_TIERS.GOLD]: {
            bg: isUnlocked ? '#FFD700' : '#B8860B',
            border: isUnlocked ? '#FFA500' : '#996515',
            glow: '#FFFF00'
        },
        [ACHIEVEMENT_TIERS.PLATINUM]: {
            bg: isUnlocked ? '#E5E4E2' : '#999999',
            border: isUnlocked ? '#D3D3D3' : '#777777',
            glow: '#FFFFFF'
        },
        [ACHIEVEMENT_TIERS.DIAMOND]: {
            bg: isUnlocked ? '#B9F2FF' : '#708090',
            border: isUnlocked ? '#87CEEB' : '#556B2F',
            glow: '#00FFFF'
        }
    };
    
    const colors = tierColors[achievement.tier];
    
    // 달성된 업적에만 빛나는 효과
    if (isUnlocked) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;
    }
    
    // 배경 (액자)
    ctx.fillStyle = colors.bg;
    ctx.fillRect(x, y, width, height);
    
    // 테두리 (액자 프레임)
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = isUnlocked ? 4 : 2;
    ctx.strokeRect(x, y, width, height);
    
    // 그림자 리셋
    ctx.shadowBlur = 0;
    
    // 내부 장식 (달성된 업적만)
    if (isUnlocked && achievement.tier !== ACHIEVEMENT_TIERS.BRONZE) {
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
    }
    
    // 아이콘 (크기 조정)
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = isUnlocked ? '#000000' : '#666666';
    ctx.fillText(achievement.icon, x + width/2, y + 30);
    
    // 업적 이름 (크기 조정)
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = isUnlocked ? '#000000' : '#999999';
    ctx.fillText(achievement.name, x + width/2, y + 45);
    
    // 보상 표시 (달성된 경우)
    if (isUnlocked) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#4CAF50';
        ctx.fillText(`+${achievement.reward} 코인`, x + width/2, y + 58);
    } else {
        // 미달성 시 물음표
        ctx.font = '18px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('?', x + width/2, y + 58);
    }
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
} 