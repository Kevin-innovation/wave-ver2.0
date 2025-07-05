# Wave Ver 2.0 - 완전 개발 가이드 (Cursor Rules)

## 🎮 프로젝트 개요
JavaScript Canvas 기반 웨이브 서바이벌 게임 - 완전 기능 구현 완료

## 📋 현재 완료된 주요 기능들

### 1. 기본 게임 시스템
- **파일**: `js/game.js`, `js/player.js`, `js/monster.js`, `js/render.js`
- **기능**: 60fps 웨이브 서바이벌, 플레이어 조작, 몬스터 스폰 시스템
- **성능**: 메모리 풀 패턴으로 최적화, 충돌 감지 시스템

### 2. 스킬 시스템 (가챠)
- **파일**: `js/skills.js`, `js/shop.js`
- **기능**: 
  - 25개 다양한 스킬 (공격, 방어, 특수 효과)
  - 300코인 스킬 가챠 시스템
  - 중복 스킬 강화 시스템
  - 쿨타임 및 지속시간 관리
  - 애니메이션 효과 (파란색 테마)

### 3. 업적 시스템
- **파일**: `js/upgrade.js`, `js/ui.js`
- **기능**: 
  - 25개 업적 (킬 수, 생존 시간, 스킬 관련 등)
  - 실시간 진행도 추적
  - 업적 달성 시 코인 보상
  - **중요**: 업적 해금 방법 완전 숨김 처리

### 4. 경제 시스템
- **파일**: `js/economy.js`
- **기능**: 
  - 코인 획득 (몬스터 킬, 업적 달성)
  - 코인 소비 (스킬 가챠, 가이드 뽑기)
  - 안전한 코인 관리 시스템

### 5. 상점 시스템 (핵심 기능)
- **파일**: `js/shop.js`
- **기능**: 
  - 스킬 가챠 (300코인, 파란색 테마)
  - **가이드 뽑기** (500코인, 보라색 테마) ⭐ 신규 핵심 기능
  - 25개 업적 해금 가이드를 랜덤으로 하나씩 제공
  - 중복 방지 시스템 (모든 가이드 해금 시 완료)
  - 애니메이션 시스템 (3초 지속)

### 6. 인증 시스템
- **파일**: `js/auth.js`
- **기능**: 
  - 구글 OAuth 로그인 (화면 하단)
  - 계정별 데이터 분리
  - 자동 로그인 상태 유지

### 7. 랭킹 시스템
- **파일**: `js/ranking.js`
- **기능**: 
  - 실시간 글로벌 랭킹 (5키로 접근)
  - 게임 종료 시 자동 점수 업로드
  - 상위 20명 표시

### 8. 클라우드 동기화 시스템 (완전 구현)
- **파일**: `js/supabase.js`
- **기능**: 
  - 모든 게임 데이터 클라우드 저장
  - 계정 전환 시 자동 동기화
  - **스킬 데이터, 업적 데이터, 가이드 해금 데이터 모두 동기화**
  - 로컬 + 클라우드 병행 저장

## 🔧 Supabase 데이터베이스 구조

### 테이블 구조
```sql
-- 기본 테이블들
rankings (user_id, username, high_score, created_at)
user_skills (user_id, skills_data)
user_achievements (user_id, achievements_data)
unlocked_guides (user_id, unlocked_guide_ids) -- 가이드 뽑기 데이터
```

### 환경 변수
```javascript
// js/supabase.js
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-supabase-key';
```

## 📁 파일별 핵심 기능 설명

### `js/shop.js` (핵심 파일)
```javascript
// 주요 구성 요소
SHOP_CONFIG = {
    skillGachaPrice: 300,
    guideGachaPrice: 500  // 가이드 뽑기 가격
}

ACHIEVEMENT_GUIDES = {
    // 25개 업적의 상세 해금 가이드
    'first_kill': '첫 번째 몬스터를 처치하세요!',
    // ... 24개 더
}

// 핵심 함수들
- performSkillGacha() // 스킬 가챠
- performGuideGacha() // 가이드 뽑기 ⭐
- saveUnlockedGuides() // 가이드 데이터 저장
- loadUnlockedGuides() // 가이드 데이터 로드
```

### `js/ui.js` (화면 렌더링)
```javascript
// 주요 화면들
- renderShopScreen() // 상점 (두 가지 뽑기 시스템)
- renderAchievementsScreen() // 도전과제 + 해금된 가이드 표시
- renderGachaAnimation() // 뽑기 애니메이션
- renderRankingScreen() // 랭킹 화면
```

### `js/supabase.js` (클라우드 동기화)
```javascript
// 동기화 함수들
- saveSkillsToSupabase() // 스킬 데이터 저장
- loadSkillsFromSupabase() // 스킬 데이터 로드
- saveAchievementsToSupabase() // 업적 데이터 저장
- loadAchievementsFromSupabase() // 업적 데이터 로드
- saveGuidesToSupabase() // 가이드 데이터 저장 ⭐
- loadGuidesFromSupabase() // 가이드 데이터 로드 ⭐
```

## 🎯 게임 플레이 흐름

1. **게임 시작**: 웨이브 서바이벌 플레이
2. **코인 획득**: 몬스터 킬, 업적 달성
3. **상점 이용**: 
   - 스킬 가챠 (300코인) - 전투력 강화
   - 가이드 뽑기 (500코인) - 업적 해금 방법 발견
