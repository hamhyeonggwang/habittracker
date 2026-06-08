import type { ArchiveItem } from '@/types';

export interface ArchiveConnectInput {
  date: string;        // 캐시 키 용도 (오늘 날짜)
  targetId: string;
  target: { title: string; content: string; category: string; tags: string[] };
  candidates: { id: string; title: string; content: string; category: string; tags: string[] }[];
}

function summarize(item: { title: string; content: string; category: string; tags: string[] }): string {
  const snippet = item.content.length > 200 ? item.content.slice(0, 200) + '…' : item.content;
  return `제목: ${item.title}\n카테고리: ${item.category}\n태그: ${item.tags.join(', ') || '없음'}\n내용: ${snippet}`;
}

export function buildArchiveConnectPrompt(input: ArchiveConnectInput): string {
  const { target, candidates } = input;

  const candidateBlocks = candidates
    .map((c, i) => `[기록 ${i + 1}] (id: ${c.id})\n${summarize(c)}`)
    .join('\n\n');

  return [
    `[기준 기록]`,
    summarize(target),
    ``,
    `[과거 기록 목록]`,
    candidateBlocks || '(비교할 과거 기록 없음)',
    ``,
    `위 "기준 기록"과 의미적으로 연결되는 "과거 기록"을 최대 3개까지 골라,`,
    `각각 어떤 점에서 연결되는지 한두 문장으로 설명해주세요.`,
    `연결되는 기록이 없다면 그렇게 말해주세요.`,
  ].join('\n');
}

export function summarizeForCandidate(item: ArchiveItem) {
  return { id: item.id, title: item.title, content: item.content, category: item.category, tags: item.tags };
}
