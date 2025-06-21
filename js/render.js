/**
 * 렌더링 및 UI 시스템
 */

import { renderPlayer } from './player.js';
import { renderMonsters } from './monster.js';
import { renderSkillUI } from './skills.js';
import { GAME_STATES } from './utils.js';

/**
 * 메인 렌더링 함수
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 * @param {Object} gameState - 게임 상태
 * @param {Object} gameData - 게임 데이터 (웨이브, 점수 등)
 * @param {Object} skills - 스킬 상태
 */
export function renderGame(ctx, canvasWidth, canvasHeight, gameState, gameData, skills) {
    // 화면 지우기
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (gameState.current === GAME_STATES.PLAYING) {
        // 플레이어 렌더링
        renderPlayer(ctx, skills);
        
        // 몬스터 렌더링
        renderMonsters(ctx, skills);
        
        // 게임 정보 UI 렌더링
        renderGameUI(ctx, gameData);
        
        // 스킬 UI 렌더링
        renderSkillUI(ctx);
        
    } else if (gameState.current === GAME_STATES.GAME_OVER) {
        // 게임 오버 화면 렌더링
        renderGameOverScreen(ctx, canvasWidth, canvasHeight, gameData);
    }
}

/**
 * 게임 정보 UI 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {Object} gameData - 게임 데이터
 */
function renderGameUI(ctx, gameData) {
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    
    // 각종 게임 정보 텍스트 출력
    ctx.fillText(`Wave: ${gameData.currentWave}`, 10, 30);
    ctx.fillText(`Active: ${gameData.activeMonsters}`, 10, 60);
    ctx.fillText(`Avoided: ${gameData.monstersAvoided}`, 10, 90);
    ctx.fillText(`Speed: ${(3.2 + (gameData.currentWave - 1) * 0.3).toFixed(1)}`, 10, 120);
}

/**
 * 게임 오버 화면 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 * @param {Object} gameData - 게임 데이터
 */
function renderGameOverScreen(ctx, canvasWidth, canvasHeight, gameData) {
    // 반투명 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 게임 오버 텍스트
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 60);

    // 결과 텍스트
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Arial';
    ctx.fillText(`Reached Wave: ${gameData.currentWave}`, canvasWidth / 2, canvasHeight / 2);
    ctx.fillText(`Monsters Avoided: ${gameData.monstersAvoided}`, canvasWidth / 2, canvasHeight / 2 + 40);

    // 재시작 안내
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '24px Arial';
    ctx.fillText("Press 'R' to Restart", canvasWidth / 2, canvasHeight / 2 + 100);

    // 텍스트 정렬 초기화
    ctx.textAlign = 'left';
} 