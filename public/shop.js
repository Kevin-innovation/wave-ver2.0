/**
 * 상점 & 뽑기 시스템
 */

import { getCoins, spendCoins, isSkillUnlocked, unlockSkill } from './economy.js';
import { recordGachaPull } from './achievements.js';
import { getCurrentUserInfo } from './auth.js';

// ==================== 상점 설정 ====================
export const SHOP_CONFIG = {
    skillGachaPrice: 300,   // 스킬 뽑기 가격 (10 → 300)
    guideGachaPrice: 500,   // 업적 가이드 뽑기 가격
    maxSkills: 3            // 최대 스킬 수 (J, K, L)
};

// ==================== 업적 해금방법 데이터베이스 ====================
const ACHIEVEMENT_GUIDES = {
    'first_play': {
        id: 'first_play',
        title: '🎮 첫 걸음',
        guide: '게임을 한 번만 시작하면 즉시 달성! (보상: 10코인)'
    },
    'time_5min': {
        id: 'time_5min',
        title: '⏰ 시간 여행자',
        guide: '총 5분간 플레이하세요. 여러 번 나누어서 플레이해도 됩니다! (보상: 25코인)'
    },
    'time_30min': {
        id: 'time_30min',
        title: '🕐 열정적인 플레이어',
        guide: '총 30분간 플레이하세요. 누적 시간으로 계산됩니다! (보상: 50코인)'
    },
    'time_2hour': {
        id: 'time_2hour',
        title: '⌚ 웨이브 마스터',
        guide: '총 2시간간 플레이하세요. 장기간 즐기는 진정한 마스터! (보상: 100코인)'
    },
    'time_10hour': {
        id: 'time_10hour',
        title: '🏆 생존 전문가',
        guide: '총 10시간간 플레이하세요. 최고 등급 시간 업적! (보상: 200코인)'
    },
    'monster_100': {
        id: 'monster_100',
        title: '👻 회피 초보자',
        guide: '몬스터 100마리를 피하세요. 몬스터가 화면 밖으로 나가면 카운트! (보상: 20코인)'
    },
    'monster_500': {
        id: 'monster_500',
        title: '💨 날쌘돌이',
        guide: '몬스터 500마리를 피하세요. 빠른 움직임이 핵심입니다! (보상: 50코인)'
    },
    'monster_2000': {
        id: 'monster_2000',
        title: '🌪️ 회피의 달인',
        guide: '몬스터 2000마리를 피하세요. 숙련된 회피 기술이 필요! (보상: 100코인)'
    },
    'monster_10000': {
        id: 'monster_10000',
        title: '⚡ 불가능한 회피',
        guide: '몬스터 10000마리를 피하세요. 전설적인 회피 실력! (보상: 300코인)'
    },
    'coin_100': {
        id: 'coin_100',
        title: '🪙 동전 수집가',
        guide: '코인 100개를 모으세요. 몬스터를 피할 때마다 코인 획득! (보상: 15코인)'
    },
    'coin_1000': {
        id: 'coin_1000',
        title: '💰 부자의 꿈',
        guide: '코인 1000개를 모으세요. 꾸준한 플레이가 중요합니다! (보상: 50코인)'
    },
    'coin_5000': {
        id: 'coin_5000',
        title: '💎 황금 수집가',
        guide: '코인 5000개를 모으세요. 진정한 부의 축적자! (보상: 150코인)'
    },
    'coin_20000': {
        id: 'coin_20000',
        title: '👑 코인 황제',
        guide: '코인 20000개를 모으세요. 경제의 제왕이 되어보세요! (보상: 400코인)'
    },
    'wave_10': {
        id: 'wave_10',
        title: '🌊 생존자',
        guide: '웨이브 10에 도달하세요. 주황색 몬스터가 등장합니다! (보상: 30코인)'
    },
    'wave_25': {
        id: 'wave_25',
        title: '⚔️ 웨이브 전사',
        guide: '웨이브 25에 도달하세요. 다양한 몬스터 패턴을 익히세요! (보상: 75코인)'
    },
    'wave_50': {
        id: 'wave_50',
        title: '🛡️ 불굴의 의지',
        guide: '웨이브 50에 도달하세요. 스킬 조합이 생존의 열쇠! (보상: 150코인)'
    },
    'wave_100': {
        id: 'wave_100',
        title: '⭐ 전설의 생존자',
        guide: '웨이브 100에 도달하세요. 모든 스킬과 업그레이드가 필요! (보상: 300코인)'
    },
    'wave_200': {
        id: 'wave_200',
        title: '🌟 신화의 영역',
        guide: '웨이브 200에 도달하세요. 최고 난이도 생존 도전! (보상: 500코인)'
    },
    'skill_master': {
        id: 'skill_master',
        title: '🎯 스킬 마스터',
        guide: 'H,J,K,L 모든 스킬을 각각 100번씩 사용하세요. 균형잡힌 플레이가 중요! (보상: 200코인)'
    },
    'upgrade_10': {
        id: 'upgrade_10',
        title: '📈 성장하는 플레이어',
        guide: '업그레이드를 10번 구매하세요. 3번 탭에서 스킬을 강화하세요! (보상: 50코인)'
    },
    'gacha_20': {
        id: 'gacha_20',
        title: '🎰 운명의 도박사',
        guide: '뽑기를 20번 시도하세요. 스킬 뽑기와 가이드 뽑기 모두 포함! (보상: 75코인)'
    },
    'orange_encounter': {
        id: 'orange_encounter',
        title: '🟠 주황색 위협',
        guide: '웨이브 10에 도달하여 주황색 몬스터를 만나세요. 더 빠르고 위험합니다! (보상: 40코인)'
    },
    'diversity_master': {
        id: 'diversity_master',
        title: '🎨 다양성의 마스터',
        guide: '웨이브 15에 도달하여 다양한 몬스터와 대면하세요. 패턴을 익히세요! (보상: 80코인)'
    },
    'speed_survivor': {
        id: 'speed_survivor',
        title: '⚡ 속도의 생존자',
        guide: '웨이브 20에 도달하여 빠른 몬스터들을 견뎌내세요. 반응속도가 관건! (보상: 120코인)'
    },
    'perfectionist': {
        id: 'perfectionist',
        title: '💎 완벽주의자',
        guide: '한 번도 죽지 않고 웨이브 20에 도달하세요. 완벽한 플레이 필요! (보상: 250코인)'
    },
    'speedrun': {
        id: 'speedrun',
        title: '🏃 스피드 러너',
        guide: '5분 안에 웨이브 15에 도달하세요. 빠른 진행과 효율적인 플레이! (보상: 150코인)'
    },
    'consecutive_wins': {
        id: 'consecutive_wins',
        title: '🔥 연승 챔피언',
        guide: '10번 연속으로 웨이브 5 이상에 도달하세요. 꾸준한 실력이 필요! (보상: 120코인)'
    }
};

