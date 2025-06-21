/**
 * wave-ver2.0 - 메인 게임 로직
 * 
 * 게임 설명:
 * - 플레이어는 파란색 사각형으로 방향키 또는 WASD로 조작
 * - 빨간색 몬스터들이 화면 가장자리에서 플레이어를 향해 돌진
 * - 몬스터와 충돌하면 게임 오버
 * - 몬스터가 화면 밖으로 나가면 피하기 성공
 * - 웨이브가 올라갈수록 몬스터 개수와 속도가 증가
 */

import { GAME_STATES, checkCollision } from './utils.js';
import { player, resetPlayer, updatePlayerMovement } from './player.js';
import { monsters, resetMonsters, updateMonsters, spawnWaveMonsters, getActiveMonsterCount } from './monster.js';
import { skills, resetSkills, updateSkills, handleSkillInputs } from './skills.js';
import { keys, setupInputListeners } from './input.js';
import { renderGame } from './render.js';
import { initEconomy, updateBestScore } from './economy.js';
import { initUpgradeSystem } from './upgrade.js';
import { updateSkillConfig } from './skills.js';
import './ui.js';  // UI 모듈 로드
import './shop.js';  // 상점 모듈 로드

// ==================== 게임 변수 ====================
export const gameState = {
    current: GAME_STATES.PLAYING
};

export const gameData = {
    currentWave: 1,
    activeMonsters: 0,
    monstersAvoided: 0,
    monstersPerWave: 5,  // Wave 1부터 5개 시작
    waveStarted: false
};

// ==================== 캔버스 설정 ====================
let canvas, ctx;

/**
 * 게임 초기화 함수
 */
export function initGame() {
    // 캔버스 및 컨텍스트 설정
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 경제 시스템 초기화 (코인 등)
    initEconomy();
    
    // 업그레이드 시스템 초기화
    initUpgradeSystem();
    
    // 스킬 설정 업데이트 (업그레이드 반영)
    updateSkillConfig();
    
    // 키보드 이벤트 리스너 설정
    setupInputListeners(gameState, canvas);
    
    // 게임 루프 시작
    gameLoop();
    
    // 캔버스에 포커스 설정 (키보드 입력을 받기 위해)
    canvas.focus();
}

/**
 * 게임 초기화 함수
 */
export function resetGame() {
    // 게임 변수 초기화
    gameData.currentWave = 1;
    gameData.activeMonsters = 0;
    gameData.monstersAvoided = 0;
    gameData.monstersPerWave = 5;  // Wave 1부터 5개 시작
    gameState.current = GAME_STATES.PLAYING;
    gameData.waveStarted = false;

    // 게임 객체들 초기화
    resetPlayer();
    resetMonsters();
    resetSkills();
}

/**
 * 게임 로직 업데이트 함수
 */
function updateGame() {
    if (gameState.current === GAME_STATES.PLAYING) {
        
        // ==================== 플레이어 입력 처리 ====================
        updatePlayerMovement(keys, canvas.width, canvas.height);

        // ==================== 스킬 사용 처리 ====================
        handleSkillInputs(keys, canvas.width, canvas.height);

        // ==================== 스킬 상태 업데이트 ====================
        updateSkills();

        // ==================== 몬스터 생성 시스템 ====================
        if (!gameData.waveStarted) {
            const spawned = spawnWaveMonsters(gameData.monstersPerWave, gameData.currentWave, skills);
            gameData.activeMonsters += spawned;
            gameData.waveStarted = true;
        }

        // ==================== 몬스터 이동 및 충돌 검사 ====================
        const { monstersRemoved } = updateMonsters(skills);
        gameData.activeMonsters -= monstersRemoved;
        gameData.monstersAvoided += monstersRemoved;

        // 플레이어와 몬스터 충돌 검사
        if (checkPlayerMonsterCollisions()) {
            // 게임 오버 시 최고 기록 업데이트
            updateBestScore(gameData.currentWave);
            gameState.current = GAME_STATES.GAME_OVER;
        }

        // ==================== 웨이브 클리어 검사 ====================
        if (gameData.waveStarted && gameData.activeMonsters === 0) {
            gameData.currentWave++;
            gameData.monstersPerWave++;
            gameData.waveStarted = false;
        }
    }
}

/**
 * 플레이어와 몬스터 충돌 검사
 * @returns {boolean} - 충돌 발생 여부
 */
function checkPlayerMonsterCollisions() {
    // 실드 활성화 시 충돌 무시
    if (skills.shield.active) return false;
    
    for (let i = 0; i < monsters.length; i++) {
        if (monsters[i].active) {
            if (checkCollision(player, monsters[i])) {
                return true;
            }
        }
    }
    return false;
}

/**
 * 메인 게임 루프
 */
function gameLoop() {
    updateGame();
    renderGame(ctx, canvas.width, canvas.height, gameState, gameData, skills);
    
    // 60FPS로 다음 프레임 요청
    requestAnimationFrame(gameLoop);
}

// 게임 시작 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    initGame();
}); 