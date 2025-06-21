/**
 * 스킬 시스템 (HJKL)
 */

import { player } from './player.js';
import { monsters, getActiveMonsterCount } from './monster.js';

// ==================== 스킬 시스템 ====================
export const skills = {
    dash: {
        cooldown: 0,
        maxCooldown: 180,  // 3초 (60fps 기준)
        distance: 100,
        active: false
    },
    shield: {
        cooldown: 0,
        maxCooldown: 600,  // 10초
        duration: 0,
        maxDuration: 180,  // 3초 무적
        active: false
    },
    slow: {
        cooldown: 0,
        maxCooldown: 900,  // 15초
        duration: 0,
        maxDuration: 300,  // 5초 지속
        active: false,
        slowFactor: 0.3    // 30% 속도로 감소
    },
    stop: {
        cooldown: 0,
        maxCooldown: 3600, // 60초 (60fps * 60)
        duration: 0,
        maxDuration: 180,  // 3초간 정지
        active: false
    }
};

/**
 * 대시 스킬 사용
 * @param {Object} keys - 키 입력 상태
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function useDashSkill(keys, canvasWidth, canvasHeight) {
    if (skills.dash.cooldown > 0) return;
    
    // 현재 이동 방향 계산
    let dashX = 0, dashY = 0;
    if (keys.left) dashX = -skills.dash.distance;
    if (keys.right) dashX = skills.dash.distance;
    if (keys.up) dashY = -skills.dash.distance;
    if (keys.down) dashY = skills.dash.distance;
    
    // 대각선 이동 시 거리 조정
    if (dashX !== 0 && dashY !== 0) {
        dashX *= 0.7;
        dashY *= 0.7;
    }
    
    // 기본값: 마지막 이동 방향 또는 오른쪽
    if (dashX === 0 && dashY === 0) {
        dashX = skills.dash.distance;
    }
    
    // 화면 경계 체크하며 대시
    const newX = Math.max(0, Math.min(canvasWidth - player.width, player.x + dashX));
    const newY = Math.max(0, Math.min(canvasHeight - player.height, player.y + dashY));
    
    player.x = newX;
    player.y = newY;
    
    skills.dash.cooldown = skills.dash.maxCooldown;
}

/**
 * 실드 스킬 사용
 */
export function useShieldSkill() {
    if (skills.shield.cooldown > 0) return;
    
    skills.shield.active = true;
    skills.shield.duration = skills.shield.maxDuration;
    skills.shield.cooldown = skills.shield.maxCooldown;
}

/**
 * 슬로우 스킬 사용
 */
export function useSlowSkill() {
    if (skills.slow.cooldown > 0) return;
    
    skills.slow.active = true;
    skills.slow.duration = skills.slow.maxDuration;
    skills.slow.cooldown = skills.slow.maxCooldown;
    console.log('슬로우 스킬 활성화!'); // 디버깅용
}

/**
 * 스톱 스킬 사용
 */
export function useStopSkill() {
    if (skills.stop.cooldown > 0) return;
    
    skills.stop.active = true;
    skills.stop.duration = skills.stop.maxDuration;
    skills.stop.cooldown = skills.stop.maxCooldown;
    console.log('스톱 스킬 활성화! 몬스터들이 3초간 정지합니다.'); // 디버깅용
}

/**
 * 스킬 상태 업데이트 (쿨다운 및 지속시간 관리)
 */
export function updateSkills() {
    // 쿨다운 감소
    if (skills.dash.cooldown > 0) skills.dash.cooldown--;
    if (skills.shield.cooldown > 0) skills.shield.cooldown--;
    if (skills.slow.cooldown > 0) skills.slow.cooldown--;
    if (skills.stop.cooldown > 0) skills.stop.cooldown--;

    // 실드 지속시간 감소
    if (skills.shield.duration > 0) {
        skills.shield.duration--;
        if (skills.shield.duration <= 0) {
            skills.shield.active = false;
        }
    }

    // 슬로우 지속시간 감소
    if (skills.slow.duration > 0) {
        skills.slow.duration--;
        if (skills.slow.duration <= 0) {
            skills.slow.active = false;
        }
    }

    // 스톱 지속시간 감소
    if (skills.stop.duration > 0) {
        skills.stop.duration--;
        if (skills.stop.duration <= 0) {
            skills.stop.active = false;
        }
    }
}

/**
 * 스킬 시스템 초기화
 */
export function resetSkills() {
    skills.dash.cooldown = 0;
    skills.shield.cooldown = 0;
    skills.shield.duration = 0;
    skills.shield.active = false;
    skills.slow.cooldown = 0;
    skills.slow.duration = 0;
    skills.slow.active = false;
    skills.stop.cooldown = 0;
    skills.stop.duration = 0;
    skills.stop.active = false;
}

/**
 * 스킬 사용 처리
 * @param {Object} keys - 키 입력 상태
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 */
export function handleSkillInputs(keys, canvasWidth, canvasHeight) {
    if (keys.h) {
        useDashSkill(keys, canvasWidth, canvasHeight);
        keys.h = false; // 한 번만 실행되도록
    }
    if (keys.j) {
        useShieldSkill();
        keys.j = false;
    }
    if (keys.k) {
        console.log('K키 눌림 감지!'); // 디버깅용
        useSlowSkill();
        keys.k = false;
    }
    if (keys.l) {
        useStopSkill();
        keys.l = false;
    }
}

/**
 * 스킬 UI 렌더링
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 */
export function renderSkillUI(ctx) {
    ctx.font = '20px Arial';
    ctx.fillText('Skills:', 10, 170);
    
    // 대시 스킬 (H)
    const dashCooldown = Math.ceil(skills.dash.cooldown / 60);
    ctx.fillStyle = skills.dash.cooldown > 0 ? '#888888' : '#00AA00';
    ctx.fillText(`H-Dash: ${skills.dash.cooldown > 0 ? dashCooldown + 's' : 'Ready'}`, 10, 200);
    
    // 실드 스킬 (J)
    const shieldCooldown = Math.ceil(skills.shield.cooldown / 60);
    ctx.fillStyle = skills.shield.cooldown > 0 ? '#888888' : '#0066FF';
    const shieldText = skills.shield.active ? 'Active!' : (skills.shield.cooldown > 0 ? shieldCooldown + 's' : 'Ready');
    ctx.fillText(`J-Shield: ${shieldText}`, 10, 230);
    
    // 슬로우 스킬 (K)
    const slowCooldown = Math.ceil(skills.slow.cooldown / 60);
    ctx.fillStyle = skills.slow.cooldown > 0 ? '#888888' : '#FF6600';
    const slowText = skills.slow.active ? 'Active!' : (skills.slow.cooldown > 0 ? slowCooldown + 's' : 'Ready');
    ctx.fillText(`K-Slow: ${slowText}`, 10, 260);
    
    // 스톱 스킬 (L) 
    const stopCooldown = Math.ceil(skills.stop.cooldown / 60);
    ctx.fillStyle = skills.stop.cooldown > 0 ? '#888888' : '#9900CC';
    const stopText = skills.stop.active ? 'Active!' : (skills.stop.cooldown > 0 ? stopCooldown + 's' : 'Ready');
    ctx.fillText(`L-Stop: ${stopText}`, 10, 290);
    
    // 색상 리셋
    ctx.fillStyle = '#000000';
} 