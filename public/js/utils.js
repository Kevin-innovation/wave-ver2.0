/**
 * 게임 상수 및 유틸리티 함수
 */

// ==================== 게임 상태 정의 ====================
export const GAME_STATES = {
    PLAYING: 0,
    GAME_OVER: 1
};

/**
 * 충돌 검사 함수
 * 
 * @param {Object} rect1 - 첫 번째 사각형 (x, y, width, height)
 * @param {Object} rect2 - 두 번째 사각형 (x, y, width, height)
 * @returns {boolean} - 충돌 여부
 */
export function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
} 