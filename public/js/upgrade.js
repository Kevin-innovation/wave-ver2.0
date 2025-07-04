/**
 * 스킬 업그레이드 시스템
 */

import { getCoins, spendCoins, isSkillUnlocked } from './economy.js';

// ==================== 업그레이드 설정 ====================
export const UPGRADE_CONFIG = {
    maxLevel: 20,  // 최대 레벨 (5 → 20)
    baseCosts: {   // 기본 업그레이드 비용 (더 높게 설정)
        h: 8,   // 대시 (5 → 8)
        j: 15,  // 실드 (8 → 15)
        k: 25,  // 슬로우 (10 → 25)
        l: 40   // 스톱 (15 → 40)
    }
};

// ==================== 스킬 업그레이드 데이터 ====================
let upgradeData = {
    levels: {
        h: 1,  // 대시 레벨 (1~20)
        j: 1,  // 실드 레벨 (1~20)
        k: 1,  // 슬로우 레벨 (1~20)
        l: 1   // 스톱 레벨 (1~20)
    }
};

/**
 * 업그레이드 데이터 로드
 */
export function loadUpgradeData() {
    try {
        const saved = localStorage.getItem('wave-ver2-upgrades');
        if (saved) {
            const parsedData = JSON.parse(saved);
            upgradeData.levels = parsedData.levels || { h: 1, j: 1, k: 1, l: 1 };
            console.log('업그레이드 데이터 로드 완료:', upgradeData);
        }
    } catch (error) {
        console.error('업그레이드 데이터 로드 실패:', error);
        upgradeData.levels = { h: 1, j: 1, k: 1, l: 1 };
    }
}

/**
 * 업그레이드 데이터 저장
 */
export function saveUpgradeData() {
    try {
        localStorage.setItem('wave-ver2-upgrades', JSON.stringify(upgradeData));
        console.log('업그레이드 데이터 저장 완료:', upgradeData);
    } catch (error) {
        console.error('업그레이드 데이터 저장 실패:', error);
    }
}

/**
 * 스킬 레벨 반환
 * @param {string} skillKey - 스킬 키 ('h', 'j', 'k', 'l')
 * @returns {number} - 스킬 레벨
 */
export function getSkillLevel(skillKey) {
    return upgradeData.levels[skillKey] || 1;
}

/**
 * 업그레이드 비용 계산 (더 복잡한 공식)
 * @param {string} skillKey - 스킬 키
 * @param {number} currentLevel - 현재 레벨
 * @returns {number} - 업그레이드 비용
 */
export function getUpgradeCost(skillKey, currentLevel) {
    const baseCost = UPGRADE_CONFIG.baseCosts[skillKey] || 8;
    
    // 더 복잡한 비용 계산 공식
    // 기본: baseCost * (1.8^level + level^2 * 0.5 + level * 2)
    const exponentialFactor = Math.pow(1.8, currentLevel - 1);
    const quadraticFactor = Math.pow(currentLevel, 2) * 0.5;
    const linearFactor = currentLevel * 2;
    
    // 10레벨 이후 추가 페널티 (더 비싸게)
    const penaltyFactor = currentLevel >= 10 ? Math.pow(1.3, currentLevel - 9) : 1;
    
    // 15레벨 이후 극한 페널티
    const extremePenalty = currentLevel >= 15 ? Math.pow(1.5, currentLevel - 14) : 1;
    
    const totalCost = baseCost * (exponentialFactor + quadraticFactor + linearFactor) * penaltyFactor * extremePenalty;
    
    return Math.floor(totalCost);
}

/**
 * 업그레이드 가능 여부 확인
 * @param {string} skillKey - 스킬 키
 * @returns {Object} - {canUpgrade: boolean, reason: string, cost: number}
 */
export function canUpgradeSkill(skillKey) {
    // 스킬이 해제되지 않음
    if (!isSkillUnlocked(skillKey)) {
        return {
            canUpgrade: false,
            reason: '스킬이 잠겨있습니다',
            cost: 0
        };
    }
    
    const currentLevel = getSkillLevel(skillKey);
    
    // 최대 레벨 도달
    if (currentLevel >= UPGRADE_CONFIG.maxLevel) {
        return {
            canUpgrade: false,
            reason: '최대 레벨입니다',
            cost: 0
        };
    }
    
    const cost = getUpgradeCost(skillKey, currentLevel);
    const coins = getCoins();
    
    // 코인 부족
    if (coins < cost) {
        return {
            canUpgrade: false,
            reason: `코인 부족 (${coins}/${cost})`,
            cost: cost
        };
    }
    
    return {
        canUpgrade: true,
        reason: '업그레이드 가능',
        cost: cost
    };
}

/**
 * 스킬 업그레이드 실행
 * @param {string} skillKey - 스킬 키
 * @returns {Object} - {success: boolean, message: string, newLevel: number}
 */
