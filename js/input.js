/**
 * 키보드 입력 처리 시스템
 */

import { resetGame } from './game.js';
import { GAME_STATES } from './utils.js';

// ==================== 키보드 입력 상태 ====================
export const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    r: false,
    h: false,  // 대시 스킬
    j: false,  // 실드 스킬
    k: false,  // 슬로우 스킬
    l: false   // 스톱 스킬
};

/**
 * 키보드 이벤트 리스너 설정
 * @param {Object} gameState - 게임 상태 객체
 */
export function setupInputListeners(gameState) {
    // 키보드 눌림 이벤트
    document.addEventListener('keydown', (event) => {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = true;
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = true;
                event.preventDefault();
                break;
            case 'ArrowUp':
            case 'KeyW':
                keys.up = true;
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.down = true;
                event.preventDefault();
                break;
            case 'KeyR':
                if (gameState.current === GAME_STATES.GAME_OVER) {
                    resetGame();
                }
                event.preventDefault();
                break;
            case 'KeyH':
                keys.h = true;
                event.preventDefault();
                break;
            case 'KeyJ':
                keys.j = true;
                event.preventDefault();
                break;
            case 'KeyK':
                keys.k = true;
                event.preventDefault();
                break;
            case 'KeyL':
                keys.l = true;
                event.preventDefault();
                break;
        }
    });

    // 키보드 떼기 이벤트
    document.addEventListener('keyup', (event) => {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.down = false;
                break;
            case 'KeyH':
                keys.h = false;
                break;
            case 'KeyJ':
                keys.j = false;
                break;
            case 'KeyK':
                keys.k = false;
                break;
            case 'KeyL':
                keys.l = false;
                break;
        }
    });
} 