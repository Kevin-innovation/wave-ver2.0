/**
 * 키보드 입력 처리 시스템
 */

import { resetGame } from './game.js';
import { GAME_STATES } from './utils.js';
import { switchToGame, switchToShop, switchToUpgrade, switchToAchievements, switchToRanking, getCurrentUIState, UI_STATES } from './ui.js';
import { handleShopClick } from './shop.js';
import { handleUpgradeClick } from './upgrade.js';

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
 * 입력 필드가 현재 포커스되어 있는지 확인
 * @returns {boolean} 입력 필드가 포커스되어 있으면 true
 */
function isInputFieldFocused() {
    const activeElement = document.activeElement;
    
    // 입력 필드나 텍스트 영역이 포커스되어 있는지 확인
    if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
    )) {
        // 추가 로그로 디버깅
        console.log('🔍 입력 필드 포커스됨:', activeElement.tagName, activeElement.type, activeElement.id);
        return true;
    }
    
    return false;
}

/**
 * 특정 키가 게임 키인지 확인
 * @param {string} code - 키 코드
 * @returns {boolean} 게임 키이면 true
 */
function isGameKey(code) {
    const gameKeys = [
        // 이동 키
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'KeyA', 'KeyD', 'KeyW', 'KeyS',
        // 스킬 키
        'KeyH', 'KeyJ', 'KeyK', 'KeyL',
        // 기능 키
        'KeyR',
        // 탭 전환 키
        'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'
    ];
    
    return gameKeys.includes(code);
}

/**
 * 키보드 이벤트 리스너 설정
 * @param {Object} gameState - 게임 상태 객체
 * @param {HTMLCanvasElement} canvas - 캔버스 요소
 */
export function setupInputListeners(gameState, canvas) {
    // 키보드 눌림 이벤트
    document.addEventListener('keydown', (event) => {
        // 게임 키가 아니면 원래 동작 유지
        if (!isGameKey(event.code)) {
            return;
        }
        
        // 입력 필드가 포커스되어 있고 게임 키를 입력하려고 할 때만 체크
        if (isInputFieldFocused()) {
            console.log('🎮 게임 키 차단됨:', event.code, '- 입력 필드 포커스 중');
            return;
        }
        
        console.log('🎮 게임 키 처리:', event.code);
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
            // 탭 전환 키 (1,2,3,4)
            case 'Digit1':
                switchToGame();
                event.preventDefault();
                break;
            case 'Digit2':
                switchToShop();
                event.preventDefault();
                break;
            case 'Digit3':
                switchToUpgrade();
                event.preventDefault();
                break;
            case 'Digit4':
                switchToAchievements();
                event.preventDefault();
                break;
            case 'Digit5':
                switchToRanking();
                event.preventDefault();
                break;
        }
    });

    // 키보드 떼기 이벤트
    document.addEventListener('keyup', (event) => {
        // 게임 키가 아니면 원래 동작 유지
        if (!isGameKey(event.code)) {
            return;
        }
        
        // 입력 필드가 포커스되어 있고 게임 키를 입력하려고 할 때만 체크
        if (isInputFieldFocused()) {
            return;
        }
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
    
    // 마우스 클릭 이벤트
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // 현재 UI 상태에 따라 클릭 처리
        const currentUI = getCurrentUIState();
        
        if (currentUI === UI_STATES.SHOP) {
            // 상점에서 클릭 처리
            handleShopClick(mouseX, mouseY, canvas.width);
        } else if (currentUI === UI_STATES.UPGRADE) {
            // 성장 화면에서 클릭 처리
            handleUpgradeClick(mouseX, mouseY, canvas.width);
        }
    });
} 