export function upgradeSkill(skillKey) {
    const upgradeCheck = canUpgradeSkill(skillKey);
    
    if (!upgradeCheck.canUpgrade) {
        return {
            success: false,
            message: upgradeCheck.reason,
            newLevel: getSkillLevel(skillKey)
        };
    }
    
    // 코인 소모
    const spendResult = spendCoins(upgradeCheck.cost);
    if (!spendResult.success) {
        return {
            success: false,
            message: spendResult.message,
            newLevel: getSkillLevel(skillKey)
        };
    }
    
    // 레벨 업
    upgradeData.levels[skillKey]++;
    saveUpgradeData();
    
    // 스킬 설정 즉시 업데이트 (동적 import로 순환 의존성 방지)
    import('./skills.js').then(skillsModule => {
        skillsModule.updateSkillConfig();
    });
    
    const skillNames = {
        'h': 'H-대시',
        'j': 'J-실드',
        'k': 'K-슬로우',
        'l': 'L-스톱'
    };
    
    const newLevel = upgradeData.levels[skillKey];
    
    console.log(`⬆️ ${skillNames[skillKey]} 레벨 ${newLevel - 1} → ${newLevel}`);
    
    return {
        success: true,
        message: `${skillNames[skillKey]} 레벨 ${newLevel}로 업그레이드!`,
        newLevel: newLevel
    };
}

/**
 * 스킬 효과 계산 (레벨에 따른) - 20레벨 시스템
 * @param {string} skillKey - 스킬 키
 * @param {string} effectType - 효과 타입 ('cooldown', 'duration', 'power')
 * @returns {number} - 계산된 효과값
 */
export function calculateSkillEffect(skillKey, effectType) {
    const level = getSkillLevel(skillKey);
    
    switch (skillKey) {
        case 'h': // 대시
            if (effectType === 'cooldown') {
                // 쿨타임 감소: 3초 → 0.5초 (20레벨에서)
                // 점진적 감소: 3 - (level-1) * 0.13
                return Math.max(0.5, 3 - (level - 1) * 0.13);
            } else if (effectType === 'distance') {
                // 거리 증가: 100 → 280픽셀 (20레벨에서)
                // 점진적 증가: 100 + (level-1) * 9.5
                return 100 + (level - 1) * 9.5;
            }
            break;
            
        case 'j': // 실드
            if (effectType === 'cooldown') {
                // 쿨타임 감소: 10초 → 2초 (20레벨에서)
                // 점진적 감소: 10 - (level-1) * 0.42
                return Math.max(2, 10 - (level - 1) * 0.42);
            } else if (effectType === 'duration') {
                // 지속시간 증가: 3초 → 8초 (20레벨에서)
                // 점진적 증가: 3 + (level-1) * 0.26
                return 3 + (level - 1) * 0.26;
            }
            break;
            
        case 'k': // 슬로우
            if (effectType === 'cooldown') {
                // 쿨타임 감소: 15초 → 3초 (20레벨에서)
                // 점진적 감소: 15 - (level-1) * 0.63
                return Math.max(3, 15 - (level - 1) * 0.63);
            } else if (effectType === 'duration') {
                // 지속시간 증가: 5초 → 12초 (20레벨에서)
                // 점진적 증가: 5 + (level-1) * 0.37
                return 5 + (level - 1) * 0.37;
            } else if (effectType === 'power') {
                // 슬로우 강도: 30% → 85% (20레벨에서)
                // 점진적 증가: 0.3 + (level-1) * 0.029
                return Math.min(0.85, 0.3 + (level - 1) * 0.029);
            }
            break;
            
        case 'l': // 스톱
            if (effectType === 'cooldown') {
                // 쿨타임 감소: 60초 → 10초 (20레벨에서)
                // 점진적 감소: 60 - (level-1) * 2.63
                return Math.max(10, 60 - (level - 1) * 2.63);
            } else if (effectType === 'duration') {
                // 지속시간 증가: 3초 → 10초 (20레벨에서)
                // 점진적 증가: 3 + (level-1) * 0.37
                return 3 + (level - 1) * 0.37;
            }
            break;
    }
    
    return 1; // 기본값
}

/**
 * 업그레이드 시스템 초기화
 */
export function initUpgradeSystem() {
    loadUpgradeData();
    console.log('업그레이드 시스템 초기화 완료');
}

/**
 * 업그레이드 화면에서 클릭 처리
 * @param {number} mouseX - 마우스 X 좌표
 * @param {number} mouseY - 마우스 Y 좌표
 * @param {number} canvasWidth - 캔버스 너비
 * @returns {boolean} - 클릭 처리 여부
 */
export function handleUpgradeClick(mouseX, mouseY, canvasWidth) {
    // 스킬 박스들의 위치 (ui.js의 renderUpgradeScreen과 동일)
    const skillBoxes = [
        { key: 'h', y: 220 },
        { key: 'j', y: 280 },
        { key: 'k', y: 340 },
        { key: 'l', y: 400 }
    ];
    
    const boxWidth = 300;
    const boxHeight = 40;
    const boxX = canvasWidth/2 - boxWidth/2;
    
    for (const skill of skillBoxes) {
        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= skill.y && mouseY <= skill.y + boxHeight) {
            
            const result = upgradeSkill(skill.key);
            console.log('업그레이드 결과:', result.message);
            return true;
        }
    }
    
    return false;
} 