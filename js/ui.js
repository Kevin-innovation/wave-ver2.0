/**
 * UI 시스템 (탭, 메뉴 등)
 */

import { isSkillUnlocked, getCoins } from './economy.js';
import { canPerformGacha, canPerformGuideGacha, getUnlockedGuides, SHOP_CONFIG } from './shop.js';
import { getSkillLevel, canUpgradeSkill, getUpgradeCost, UPGRADE_CONFIG } from './upgrade.js';
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS, getPlayerStats, getUnlockedAchievements, getAchievementProgress } from './achievements.js';
import { isLoggedIn, getCurrentUserInfo } from './auth.js';
import { getCurrentRankings, getPersonalBest } from './ranking.js';

// ==================== UI 상태 정의 ====================
export const UI_STATES = {
    GAME: 0,         // 메인 게임 화면
    SHOP: 1,         // 상점 화면
    UPGRADE: 2,      // 성장/업그레이드 화면
    ACHIEVEMENTS: 3, // 도전과제 화면
    RANKING: 4       // 랭킹 화면
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
        [UI_STATES.ACHIEVEMENTS]: '도전과제',
        [UI_STATES.RANKING]: '랭킹'
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
        { state: UI_STATES.GAME, label: '게임', x: canvasWidth - (tabWidth * 5 + spacing * 4) - 20 },
        { state: UI_STATES.SHOP, label: '상점', x: canvasWidth - (tabWidth * 4 + spacing * 3) - 20 },
        { state: UI_STATES.UPGRADE, label: '성장', x: canvasWidth - (tabWidth * 3 + spacing * 2) - 20 },
        { state: UI_STATES.ACHIEVEMENTS, label: '도전과제', x: canvasWidth - (tabWidth * 2 + spacing) - 20 },
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
    ctx.fillText('스킬과 업적 가이드를 뽑으세요!', canvasWidth/2, 160);
    
    // 스킬 뽑기 박스
    const boxWidth = 200;
    const boxHeight = 150;
    const boxX = canvasWidth/2 - boxWidth/2;
    const boxY = 200;
    
    // 스킬 뽑기 박스 배경
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // 스킬 뽑기 박스 내용
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('스킬 뽑기', canvasWidth/2, boxY + 40);
    ctx.font = '16px Arial';
    ctx.fillText('💰 300 코인', canvasWidth/2, boxY + 70);
    ctx.font = '14px Arial';
    ctx.fillText('클릭하여 뽑기!', canvasWidth/2, boxY + 100);
    ctx.fillText('J/K/L 스킬 랜덤', canvasWidth/2, boxY + 120);
    
    // 가이드 뽑기 박스
    const guideBoxY = boxY + boxHeight + 20;
    
    // 가이드 뽑기 박스 배경
    ctx.fillStyle = '#8A2BE2';
    ctx.fillRect(boxX, guideBoxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#4B0082';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, guideBoxY, boxWidth, boxHeight);
    
    // 가이드 뽑기 박스 내용
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('업적 해금방법 뽑기', canvasWidth/2, guideBoxY + 30);
    ctx.font = '16px Arial';
    ctx.fillText('💰 500 코인', canvasWidth/2, guideBoxY + 55);
    ctx.font = '14px Arial';
    ctx.fillText('비밀을 하나씩 공개!', canvasWidth/2, guideBoxY + 80);
    ctx.font = '12px Arial';
    ctx.fillText('25개 업적 중 하나 랜덤', canvasWidth/2, guideBoxY + 105);
    
    // 현재 잠긴 스킬 표시
    const lockedSkills = [];
    if (!isSkillUnlocked('j')) lockedSkills.push('J-실드');
    if (!isSkillUnlocked('k')) lockedSkills.push('K-슬로우');
    if (!isSkillUnlocked('l')) lockedSkills.push('L-스톱');
    
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    if (lockedSkills.length > 0) {
        ctx.fillText(`잠긴 스킬: ${lockedSkills.join(', ')}`, canvasWidth/2, guideBoxY + 150);
    } else {
        ctx.fillText('모든 스킬을 보유하고 있습니다!', canvasWidth/2, guideBoxY + 150);
    }
    
    // 해금된 가이드 수 표시
    const unlockedGuides = getUnlockedGuides();
    ctx.fillStyle = '#9C27B0';
    ctx.font = '16px Arial';
    ctx.fillText(`해금된 가이드: ${unlockedGuides.length}/25`, canvasWidth/2, guideBoxY + 175);
    
    // 뽑기 가능 여부 표시
    const gachaStatus = canPerformGacha();
    ctx.fillStyle = gachaStatus.canGacha ? '#4CAF50' : '#F44336';
    ctx.font = '14px Arial';
    ctx.fillText(`스킬 뽑기: ${gachaStatus.reason}`, canvasWidth/2, guideBoxY + 200);
    
    const guideGachaStatus = canPerformGuideGacha();
    ctx.fillStyle = guideGachaStatus.canGacha ? '#4CAF50' : '#F44336';
    ctx.fillText(`가이드 뽑기: ${guideGachaStatus.reason}`, canvasWidth/2, guideBoxY + 220);
    
    // 현재 코인 표시
    ctx.fillStyle = '#FF9800';
    ctx.font = '18px Arial';
    ctx.fillText(`보유 코인: 🪙 ${getCoins()}`, canvasWidth/2, guideBoxY + 250);
    
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
    
    // 업적 영역 계산 (렌더링 전에 계산)
    const totalRows = Math.ceil(sortedAchievements.length / itemsPerRow);
    const achievementAreaBottom = startY + totalRows * (achievementHeight + rowSpacing) - rowSpacing;
    
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
    
    // 해금된 가이드 표시 (업적 영역 아래에 배치)
    const unlockedGuides = getUnlockedGuides();
    const guideStartY = Math.max(achievementAreaBottom + 30, canvasHeight - 200); // 업적 아래 30px 간격, 최소 200px 확보
    
    if (unlockedGuides.length > 0) {
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🔮 해금된 비밀 (${unlockedGuides.length}/25)`, canvasWidth/2, guideStartY);
        
        // 해금된 가이드 목록 표시 (최대 2개로 축소하여 공간 절약)
        const displayGuides = unlockedGuides.slice(-2); // 최근 2개만 표시
        
        let currentY = guideStartY + 25;
        displayGuides.forEach((guide, index) => {
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(guide.title, canvasWidth/2, currentY);
            currentY += 20;
            
            // 가이드 텍스트를 줄바꿈하여 표시 (더 간결하게)
            ctx.fillStyle = '#654321';
            ctx.font = '12px Arial';
            const maxWidth = canvasWidth - 100;
            const words = guide.guide.split(' ');
            let line = '';
            
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && i > 0) {
                    ctx.fillText(line, canvasWidth/2, currentY);
                    line = words[i] + ' ';
                    currentY += 14;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, canvasWidth/2, currentY);
            currentY += 20; // 가이드 간 간격
        });
        
        // 추가 가이드 안내
        if (unlockedGuides.length < 25) {
            ctx.fillStyle = '#654321';
            ctx.font = '12px Arial';
            ctx.fillText('🎰 상점에서 더 많은 비밀을 발견하세요!', canvasWidth/2, Math.min(currentY + 15, canvasHeight - 30));
        }
    } else {
        // 업적 탐험 안내 (가이드가 없을 때)
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔍 업적 탐험하기', canvasWidth/2, guideStartY);
        
        // 업적 해금 방법 획득 안내
        ctx.fillStyle = '#654321';
        ctx.font = '14px Arial';
        const explorationTips = [
            '🎰 상점에서 "업적 해금방법 뽑기"로 비밀을 알아보세요!',
            '💡 각 업적마다 숨겨진 해금 조건이 있습니다',
            '🏆 모든 업적을 달성하여 진정한 마스터가 되어보세요!'
        ];
        
        explorationTips.forEach((tip, index) => {
            ctx.fillText(tip, canvasWidth/2, guideStartY + 25 + index * 18);
        });
    }
    
    // 하단 탭 전환 안내
    ctx.fillStyle = '#999999';
    ctx.font = '12px Arial';
    ctx.fillText('1/2/3/4/5 키로 탭 전환', canvasWidth/2, canvasHeight - 5);
    
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
        ctx.shadowColor = '#00FF00'; // 녹색 글로우
        ctx.shadowBlur = 15;
    }
    
    // 배경 (액자)
    ctx.fillStyle = colors.bg;
    ctx.fillRect(x, y, width, height);
    
    // 테두리 (액자 프레임) - 달성된 업적은 녹색 테두리
    if (isUnlocked) {
        ctx.strokeStyle = '#00FF00'; // 밝은 녹색
        ctx.lineWidth = 6; // 더 두꺼운 테두리
    } else {
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
    }
    ctx.strokeRect(x, y, width, height);
    
    // 그림자 리셋
    ctx.shadowBlur = 0;
    
    // 내부 장식 (달성된 업적만) - 녹색 강조
    if (isUnlocked) {
        ctx.strokeStyle = '#32CD32'; // 라임 그린
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 6, y + 6, width - 12, height - 12);
        
        // 추가 내부 테두리 (더 눈에 띄게)
        ctx.strokeStyle = '#90EE90'; // 연한 녹색
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, y + 10, width - 20, height - 20);
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

/**
 * 랭킹 화면 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function renderRankingScreen(ctx, canvasWidth, canvasHeight) {
    // 배경
    ctx.fillStyle = '#E8F4FD';
    ctx.fillRect(0, 60, canvasWidth, canvasHeight - 60);
    
    // 제목
    ctx.fillStyle = '#1565C0';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 전체 랭킹', canvasWidth/2, 110);
    
    // 로그인 상태 확인
    if (!isLoggedIn()) {
        // 로그인 안내 메시지
        ctx.fillStyle = '#FF9800';
        ctx.font = '20px Arial';
        ctx.fillText('🔐 로그인하여 랭킹에 참여하세요!', canvasWidth/2, 200);
        
        ctx.fillStyle = '#666666';
        ctx.font = '16px Arial';
        ctx.fillText('화면 하단의 Google 로그인 버튼을 클릭하세요', canvasWidth/2, 240);
        
        // 로그인 혜택 안내
        ctx.fillStyle = '#4CAF50';
        ctx.font = '18px Arial';
        ctx.fillText('🎮 로그인 혜택:', canvasWidth/2, 300);
        
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        const benefits = [
            '• 실시간 전체 랭킹 확인',
            '• 개인 최고 기록 저장',
            '• 클라우드 데이터 동기화',
            '• 다른 플레이어들과 경쟁'
        ];
        
        benefits.forEach((benefit, index) => {
            ctx.fillText(benefit, canvasWidth/2, 330 + index * 30);
        });
        
    } else {
        // 로그인된 상태 - 랭킹 정보 표시
        const userInfo = getCurrentUserInfo();
        const userName = userInfo?.user_metadata?.full_name || userInfo?.email || 'Unknown';
        
        // 현재 사용자 정보
        ctx.fillStyle = '#4CAF50';
        ctx.font = '18px Arial';
        ctx.fillText(`👤 ${userName}님, 환영합니다!`, canvasWidth/2, 150);
        
        // 실시간 랭킹 데이터 가져오기
        const rankings = getCurrentRankings();
        const personalBest = getPersonalBest();
        
        // 개인 최고 기록 표시
        ctx.fillStyle = '#FF9800';
        ctx.font = '20px Arial';
        ctx.fillText('📊 개인 최고 기록', canvasWidth/2, 190);
        
        if (personalBest) {
            // 전체 랭킹에서의 순위 찾기
            const globalRank = rankings.findIndex(r => r.id === personalBest.id) + 1;
            const rankDisplay = globalRank > 0 ? `전체 ${globalRank}위` : '순위 집계 중';
            
            ctx.fillStyle = '#333333';
            ctx.font = '16px Arial';
            ctx.fillText(`최고 웨이브: ${personalBest.score}웨이브`, canvasWidth/2, 220);
            ctx.fillText(`${rankDisplay}`, canvasWidth/2, 240);
        } else {
            ctx.fillStyle = '#666666';
            ctx.font = '16px Arial';
            ctx.fillText('아직 랭킹 기록이 없습니다', canvasWidth/2, 220);
        }
        
        // 전체 랭킹 표시
        ctx.fillStyle = '#1976D2';
        ctx.font = '18px Arial';
        ctx.fillText('🏆 전체 랭킹 TOP 10', canvasWidth/2, 280);
        
        if (rankings.length > 0) {
            ctx.fillStyle = '#333333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            
            const startY = 310;
            const lineHeight = 20;
            const maxDisplay = Math.min(rankings.length, 10);
            
            for (let i = 0; i < maxDisplay; i++) {
                const rank = rankings[i];
                const isMe = userInfo && rank.user_id === userInfo.id;
                const rankText = `${i + 1}위`;
                const nameText = rank.user_name.length > 10 ? 
                    rank.user_name.substring(0, 10) + '...' : rank.user_name;
                const scoreText = `${rank.score}웨이브`;
                
                // 내 기록이면 강조
                if (isMe) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.font = 'bold 14px Arial';
                } else {
                    ctx.fillStyle = '#333333';
                    ctx.font = '14px Arial';
                }
                
                const yPos = startY + (i * lineHeight);
                ctx.fillText(rankText, 50, yPos);
                ctx.fillText(nameText, 110, yPos);
                ctx.fillText(scoreText, canvasWidth - 130, yPos);
                
                if (isMe) {
                    ctx.fillText('👤', canvasWidth - 50, yPos);
                }
            }
            
            ctx.textAlign = 'center';
        } else {
            ctx.fillStyle = '#666666';
            ctx.font = '16px Arial';
            ctx.fillText('랭킹 데이터를 불러오는 중...', canvasWidth/2, 320);
        }
    }
    
    // 하단 안내
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('1/2/3/4/5 키로 탭 전환', canvasWidth/2, canvasHeight - 10);
    
    // 텍스트 정렬 리셋
    ctx.textAlign = 'left';
} 