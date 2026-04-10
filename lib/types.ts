export type Lang = "ko" | "en" | "ja" | "zh";

export type Direction = "inbound" | "outbound";

export type ProjectStatus = "ongoing" | "pending" | "done";

// ─────────────────────────────────────────
// Company
// 제작사 단위. 기본 언어 설정 포함.
// ─────────────────────────────────────────
export type Company = {
  id: string;
  name: string; // "Studio Ghibli"
  defaultLang: Lang; // 번역 화면에서 자동 선택될 기본 언어
  createdAt: string; // ISO 8601
};

// ─────────────────────────────────────────
// Message
// 메일 1통. 원문 + 번역 한 쌍으로 저장.
// ─────────────────────────────────────────
export type Message = {
  id: string;
  direction: Direction; // 수신(inbound) / 발신(outbound)
  originalText: string; // 원문
  translatedText: string; // 번역 결과
  lang: Lang; // 번역된 언어
  createdAt: string;
};

// ─────────────────────────────────────────
// Summary
// Thread 단위 AI 요약. 번역 저장 시마다 재생성.
// null이면 아직 요약 없음 (메시지 0건 등)
// ─────────────────────────────────────────
export type Summary = {
  oneliner: string; // "납품 2주 연장 합의, 계약서 발송 대기 중"
  actions: string[]; // ["수정 계약서 3/15까지 발송"]
  status: ProjectStatus;
  topics: string[]; // AI 자동 태깅 ["납품일정", "계약조건"]
  updatedAt: string;
};

// ─────────────────────────────────────────
// Milestone
// Thread 내 주요 결정/합의 사항.
// messages 와 달리 만료되지 않고 영구 보존.
// ─────────────────────────────────────────
export type Milestone = {
  id: string;
  title: string;   // "납품일 2주 연장 합의"
  content: string; // 상세 내용
  createdAt: string; // ISO 8601
};

// ─────────────────────────────────────────
// Thread (UI 표시명: 프로젝트)
// 한 제작사와 진행하는 개별 건.
// 메시지들이 여기에 누적됨.
// ─────────────────────────────────────────
export type Thread = {
  id: string;
  companyId: string; // Company.id 참조
  title: string; // "나우시카 리마스터"
  messages: Message[];    // 최근 10건만 보존
  milestones: Milestone[]; // 주요 합의 사항 (항상 전체 보존)
  summary: Summary | null;
  createdAt: string;
};

// ─────────────────────────────────────────
// GlossaryItem
// 전역 용어집. 번역 시 프롬프트에 자동 주입.
// ─────────────────────────────────────────
export type GlossaryItem = {
  id: string;
  source: string; // "Dolby Atmos"
  target: string; // "Dolby Atmos" (고정할 표현)
};