4. **업적 달성**: 가이드를 통해 숨겨진 업적 조건 파악
5. **랭킹 등록**: 게임 종료 시 자동 업로드
6. **계정 동기화**: 모든 데이터 클라우드 보관

## 🔄 데이터 동기화 시점

### 자동 동기화 (사용자 개입 없음)
- 게임 오버 시 → 점수, 스킬, 업적 데이터 저장
- 가이드 뽑기 시 → 즉시 클라우드 저장
- 업적 달성 시 → 즉시 클라우드 저장
- 로그인 시 → 클라우드 데이터 자동 로드

### 수동 동기화 (동기화 버튼)
- 추가 안전장치 역할
- 즉시 모든 데이터 업로드

## 🎨 UI 테마 색상

### 스킬 가챠 (파란색 테마)
```javascript
skillGachaColor: '#4A90E2'
skillGachaHover: '#357ABD'
```

### 가이드 뽑기 (보라색 테마)
```javascript
guideGachaColor: '#8A2BE2'
guideGachaHover: '#7B1FA2'
```

## 🚀 배포 시스템

### 이중 브랜치 구조
```bash
# 개발 브랜치
main - 개발 코드

# 배포 브랜치  
gh-pages - GitHub Pages 배포용
```

### 배포 명령어
```bash
# 1. main 브랜치에서 개발 완료 후
git add .
git commit -m "기능: 설명"
git push origin main

# 2. gh-pages 브랜치 동기화
git checkout gh-pages
git reset --hard main
git push origin gh-pages --force
```

## 💡 개발 시 주의사항

### 핵심 개발 원칙
1. **업적 해금 방법 절대 노출 금지**: UI에서 힌트 제공 금지
2. **가이드 뽑기가 유일한 해금 방법**: 500코인 투자 필요
3. **모든 데이터 클라우드 동기화**: 계정 전환 시 완전 복구
4. **성능 최적화**: 60fps 유지 필수
5. **사용자 경험**: 직관적인 UI, 즉시 피드백

### 데이터 무결성 보장
- 로컬스토리지 + 클라우드 병행 저장
- 모든 중요 액션 시 즉시 동기화
- 사용자별 데이터 격리 (getUserStorageKey 사용)

### 성능 최적화 포인트
- 몬스터 메모리 풀 패턴
- 캔버스 렌더링 최적화  
- 불필요한 계산 방지
- 메모리 누수 방지

## 🧪 테스트 체크리스트

### 기능 테스트
- [ ] 스킬 가챠 정상 동작 (300코인 차감, 랜덤 스킬 획득)
- [ ] 가이드 뽑기 정상 동작 (500코인 차감, 중복 방지)
- [ ] 업적 해금 조건 완전 숨김 확인
- [ ] 클라우드 동기화 (로그인/로그아웃 시 데이터 유지)
- [ ] 랭킹 시스템 (게임 종료 시 자동 업로드)

### 성능 테스트
- [ ] 장시간 플레이 (메모리 누수 확인)
- [ ] 많은 스킬 보유 시 성능 확인
- [ ] 가이드 다량 해금 시 UI 정상 동작

## 📚 핵심 로직 설명

### 가이드 뽑기 시스템 (신규 핵심 기능)
```javascript
// 1. 해금 가능한 가이드 확인
const availableGuides = Object.keys(ACHIEVEMENT_GUIDES)
    .filter(id => !unlockedGuides.has(id));

// 2. 랜덤 선택 및 해금
const randomGuide = availableGuides[Math.floor(Math.random() * availableGuides.length)];
unlockedGuides.add(randomGuide);

// 3. 즉시 클라우드 저장
await saveGuidesToSupabase();
```

### 업적 해금 방법 숨김 처리
```javascript
// ❌ 이전 방식 (해금 방법 노출)
'힌트: 몬스터 100마리 처치'

// ✅ 현재 방식 (완전 숨김)
'이 업적의 비밀을 발견하세요!'
```

## 🎯 향후 확장 가능성

### 추가 가능한 기능들
1. **새로운 뽑기 시스템**: 스킨, 타이틀 등
2. **길드 시스템**: 팀 플레이 요소
3. **시즌 시스템**: 주기적 리셋 + 특별 보상
4. **커뮤니티 기능**: 댓글, 공유 등

### 확장 시 주의사항
- 기존 데이터 호환성 유지
- 새로운 뽑기 시스템 시 색상 테마 구분
- 클라우드 동기화 범위 확장
- 성능 영향 최소화

---

## 🔗 중요 파일 참조

### 필수 확인 파일
- `js/shop.js` - 모든 가챠 시스템
- `js/ui.js` - 화면 렌더링
- `js/supabase.js` - 클라우드 동기화
- `js/auth.js` - 계정 시스템
- `SETUP-GUIDE.md` - Supabase 설정 가이드

### 데이터베이스 스키마
- `supabase-setup.sql` - 기본 테이블
- `supabase-guide-update.sql` - 가이드 뽑기 테이블

---

**🎉 완성된 기능: 업적 해금 방법을 숨기고 가이드 뽑기로 발견하는 시스템**
**✨ 핵심 가치: 탐험과 발견의 재미 + 완전한 클라우드 동기화** 