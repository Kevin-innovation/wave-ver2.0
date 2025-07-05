/**
 * 도전과제 시스템
 * - 플레이어의 다양한 업적을 추적하고 관리
 * - 로컬스토리지를 통한 데이터 영구 저장
 * - 등급별 액자 디자인으로 수집 재미 제공
 */

// ==================== 업적 등급 정의 ====================
export const ACHIEVEMENT_TIERS = {
    BRONZE: 'bronze',
    SILVER: 'silver', 
    GOLD: 'gold',
    PLATINUM: 'platinum',
    DIAMOND: 'diamond'
};

// ==================== 통계 데이터 구조 ====================
let playerStats = {
    totalPlayTime: 0,           // 총 플레이 시간 (초)
    totalMonstersAvoided: 0,    // 총 피한 몬스터 수
    totalCoinsEarned: 0,        // 총 획득 코인 수
    highestWave: 0,             // 최고 웨이브 기록
    totalGamesPlayed: 0,        // 총 게임 플레이 횟수
    totalDeaths: 0,             // 총 사망 횟수
    skillsUsed: {               // 스킬 사용 횟수
        dash: 0,
        shield: 0,
        slow: 0,
        stop: 0
    },
    upgradesPurchased: 0,       // 업그레이드 구매 횟수
    gachaPulls: 0,             // 뽑기 횟수
    consecutiveWins: 0,         // 연속 생존 기록
    currentSession: {           // 현재 세션 데이터
        startTime: 0,
        monstersAvoided: 0,
        coinsEarned: 0
    }
};

