import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 — OTD',
  description: 'OTD(Own The Day) 개인정보처리방침',
};

const UPDATED = '2026년 6월 21일';

export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px',
        fontFamily: 'Pretendard, -apple-system, sans-serif', color: '#1c1f2e', lineHeight: 1.7,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>개인정보처리방침</h1>
      <p style={{ fontSize: 13, color: '#6e7a65', marginBottom: 28 }}>
        OTD (Own The Day) · 시행일 {UPDATED}
      </p>

      <p style={{ marginBottom: 24 }}>
        OTD(이하 “서비스”)는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을
        준수합니다. 본 방침은 서비스가 어떤 정보를 수집·이용·보관하며, 이용자가 자신의 정보를 어떻게
        관리·삭제할 수 있는지 설명합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <ul style={ulStyle}>
          <li><b>계정 정보</b>: 이메일 주소 (Google 로그인 시 제공). 이름·프로필 사진 등 그 외 소셜 프로필 정보는 저장하지 않습니다.</li>
          <li><b>이용 기록</b>: 습관·루틴, 업무·프로젝트, 아카이브 메모, 목표·로드맵 등 이용자가 직접 입력한 기록.</li>
          <li><b>민감 정보</b>: 컨디션(정서·신체·인지·환경 4축 자기보고), 재무 항목(수입·저축 등). 이용자가 입력한 경우에만 수집됩니다.</li>
        </ul>
        <p style={{ marginTop: 8, fontSize: 14, color: '#444' }}>
          별도의 비밀번호는 수집하지 않으며, 소셜 로그인(OAuth)을 통한 최소 인증만 사용합니다.
        </p>
      </Section>

      <Section title="2. 개인정보의 이용 목적">
        <ul style={ulStyle}>
          <li>서비스 제공 — 이용자별 기록의 저장·조회·시각화</li>
          <li>본인 식별 및 데이터 격리(다른 이용자와의 분리)</li>
          <li>서비스 품질 개선을 위한 통계 분석 — <b>반드시 집계·비식별 형태로만</b> 수행하며, 개별 이용자를 재식별하여 들여다보지 않습니다.</li>
        </ul>
      </Section>

      <Section title="3. 보관 위치 및 기간">
        <ul style={ulStyle}>
          <li><b>보관 위치</b>: Supabase(클라우드 데이터베이스). 행 수준 보안(RLS)으로 본인 데이터만 접근 가능합니다.</li>
          <li><b>보관 기간</b>: 회원 탈퇴(계정 삭제) 시 모든 데이터를 즉시 영구 삭제합니다. 그 전까지는 서비스 제공을 위해 보관합니다.</li>
        </ul>
      </Section>

      <Section title="4. 제3자 제공 및 처리위탁">
        <p>
          수집한 개인정보를 제3자에게 제공하거나 판매하지 않습니다. 데이터 저장을 위해 Supabase,
          서비스 호스팅을 위해 Vercel을 이용하며, 이는 서비스 운영에 필요한 범위의 인프라 이용입니다.
        </p>
      </Section>

      <Section title="5. 이용자의 권리 및 데이터 삭제">
        <ul style={ulStyle}>
          <li><b>앱 내 삭제</b>: 설정 화면의 “계정 및 모든 데이터 삭제”를 통해 언제든 본인 계정과 전체 기록을 영구 삭제할 수 있습니다.</li>
          <li><b>웹 기반 삭제 요청</b>: 아래 이메일로 삭제를 요청하시면 처리해 드립니다.</li>
          <li>본인 데이터의 열람·수정은 앱 내에서 직접 가능합니다.</li>
        </ul>
      </Section>

      <Section title="6. 문의처">
        <p>
          개인정보 관련 문의 및 삭제 요청: <a href="mailto:otdevham@gmail.com" style={{ color: '#2c4a7c' }}>otdevham@gmail.com</a>
        </p>
      </Section>

      <Section title="7. 고지의 의무">
        <p>본 방침이 변경되는 경우 시행일과 변경 내용을 본 페이지에 공지합니다.</p>
      </Section>
    </main>
  );
}

const ulStyle: React.CSSProperties = { paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 15 }}>{children}</div>
    </section>
  );
}