// ==================== 뽑기 상태 관리 ====================
let gachaResult = null;
let gachaAnimation = {
    active: false,
    timer: 0,
    duration: 2000  // 2초 애니메이션
};

let guideGachaResult = null;
let guideGachaAnimation = {
    active: false,
    timer: 0,
    duration: 3000  // 3초 애니메이션 (텍스트가 길어서)
};

// ==================== 해금된 업적 가이드 관리 ====================
let unlockedGuides = new Set();

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
 * 해금된 가이드 로드
 */
function loadUnlockedGuides() {
    try {
        const storageKey = getUserStorageKey('wave-ver2-guides');
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsedData = JSON.parse(saved);
            unlockedGuides = new Set(parsedData);
            console.log('해금된 가이드 로드 완료:', unlockedGuides);
        }
    } catch (error) {
        console.error('해금된 가이드 로드 실패:', error);
        unlockedGuides = new Set();
    }
}

/**
 * 해금된 가이드 저장
 */
function saveUnlockedGuides() {
    try {
        const storageKey = getUserStorageKey('wave-ver2-guides');
        localStorage.setItem(storageKey, JSON.stringify([...unlockedGuides]));
        console.log('해금된 가이드 저장 완료');
    } catch (error) {
        console.error('해금된 가이드 저장 실패:', error);
    }
}