// ==================== 업적 정의 ====================
export const ACHIEVEMENTS = {
    // 플레이 타임 관련
    'first_play': {
        id: 'first_play',
        name: '첫 걸음',
        description: '첫 번째 게임을 시작하세요',
        tier: ACHIEVEMENT_TIERS.BRONZE,
        icon: '🎮',
        condition: () => playerStats.totalGamesPlayed >= 1,
        reward: 10
    },
    'time_5min': {
        id: 'time_5min',
        name: '시간 여행자',
        description: '총 5분간 플레이하세요',
        tier: ACHIEVEMENT_TIERS.BRONZE,
        icon: '⏰',
        condition: () => playerStats.totalPlayTime >= 300,
        reward: 25
    },
    'time_30min': {
        id: 'time_30min',
        name: '열정적인 플레이어',
        description: '총 30분간 플레이하세요',
        tier: ACHIEVEMENT_TIERS.SILVER,
        icon: '🕐',
        condition: () => playerStats.totalPlayTime >= 1800,
        reward: 50
    },
    'time_2hour': {
        id: 'time_2hour',
        name: '웨이브 마스터',
        description: '총 2시간간 플레이하세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '⌚',
        condition: () => playerStats.totalPlayTime >= 7200,
        reward: 100
    },
    'time_10hour': {
        id: 'time_10hour',
        name: '생존 전문가',
        description: '총 10시간간 플레이하세요',
        tier: ACHIEVEMENT_TIERS.PLATINUM,
        icon: '🏆',
        condition: () => playerStats.totalPlayTime >= 36000,
        reward: 200
    },

    // 몬스터 회피 관련
    'monster_100': {
        id: 'monster_100',
        name: '회피 초보자',
        description: '몬스터 100마리를 피하세요',
        tier: ACHIEVEMENT_TIERS.BRONZE,
        icon: '👻',
        condition: () => playerStats.totalMonstersAvoided >= 100,
        reward: 20
    },
    'monster_500': {
        id: 'monster_500',
        name: '날쌘돌이',
        description: '몬스터 500마리를 피하세요',
        tier: ACHIEVEMENT_TIERS.SILVER,
        icon: '💨',
        condition: () => playerStats.totalMonstersAvoided >= 500,
        reward: 50
    },
    'monster_2000': {
        id: 'monster_2000',
        name: '회피의 달인',
        description: '몬스터 2000마리를 피하세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '🌪️',
        condition: () => playerStats.totalMonstersAvoided >= 2000,
        reward: 100
    },
    'monster_10000': {
        id: 'monster_10000',
        name: '불가능한 회피',
        description: '몬스터 10000마리를 피하세요',
        tier: ACHIEVEMENT_TIERS.DIAMOND,
        icon: '⚡',
        condition: () => playerStats.totalMonstersAvoided >= 10000,
        reward: 300
    },

    // 코인 수집 관련
    'coin_100': {
        id: 'coin_100',
        name: '동전 수집가',
        description: '코인 100개를 모으세요',
        tier: ACHIEVEMENT_TIERS.BRONZE,
        icon: '🪙',
        condition: () => playerStats.totalCoinsEarned >= 100,
        reward: 15
    },
    'coin_1000': {
        id: 'coin_1000',
        name: '부자의 꿈',
        description: '코인 1000개를 모으세요',
        tier: ACHIEVEMENT_TIERS.SILVER,
        icon: '💰',
        condition: () => playerStats.totalCoinsEarned >= 1000,
        reward: 50
    },
    'coin_5000': {
        id: 'coin_5000',
        name: '황금 수집가',
        description: '코인 5000개를 모으세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '💎',
        condition: () => playerStats.totalCoinsEarned >= 5000,
        reward: 150
    },
    'coin_20000': {
        id: 'coin_20000',
        name: '코인 황제',
        description: '코인 20000개를 모으세요',
        tier: ACHIEVEMENT_TIERS.DIAMOND,
        icon: '👑',
        condition: () => playerStats.totalCoinsEarned >= 20000,
        reward: 400
    },

    // 웨이브 관련
    'wave_10': {
        id: 'wave_10',
        name: '생존자',
        description: '웨이브 10에 도달하세요',
        tier: ACHIEVEMENT_TIERS.BRONZE,
        icon: '🌊',
        condition: () => playerStats.highestWave >= 10,
        reward: 30
    },
    'wave_25': {
        id: 'wave_25',
        name: '웨이브 전사',
        description: '웨이브 25에 도달하세요',
        tier: ACHIEVEMENT_TIERS.SILVER,
        icon: '⚔️',
        condition: () => playerStats.highestWave >= 25,
        reward: 75
    },
    'wave_50': {
        id: 'wave_50',
        name: '불굴의 의지',
        description: '웨이브 50에 도달하세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '🛡️',
        condition: () => playerStats.highestWave >= 50,
        reward: 150
    },
    'wave_100': {
        id: 'wave_100',
        name: '전설의 생존자',
        description: '웨이브 100에 도달하세요',
        tier: ACHIEVEMENT_TIERS.PLATINUM,
        icon: '⭐',
        condition: () => playerStats.highestWave >= 100,
        reward: 300
    },
    'wave_200': {
        id: 'wave_200',
        name: '신화의 영역',
        description: '웨이브 200에 도달하세요',
        tier: ACHIEVEMENT_TIERS.DIAMOND,
        icon: '🌟',
        condition: () => playerStats.highestWave >= 200,
        reward: 500
    },

    // 스킬 관련
    'skill_master': {
        id: 'skill_master',
        name: '스킬 마스터',
        description: '모든 스킬을 100번씩 사용하세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '🎯',
        condition: () => Object.values(playerStats.skillsUsed).every(count => count >= 100),
        reward: 200
    },
    'upgrade_10': {
        id: 'upgrade_10',
        name: '성장하는 플레이어',
        description: '업그레이드를 10번 구매하세요',
        tier: ACHIEVEMENT_TIERS.SILVER,
        icon: '📈',
        condition: () => playerStats.upgradesPurchased >= 10,
        reward: 50
    },
    'gacha_20': {
        id: 'gacha_20',
        name: '운명의 도박사',
        description: '뽑기를 20번 시도하세요',
        tier: ACHIEVEMENT_TIERS.SILVER,
        icon: '🎰',
        condition: () => playerStats.gachaPulls >= 20,
        reward: 75
    },

    // 몬스터 타입 관련
    'orange_encounter': {
        id: 'orange_encounter',
        name: '주황색 위협',
        description: '웨이브 10에 도달하여 주황색 몬스터를 만나세요',
        tier: ACHIEVEMENT_TIERS.SILVER,
        icon: '🟠',
        condition: () => playerStats.highestWave >= 10,
        reward: 40
    },
    'diversity_master': {
        id: 'diversity_master',
        name: '다양성의 마스터',
        description: '웨이브 15에 도달하여 다양한 몬스터와 대면하세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '🎨',
        condition: () => playerStats.highestWave >= 15,
        reward: 80
    },
    'speed_survivor': {
        id: 'speed_survivor',
        name: '속도의 생존자',
        description: '웨이브 20에 도달하여 빠른 몬스터들을 견뎌내세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '⚡',
        condition: () => playerStats.highestWave >= 20,
        reward: 120
    },

    // 특수 업적
    'perfectionist': {
        id: 'perfectionist',
        name: '완벽주의자',
        description: '한 번도 죽지 않고 웨이브 20에 도달하세요',
        tier: ACHIEVEMENT_TIERS.PLATINUM,
        icon: '💎',
        condition: () => playerStats.highestWave >= 20 && playerStats.totalDeaths === 0,
        reward: 250
    },
    'speedrun': {
        id: 'speedrun',
        name: '스피드 러너',
        description: '5분 안에 웨이브 15에 도달하세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '🏃',
        condition: () => checkSpeedrunCondition(),
        reward: 150
    },
    'consecutive_wins': {
        id: 'consecutive_wins',
        name: '연승 챔피언',
        description: '10번 연속으로 웨이브 5 이상에 도달하세요',
        tier: ACHIEVEMENT_TIERS.GOLD,
        icon: '🔥',
        condition: () => playerStats.consecutiveWins >= 10,
        reward: 120
    }
};

// ==================== 달성한 업적 관리 ====================
let unlockedAchievements = new Set();

