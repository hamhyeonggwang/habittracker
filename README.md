# OTD — Own The Day

작업치료사가 설계한 습관·업무·컨디션 기록 앱. 역할 중심으로 하루를 관리합니다.
Next.js · Supabase(Auth + RLS) 기반 멀티테넌트.

## Local Development

```bash
npm install
npm run dev
```

## Vercel Deployment

1. GitHub에 이 저장소를 푸시합니다.
2. Vercel에서 `Add New Project`를 선택하고 GitHub 저장소를 연결합니다.
3. Framework Preset은 `Next.js`로 둡니다.
4. Install Command는 `npm ci`, Build Command는 `npm run build`를 사용합니다.
5. 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 필요. (OAuth는 Supabase 대시보드에서 Google 공급자 설정)

배포 전 로컬 검증:

```bash
npm ci
npm run build
```
