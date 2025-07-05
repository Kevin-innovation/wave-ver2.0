/**
 * 플레이어 시스템
 */

// ==================== 플레이어 객체 ====================
export const player = {
    x: 375,          // x 좌표
    y: 375,          // y 좌표
    width: 50,       // 너비
    height: 50,      // 높이
    speed: 5,        // 이동 속도
    color: '#0066FF' // 파란색
};

/**
 * 플레이어를 화면 중앙으로 리셋
 */
export function resetPlayer() {
    player.x = 375;
    player.y = 375;
}

/**
 * 플레이어 이동 처리
 * @param {Object} keys - 키 입력 상태
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function updatePlayerMovement(keys, canvasWidth, canvasHeight) {
    // 방향키에 따른 플레이어 이동 (화면 경계 체크 포함)
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x + player.width < canvasWidth) {
        player.x += player.speed;
    }
    if (keys.up && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys.down && player.y + player.height < canvasHeight) {
        player.y += player.speed;
    }
}

/**
 * 플레이어 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {Object} skills - 스킬 상태 객체
 */
export function renderPlayer(ctx, skills) {
    // 플레이어 그리기
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 실드 효과 표시
    if (skills.shield.active) {
        ctx.strokeStyle = '#00FFFF';  // 청록색 실드
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width/2, player.y + player.height/2, 35, 0, Math.PI * 2);
        ctx.stroke();
    }
} 