/**
 * 플레이어 통계 데이터 로드
 */
export function loadPlayerStats() {
    try {
        const saved = localStorage.getItem('wave-ver2-player-stats');
        if (saved) {
            const parsedStats = JSON.parse(saved);
            playerStats = { ...playerStats, ...parsedStats };
        }
        
        const savedAchievements = localStorage.getItem('wave-ver2-achievements');
        if (savedAchievements) {
            unlockedAchievements = new Set(JSON.parse(savedAchievements));
        }
        
        console.log('플레이어 통계 및 업적 데이터 로드 완료');
    } catch (error) {
        console.error('플레이어 데이터 로드 실패:', error);
    }
}

/**
 * 플레이어 통계 데이터 저장
 */
export function savePlayerStats() {
    try {
        localStorage.setItem('wave-ver2-player-stats', JSON.stringify(playerStats));
        localStorage.setItem('wave-ver2-achievements', JSON.stringify([...unlockedAchievements]));
    } catch (error) {
        console.error('플레이어 데이터 저장 실패:', error);
    }
}

/**
 * 게임 시작 시 세션 데이터 초기화
 */
export function startGameSession() {
    playerStats.currentSession = {
        startTime: Date.now(),
        monstersAvoided: 0,
        coinsEarned: 0
    };
    playerStats.totalGamesPlayed++;
    savePlayerStats();
}

/**
 * 게임 종료 시 통계 업데이트
 * @param {number} wave - 도달한 웨이브
 * @param {number} monstersAvoided - 피한 몬스터 수
 * @param {number} coinsEarned - 획득한 코인 수
 */
export function endGameSession(wave, monstersAvoided, coinsEarned) {
    const sessionTime = Math.floor((Date.now() - playerStats.currentSession.startTime) / 1000);
    
    // 통계 업데이트
    playerStats.totalPlayTime += sessionTime;
    playerStats.totalMonstersAvoided += monstersAvoided;
    playerStats.totalCoinsEarned += coinsEarned;
    
    if (wave > playerStats.highestWave) {
        playerStats.highestWave = wave;
    }
    
    if (wave < 5) {
        playerStats.consecutiveWins = 0;
    } else {
        playerStats.consecutiveWins++;
    }
    
    playerStats.totalDeaths++;
    
    savePlayerStats();
    checkAchievements();
}

/**
 * 스킬 사용 통계 업데이트
 * @param {string} skillType - 스킬 타입 ('dash', 'shield', 'slow', 'stop')
 */
export function recordSkillUse(skillType) {
    if (playerStats.skillsUsed[skillType] !== undefined) {
        playerStats.skillsUsed[skillType]++;
        savePlayerStats();
    }
}

/**
 * 업그레이드 구매 통계 업데이트
 */
export function recordUpgradePurchase() {
    playerStats.upgradesPurchased++;
    savePlayerStats();
    checkAchievements();
}

/**
 * 뽑기 통계 업데이트
 */
export function recordGachaPull() {
    playerStats.gachaPulls++;
    savePlayerStats();
    checkAchievements();
}

/**
 * 업적 달성 체크
 */
export function checkAchievements() {
    const newAchievements = [];
    
    for (const achievement of Object.values(ACHIEVEMENTS)) {
        if (!unlockedAchievements.has(achievement.id) && achievement.condition()) {
            unlockedAchievements.add(achievement.id);
            newAchievements.push(achievement);
        }
    }
    
    if (newAchievements.length > 0) {
        savePlayerStats();
        showAchievementNotification(newAchievements);
    }
}

/**
 * 업적 달성 알림 표시
 * @param {Array} achievements - 달성한 업적 배열
 */
function showAchievementNotification(achievements) {
    achievements.forEach(achievement => {
        console.log(`🏆 업적 달성! "${achievement.name}" - ${achievement.description}`);
        // TODO: UI 알림 추가
    });
}

/**
 * 스피드런 조건 체크 (별도 함수로 분리)
 */
function checkSpeedrunCondition() {
    // 현재 세션에서 15웨이브를 5분 내에 달성했는지 체크
    if (playerStats.highestWave >= 15 && playerStats.currentSession.startTime > 0) {
        const sessionTime = (Date.now() - playerStats.currentSession.startTime) / 1000;
        return sessionTime <= 300; // 5분 = 300초
    }
    return false;
}

/**
 * 플레이어 통계 반환
 */
export function getPlayerStats() {
    return { ...playerStats };
}

/**
 * 달성한 업적 목록 반환
 */
export function getUnlockedAchievements() {
    return [...unlockedAchievements];
}

/**
 * 업적 진행도 계산
 */
export function getAchievementProgress() {
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = unlockedAchievements.size;
    return { unlocked, total, percentage: Math.floor((unlocked / total) * 100) };
}

/**
 * 도전과제 시스템 초기화
 */
export function initAchievementSystem() {
    loadPlayerStats();
    console.log('도전과제 시스템 초기화 완료');
} 