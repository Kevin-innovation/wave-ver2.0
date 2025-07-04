# wave-ver2.0 - Vercel + Supabase 설정 가이드

## 🚀 개요

이 가이드는 wave-ver2.0 게임에 **Google OAuth 인증**과 **랭킹 보드 시스템**을 추가하기 위한 설정 방법을 설명합니다.

### 새로운 기능
- 🔐 **Google OAuth 로그인**
- ☁️ **클라우드 게임 데이터 저장/동기화**
- 🏆 **실시간 랭킹 보드**
- 📊 **개인 최고 기록 추적**

---

## 1️⃣ Supabase 프로젝트 설정

### 1.1 Supabase 계정 생성 및 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입
2. "New project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `wave-ver2-ranking`
   - **Database Password**: 안전한 비밀번호 생성
   - **Region**: 가장 가까운 지역 선택 (Asia Northeast - Seoul)

### 1.2 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** 이동
2. `supabase-setup.sql` 파일의 내용을 복사하여 실행
3. 다음 테이블이 생성됨을 확인:
   - `user_profiles` - 사용자 프로필
   - `game_saves` - 게임 저장 데이터
   - `rankings` - 랭킹 데이터

### 1.3 Google OAuth 설정

1. **Authentication > Providers** 이동
2. **Google** 활성화
3. Google Cloud Console에서 OAuth 설정:
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 새 프로젝트 생성 또는 기존 프로젝트 선택
   - **APIs & Services > Credentials** 이동
   - **Create Credentials > OAuth 2.0 Client IDs** 클릭
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     ```
     https://[your-project-id].supabase.co/auth/v1/callback
     ```
4. Client ID와 Client Secret을 Supabase에 입력

### 1.4 환경 변수 수집

다음 정보를 메모:
- **Project URL**: `https://[your-project-id].supabase.co`
- **Anon Key**: Settings > API에서 확인

---

## 2️⃣ 코드 설정

### 2.1 Supabase 클라이언트 설정

`js/supabase.js` 파일에서 환경 변수 수정:

```javascript
// Supabase 설정
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 2.2 환경 변수 파일 생성 (선택사항)

`.env` 파일 생성:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

코드에서 사용:
```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

## 3️⃣ Vercel 배포 설정

### 3.1 Vercel 계정 생성

1. [Vercel](https://vercel.com)에 GitHub 계정으로 가입
2. GitHub 저장소 연결

### 3.2 프로젝트 배포

1. **New Project** 클릭
2. GitHub 저장소 선택
3. **Environment Variables** 설정:
   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```
4. **Deploy** 클릭

### 3.3 도메인 설정

1. 배포 완료 후 도메인 확인
2. Google OAuth 리다이렉트 URI에 Vercel 도메인 추가:
   ```
   https://your-project.vercel.app
   ```

---

## 4️⃣ 테스트 및 확인

### 4.1 기능 테스트

1. **게임 실행**: 기본 게임 기능 동작 확인
2. **Google 로그인**: 인증 버튼 클릭하여 로그인 테스트
3. **데이터 동기화**: 로그인 후 게임 데이터 클라우드 저장 확인
4. **랭킹 시스템**: 게임 종료 후 랭킹 등록 및 조회 확인

### 4.2 문제 해결

#### 🔍 CORS 오류
- Supabase에서 도메인이 올바르게 설정되었는지 확인
- Google OAuth 리다이렉트 URI 확인

#### 🔍 인증 실패
- Google OAuth Client ID/Secret 재확인
- 리다이렉트 URI가 정확한지 확인

#### 🔍 데이터베이스 오류
- SQL 스크립트가 완전히 실행되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

---

## 5️⃣ 추가 최적화

### 5.1 성능 최적화

- CDN 설정으로 전 세계 빠른 로딩
- 이미지 최적화
- 코드 압축 및 번들링

### 5.2 보안 강화

- Environment Variables로 민감한 정보 보호
- HTTPS 강제 적용
- Rate Limiting 설정

### 5.3 모니터링

- Vercel Analytics 활성화
- Supabase 사용량 모니터링
- 오류 로깅 시스템 구축

---

## 6️⃣ 주요 파일 구조

```
wave-ver2.0/
├── js/
│   ├── supabase.js         # Supabase 클라이언트 설정
│   ├── auth.js             # 인증 UI 및 로직
│   ├── ranking.js          # 랭킹 시스템
│   ├── game.js             # 메인 게임 로직 (수정됨)
│   ├── economy.js          # 경제 시스템 (수정됨)
│   ├── ui.js               # UI 시스템 (수정됨)
│   └── input.js            # 입력 처리 (수정됨)
├── css/
│   └── styles.css          # 스타일시트 (대폭 업데이트)
├── supabase-setup.sql      # 데이터베이스 스키마
├── vercel.json             # Vercel 설정
├── package.json            # 프로젝트 의존성
└── index.html              # 메인 HTML (업데이트)
```

---

## 7️⃣ 게임 플레이 변화

### 새로운 조작법
- **4키**: 랭킹 화면 전환
- **Google 로그인 버튼**: 인증 및 클라우드 기능 활성화

### 새로운 UI
- **🔐 계정 연동 섹션**: 로그인/로그아웃 및 동기화
- **🏆 랭킹 탭**: 전체 랭킹과 개인 최고 기록
- **☁️ 클라우드 동기화**: 실시간 데이터 저장

### 게임 플레이 루프
1. **로컬 플레이**: 로그인 없이도 기본 기능 사용 가능
2. **Google 로그인**: 클라우드 기능 활성화
3. **데이터 동기화**: 자동으로 로컬 ↔ 클라우드 병합
4. **랭킹 참여**: 게임 종료 시 자동으로 점수 등록
5. **경쟁**: 전 세계 플레이어와 실시간 순위 경쟁

---

## 🎯 완료!

설정이 완료되면 다음과 같은 기능을 사용할 수 있습니다:

✅ **Google OAuth 인증**  
✅ **클라우드 게임 데이터 저장**  
✅ **실시간 랭킹 보드**  
✅ **크로스 디바이스 동기화**  
✅ **개인 최고 기록 추적**  
✅ **전 세계 플레이어와의 경쟁**  

축하합니다! 🎉 이제 wave-ver2.0이 완전한 온라인 경쟁 게임으로 업그레이드되었습니다! 