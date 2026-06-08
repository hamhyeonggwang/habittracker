import { NextRequest, NextResponse } from 'next/server';
import { askClaude, hashData } from '@/lib/ai/client';
import { buildDailySummaryPrompt, type DailySummaryInput } from '@/lib/ai/prompts/dailySummary';
import { buildIdentityCheckPrompt, type IdentityCheckInput } from '@/lib/ai/prompts/identityCheck';
import { buildReasonPatternPrompt, type ReasonPatternInput } from '@/lib/ai/prompts/reasonPattern';
import { buildArchiveConnectPrompt, type ArchiveConnectInput } from '@/lib/ai/prompts/archiveConnect';
import { insightStore } from '@/lib/storage';

const DAILY_SUMMARY_SYSTEM = `당신은 작업치료(Occupational Therapy)의 MOHO(Model of Human Occupation) 프레임에 익숙한 코치입니다.
사용자의 하루 데이터를 보고 사실 요약, 패턴 관찰, 내일을 위한 제안 한 가지를 한국어로 간결하게 작성하세요.
장황한 보고서가 아니라 따뜻하고 담백한 3~5문장 정도의 글로 작성하세요. 평가하거나 훈계하지 마세요.`;

const IDENTITY_CHECK_SYSTEM = `당신은 작업치료(Occupational Therapy)의 MOHO(Model of Human Occupation) 프레임, 특히 Volition(의지)과 정체성 역할(identity role)에 익숙한 코치입니다.
사용자가 스스로 선언한 "정체성 선언"과 최근 7일간 실제로 수행한 역할 태그 분포를 비교해서,
선언과 실제 사이의 정합성 또는 괴리를 짚어주고, 다음 한 주를 위한 제안 한 가지를 한국어로 작성하세요.
평가나 훈계가 아니라 관찰과 제안의 톤으로, 4~6문장 정도로 간결하게 작성하세요.`;

const REASON_PATTERN_SYSTEM = `당신은 작업치료(Occupational Therapy)의 작업 수행 분석(activity analysis)에 익숙한 코치입니다.
사용자가 최근 30일간 완료하지 못한 작업과 그 사유들을 보고, 반복되는 패턴이나 구조적 방해 요인을 1~2가지로 묶어 짚어주고,
그 구조를 조정할 수 있는 현실적인 제안 한 가지를 한국어로 작성하세요.
개별 사유를 나열하거나 평가하지 말고, 패턴 관찰과 구조적 제안에 집중해서 4~6문장으로 간결하게 작성하세요.`;

const ARCHIVE_CONNECT_SYSTEM = `당신은 사용자의 개인 아카이브(메모·인사이트 모음)를 살펴보고 의미적으로 연결되는 기록을 찾아주는 보조자입니다.
주어진 "기준 기록"과 "과거 기록 목록"을 비교해서, 정말 의미 있게 연결되는 기록만 골라 왜 연결되는지 짧게 설명하세요.
없는 연결을 억지로 만들지 말고, 자연스러운 한국어로 간결하게 작성하세요.`;

type RequestBody =
  | (DailySummaryInput & { type?: 'daily_summary'; force?: boolean })
  | (IdentityCheckInput & { type: 'identity_check'; force?: boolean })
  | (ReasonPatternInput & { type: 'reason_pattern'; force?: boolean })
  | (ArchiveConnectInput & { type: 'archive_connect'; force?: boolean });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { date, force, ...rest } = body;
    if (!date) return NextResponse.json({ error: 'date가 필요합니다' }, { status: 400 });

    const type = body.type ?? 'daily_summary';
    const dataHash = hashData(rest);

    if (!force) {
      const cached = await insightStore.getByDate(date, type);
      if (cached && cached.dataHash === dataHash) {
        return NextResponse.json({ content: cached.content, cached: true });
      }
    }

    const [systemPrompt, userPrompt] = type === 'identity_check'
      ? [IDENTITY_CHECK_SYSTEM, buildIdentityCheckPrompt(body as IdentityCheckInput)]
      : type === 'reason_pattern'
      ? [REASON_PATTERN_SYSTEM, buildReasonPatternPrompt(body as ReasonPatternInput)]
      : type === 'archive_connect'
      ? [ARCHIVE_CONNECT_SYSTEM, buildArchiveConnectPrompt(body as ArchiveConnectInput)]
      : [DAILY_SUMMARY_SYSTEM, buildDailySummaryPrompt(body as DailySummaryInput)];

    const content = await askClaude(systemPrompt, userPrompt);

    await insightStore.save(date, type, content, dataHash);

    return NextResponse.json({ content, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
