/**
 * 몬스터 시스템
 */

import { player } from './player.js';
import { earnCoins } from './economy.js';

// ==================== 몬스터 배열 (최대 30개) ====================
export const monsters = [];
for (let i = 0; i < 30; i++) {
    monsters.push({
        active: false,   // 활성화 여부
        x: 0,           // x 좌표
        y: 0,           // y 좌표
        dx: 0,          // x 방향 속도
        dy: 0,          // y 방향 속도
        width: 30,      // 너비
        height: 30,     // 높이
        color: '#FF0000' // 빨간색
    });
}

/**
 * 몬스터 생성 함수
 * 
 * 기능:
 * 1. 화면 가장자리(위/오른쪽/아래/왼쪽) 중 랜덤 선택
 * 2. 선택된 가장자리에서 랜덤 위치에 몬스터 생성
 * 3. 현재 플레이어 위치를 향한 이동 방향과 속도 계산
 * 4. 웨이브에 따라 속도 증가 (기본 3.2 + 웨이브당 0.3씩)
 * 
 * @param {number} currentWave - 현재 웨이브
 * @param {Object} skills - 스킬 상태
 * @returns {Object} 몬스터 객체
 */
export function createMonster(currentWave, skills) {
    // 화면 가장자리 중 하나를 랜덤 선택 (0:위, 1:오른쪽, 2:아래, 3:왼쪽)
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) {  // 위쪽 가장자리
        x = Math.random() * (750 - 50) + 50;  // 50~750 사이 랜덤
        y = 0;                                 // 화면 최상단
    } else if (side === 1) {  // 오른쪽 가장자리
        x = 800;                               // 화면 최우측
        y = Math.random() * (750 - 50) + 50;  // 50~750 사이 랜덤
    } else if (side === 2) {  // 아래쪽 가장자리
        x = Math.random() * (750 - 50) + 50;  // 50~750 사이 랜덤
        y = 800;                               // 화면 최하단
    } else {  // 왼쪽 가장자리 (side === 3)
        x = 0;                                 // 화면 최좌측
        y = Math.random() * (750 - 50) + 50;  // 50~750 사이 랜덤
    }

    // 플레이어 위치로의 방향 벡터 계산
    const dx = (player.x + player.width/2) - (x + 15);   // 플레이어 중심 - 몬스터 중심
    const dy = (player.y + player.height/2) - (y + 15);  // 플레이어 중심 - 몬스터 중심

    // 피타고라스 정리로 거리 계산 (√(dx² + dy²))
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 웨이브에 따른 속도 계산: Wave 5 수준(3.2)부터 시작하여 웨이브당 0.3씩 증가
    let speed = 3.2 + (currentWave - 1) * 0.3;
    
    // 슬로우 스킬 적용
    if (skills.slow.active) {
        speed *= skills.slow.slowFactor;
    }

    // 방향 벡터를 단위 벡터로 정규화한 후 속도 적용
    let finalDx = 0, finalDy = 0;
    if (distance > 0) {  // 0으로 나누는 것을 방지
        finalDx = (dx / distance) * speed;  // 정규화된 x방향 속도
        finalDy = (dy / distance) * speed;  // 정규화된 y방향 속도
    }

    // 몬스터 정보 반환
    return {
        active: true,
        x: x,
        y: y,
        dx: finalDx,
        dy: finalDy,
        width: 30,
        height: 30,
        color: '#FF0000'
    };
}

/**
 * 모든 몬스터 비활성화
 */
export function resetMonsters() {
    for (let i = 0; i < monsters.length; i++) {
        monsters[i].active = false;
        monsters[i].dx = 0;
        monsters[i].dy = 0;
    }
}

/**
 * 몬스터 이동 및 상태 업데이트
 * @param {Object} skills - 스킬 상태
 * @returns {Object} - { monstersRemoved: number }
 */
export function updateMonsters(skills) {
    let monstersRemoved = 0;
    
    for (let i = 0; i < monsters.length; i++) {
        if (monsters[i].active) {
            // 몬스터 이동 (스킬 효과 실시간 적용)
            let moveSpeedX = monsters[i].dx;
            let moveSpeedY = monsters[i].dy;
            
            // 스톱 스킬이 활성화되어 있으면 완전 정지
            if (skills.stop.active) {
                moveSpeedX = 0;
                moveSpeedY = 0;
            } else if (skills.slow.active) {
                // 슬로우 스킬이 활성화되어 있으면 속도 감소
                moveSpeedX *= skills.slow.slowFactor;
                moveSpeedY *= skills.slow.slowFactor;
            }
            
            monsters[i].x += moveSpeedX;  // x좌표 이동
            monsters[i].y += moveSpeedY;  // y좌표 이동

            // 몬스터가 화면 밖으로 완전히 나갔는지 확인
            if (monsters[i].x < -50 || monsters[i].x > 850 || 
                monsters[i].y < -50 || monsters[i].y > 850) {
                
                // 몬스터 제거 및 카운터 업데이트
                monsters[i].active = false;
                monsters[i].dx = 0;
                monsters[i].dy = 0;
                monstersRemoved++;
                
                // 코인 획득! 🪙
                earnCoins(1);
            }
        }
    }
    
    return { monstersRemoved };
}

/**
 * 웨이브 시작 시 몬스터 생성
 * @param {number} monstersPerWave - 생성할 몬스터 수
 * @param {number} currentWave - 현재 웨이브
 * @param {Object} skills - 스킬 상태
 * @returns {number} - 생성된 몬스터 수
 */
export function spawnWaveMonsters(monstersPerWave, currentWave, skills) {
    let monstersSpawned = 0;

    // 몬스터 배열을 순회하며 빈 슬롯에 몬스터 생성
    for (let i = 0; i < monsters.length && monstersSpawned < monstersPerWave; i++) {
        if (!monsters[i].active) {
            const newMonster = createMonster(currentWave, skills);
            monsters[i] = newMonster;
            monstersSpawned++;
        }
    }
    
    return monstersSpawned;
}

/**
 * 몬스터 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {Object} skills - 스킬 상태
 */
export function renderMonsters(ctx, skills) {
    for (let i = 0; i < monsters.length; i++) {
        if (monsters[i].active) {
            // 스킬 활성화 시 몬스터 색상 변경
            if (skills.stop.active) {
                ctx.fillStyle = '#888888';  // 스톱 시 회색
            } else if (skills.slow.active) {
                ctx.fillStyle = '#FF6666';  // 슬로우 시 연한 빨간색
            } else {
                ctx.fillStyle = monsters[i].color;  // 기본 빨간색
            }
            ctx.fillRect(monsters[i].x, monsters[i].y, monsters[i].width, monsters[i].height);
        }
    }
}

/**
 * 활성 몬스터 수 반환
 * @returns {number} - 활성 몬스터 수
 */
export function getActiveMonsterCount() {
    return monsters.filter(monster => monster.active).length;
} 