/**
 * 초기화 함수 (게임 시작 시 호출)
 */
export function initShopSystem() {
    loadUnlockedGuides();
}

/**
 * 해금되지 않은 가이드 목록 반환
 * @returns {Array} - 잠긴 가이드 ID 배열
 */
function getLockedGuides() {
    const allGuideIds = Object.keys(ACHIEVEMENT_GUIDES);
    return allGuideIds.filter(id => !unlockedGuides.has(id));
}

/**
 * 업적 가이드 뽑기 가능 여부 확인
 * @returns {Object} - {canGacha: boolean, reason: string}
 */
export function canPerformGuideGacha() {
    const coins = getCoins();
    
    // 코인 부족
    if (coins < SHOP_CONFIG.guideGachaPrice) {
        return {
            canGacha: false,
            reason: `코인이 부족합니다! (${coins}/${SHOP_CONFIG.guideGachaPrice})`
        };
    }
    
    // 모든 가이드 이미 보유
    const lockedGuides = getLockedGuides();
    if (lockedGuides.length === 0) {
        return {
            canGacha: false,
            reason: '모든 업적 가이드를 이미 해금했습니다!'
        };
    }
    
    return {
        canGacha: true,
        reason: '가이드 뽑기 가능!'
    };
}

/**
 * 업적 가이드 뽑기 실행
 * @returns {Object} - {success: boolean, guide: Object, message: string}
 */
export function performGuideGacha() {
    const gachaCheck = canPerformGuideGacha();
    
    if (!gachaCheck.canGacha) {
        return {
            success: false,
            guide: null,
            message: gachaCheck.reason
        };
    }
    
    // 코인 소모
    const spendResult = spendCoins(SHOP_CONFIG.guideGachaPrice);
    if (!spendResult.success) {
        return {
            success: false,
            guide: null,
            message: spendResult.message
        };
    }
    
    // 랜덤 가이드 선택
    const lockedGuides = getLockedGuides();
    const randomIndex = Math.floor(Math.random() * lockedGuides.length);
    const selectedGuideId = lockedGuides[randomIndex];
    const selectedGuide = ACHIEVEMENT_GUIDES[selectedGuideId];
    
    // 가이드 해금
    unlockedGuides.add(selectedGuideId);
    saveUnlockedGuides();
    
    // 도전과제 통계 기록 (뽑기 횟수)
    recordGachaPull(); // 비동기 처리 (백그라운드)
    
    // 애니메이션 시작
    startGuideGachaAnimation(selectedGuide);
    
    console.log(`🎉 가이드 획득! ${selectedGuide.title}`);
    
    return {
        success: true,
        guide: selectedGuide,
        message: `🎉 ${selectedGuide.title} 해금방법 획득!`
    };
}

/**
 * 가이드 뽑기 애니메이션 시작
 * @param {Object} guide - 획득한 가이드
 */
function startGuideGachaAnimation(guide) {
    guideGachaResult = guide;
    guideGachaAnimation.active = true;
    guideGachaAnimation.timer = 0;
}

/**
 * 해금된 가이드 목록 반환
 * @returns {Array} - 해금된 가이드 객체 배열
 */
