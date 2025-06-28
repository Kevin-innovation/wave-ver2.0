/**
 * 상점 & 뽑기 시스템
 */

import { getCoins, spendCoins, isSkillUnlocked, unlockSkill } from './economy.js';

// ==================== 상점 설정 ====================
export const SHOP_CONFIG = {
    skillGachaPrice: 300,  // 스킬 뽑기 가격 (10 → 300)
    maxSkills: 3           // 최대 스킬 수 (J, K, L)
};

// ==================== 뽑기 상태 관리 ====================
let gachaResult = null;
let gachaAnimation = {
    active: false,
    timer: 0,
    duration: 2000  // 2초 애니메이션
};

/**
 * 뽑기 가능 여부 확인
 * @returns {Object} - {canGacha: boolean, reason: string}
 */
export function canPerformGacha() {
    const coins = getCoins();
    
    // 코인 부족
    if (coins < SHOP_CONFIG.skillGachaPrice) {
        return {
            canGacha: false,
            reason: `코인이 부족합니다! (${coins}/${SHOP_CONFIG.skillGachaPrice})`
        };
    }
    
    // 모든 스킬 이미 보유
    const lockedSkills = getLockedSkills();
    if (lockedSkills.length === 0) {
        return {
            canGacha: false,
            reason: '모든 스킬을 이미 보유하고 있습니다!'
        };
    }
    
    return {
        canGacha: true,
        reason: '뽑기 가능!'
    };
}

/**
 * 잠긴 스킬 목록 반환
 * @returns {Array} - 잠긴 스킬 배열
 */
function getLockedSkills() {
    const skills = ['j', 'k', 'l'];
    return skills.filter(skill => !isSkillUnlocked(skill));
}

/**
 * 스킬 뽑기 실행
 * @returns {Object} - {success: boolean, skill: string, message: string}
 */
export function performSkillGacha() {
    const gachaCheck = canPerformGacha();
    
    if (!gachaCheck.canGacha) {
        return {
            success: false,
            skill: null,
            message: gachaCheck.reason
        };
    }
    
    // 코인 소모
    const spendResult = spendCoins(SHOP_CONFIG.skillGachaPrice);
    if (!spendResult.success) {
        return {
            success: false,
            skill: null,
            message: spendResult.message
        };
    }
    
    // 랜덤 스킬 선택
    const lockedSkills = getLockedSkills();
    const randomIndex = Math.floor(Math.random() * lockedSkills.length);
    const selectedSkill = lockedSkills[randomIndex];
    
    // 스킬 해제
    unlockSkill(selectedSkill);
    
    // 애니메이션 시작
    startGachaAnimation(selectedSkill);
    
    const skillNames = {
        'j': 'J-실드',
        'k': 'K-슬로우',
        'l': 'L-스톱'
    };
    
    console.log(`🎉 뽑기 성공! ${skillNames[selectedSkill]} 스킬 획득!`);
    
    return {
        success: true,
        skill: selectedSkill,
        message: `🎉 ${skillNames[selectedSkill]} 스킬 획득!`
    };
}

/**
 * 뽑기 애니메이션 시작
 * @param {string} skill - 획득한 스킬
 */
function startGachaAnimation(skill) {
    gachaResult = skill;
    gachaAnimation.active = true;
    gachaAnimation.timer = 0;
}

/**
 * 뽑기 애니메이션 업데이트
 * @param {number} deltaTime - 프레임 간격
 */
export function updateGachaAnimation(deltaTime) {
    if (gachaAnimation.active) {
        gachaAnimation.timer += deltaTime;
        
        if (gachaAnimation.timer >= gachaAnimation.duration) {
            gachaAnimation.active = false;
            gachaResult = null;
        }
    }
}

/**
 * 뽑기 애니메이션 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function renderGachaAnimation(ctx, canvasWidth, canvasHeight) {
    if (!gachaAnimation.active || !gachaResult) return;
    
    const progress = gachaAnimation.timer / gachaAnimation.duration;
    const alpha = Math.sin(progress * Math.PI); // 사인 곡선으로 부드러운 페이드
    
    // 반투명 배경
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 결과 박스
    const boxWidth = 400;
    const boxHeight = 200;
    const boxX = canvasWidth/2 - boxWidth/2;
    const boxY = canvasHeight/2 - boxHeight/2;
    
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;  // 골드 배경
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = `rgba(255, 165, 0, ${alpha})`;  // 오렌지 테두리
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // 텍스트
    const skillNames = {
        'j': 'J-실드 스킬',
        'k': 'K-슬로우 스킬',
        'l': 'L-스톱 스킬'
    };
    
    ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;  // 갈색 텍스트
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 축하합니다! 🎉', canvasWidth/2, boxY + 50);
    
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = `rgba(0, 100, 0, ${alpha})`;  // 녹색 텍스트
    ctx.fillText(skillNames[gachaResult], canvasWidth/2, boxY + 100);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
    ctx.fillText('새로운 스킬을 획득했습니다!', canvasWidth/2, boxY + 140);
    
    ctx.restore();
    ctx.textAlign = 'left';  // 텍스트 정렬 리셋
}

/**
 * 상점 클릭 처리
 * @param {number} mouseX - 마우스 X 좌표
 * @param {number} mouseY - 마우스 Y 좌표
 * @param {number} canvasWidth - 캔버스 너비
 * @returns {boolean} - 클릭 처리 여부
 */
export function handleShopClick(mouseX, mouseY, canvasWidth) {
    // 뽑기 박스 영역 (ui.js의 renderShopScreen과 동일한 좌표)
    const boxWidth = 200;
    const boxHeight = 150;
    const boxX = canvasWidth/2 - boxWidth/2;
    const boxY = 200;
    
    // 뽑기 박스 클릭 체크
    if (mouseX >= boxX && mouseX <= boxX + boxWidth && 
        mouseY >= boxY && mouseY <= boxY + boxHeight) {
        
        const result = performSkillGacha();
        console.log('뽑기 결과:', result.message);
        return true;
    }
    
    return false;
}

/**
 * 뽑기 애니메이션 활성 상태 반환
 * @returns {boolean} - 애니메이션 활성 여부
 */
export function isGachaAnimationActive() {
    return gachaAnimation.active;
} 