export function getUnlockedGuides() {
    return [...unlockedGuides].map(id => ACHIEVEMENT_GUIDES[id]).filter(guide => guide);
}

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
    
            // 도전과제 통계 기록
        recordGachaPull(); // 비동기 처리 (백그라운드)
    
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
    // 스킬 뽑기 애니메이션
    if (gachaAnimation.active) {
        gachaAnimation.timer += deltaTime;
        
        if (gachaAnimation.timer >= gachaAnimation.duration) {
            gachaAnimation.active = false;
            gachaResult = null;
        }
    }
    
    // 가이드 뽑기 애니메이션
    if (guideGachaAnimation.active) {
        guideGachaAnimation.timer += deltaTime;
        
        if (guideGachaAnimation.timer >= guideGachaAnimation.duration) {
            guideGachaAnimation.active = false;
            guideGachaResult = null;
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
    // 스킬 뽑기 애니메이션
    if (gachaAnimation.active && gachaResult) {
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
    
    // 가이드 뽑기 애니메이션
    if (guideGachaAnimation.active && guideGachaResult) {
        const progress = guideGachaAnimation.timer / guideGachaAnimation.duration;
        const alpha = Math.sin(progress * Math.PI); // 사인 곡선으로 부드러운 페이드
        
        // 반투명 배경
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 결과 박스 (더 큰 크기)
        const boxWidth = 550;
        const boxHeight = 300;
        const boxX = canvasWidth/2 - boxWidth/2;
        const boxY = canvasHeight/2 - boxHeight/2;
        
        ctx.fillStyle = `rgba(138, 43, 226, ${alpha})`;  // 보라색 배경
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = `rgba(75, 0, 130, ${alpha})`;  // 인디고 테두리
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // 텍스트
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;  // 하얀색 텍스트
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔮 비밀이 밝혀졌습니다! 🔮', canvasWidth/2, boxY + 40);
        
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;  // 골드 텍스트
        ctx.fillText(guideGachaResult.title, canvasWidth/2, boxY + 80);
        
        // 가이드 텍스트를 줄바꿈하여 표시
        ctx.font = '16px Arial';
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        const guideText = guideGachaResult.guide;
        const maxWidth = boxWidth - 40;
        const words = guideText.split(' ');
        let line = '';
        let y = boxY + 120;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(line, canvasWidth/2, y);
                line = words[i] + ' ';
                y += 20;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, canvasWidth/2, y);
        
        ctx.restore();
        ctx.textAlign = 'left';  // 텍스트 정렬 리셋
    }
}

/**
 * 상점 클릭 처리
 * @param {number} mouseX - 마우스 X 좌표
 * @param {number} mouseY - 마우스 Y 좌표
 * @param {number} canvasWidth - 캔버스 너비
 * @returns {boolean} - 클릭 처리 여부
 */
export function handleShopClick(mouseX, mouseY, canvasWidth) {
    // 스킬 뽑기 박스 영역 (ui.js의 renderShopScreen과 동일한 좌표)
    const boxWidth = 200;
    const boxHeight = 150;
    const boxX = canvasWidth/2 - boxWidth/2;
    const boxY = 200;
    
    // 스킬 뽑기 박스 클릭 체크
    if (mouseX >= boxX && mouseX <= boxX + boxWidth && 
        mouseY >= boxY && mouseY <= boxY + boxHeight) {
        
        const result = performSkillGacha();
        console.log('스킬 뽑기 결과:', result.message);
        return true;
    }
    
    // 가이드 뽑기 박스 영역 (스킬 뽑기 아래)
    const guideBoxY = boxY + boxHeight + 20;
    
    // 가이드 뽑기 박스 클릭 체크
    if (mouseX >= boxX && mouseX <= boxX + boxWidth && 
        mouseY >= guideBoxY && mouseY <= guideBoxY + boxHeight) {
        
        const result = performGuideGacha();
        console.log('가이드 뽑기 결과:', result.message);
        return true;
    }
    
    return false;
}

/**
 * 뽑기 애니메이션 활성 상태 반환
 * @returns {boolean} - 애니메이션 활성 여부
 */
export function isGachaAnimationActive() {
    return gachaAnimation.active || guideGachaAnimation.active;
} 