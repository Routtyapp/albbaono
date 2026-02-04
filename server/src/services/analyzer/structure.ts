import * as cheerio from 'cheerio';
import type { StructureAnalysis } from '../../types/geoScore.js';

/**
 * 구조 분석기
 * - 목록형 콘텐츠 (7점)
 * - 표 형식 사용 (6점)
 * - 두괄식 작성 (7점)
 * - 최신성 (5점)
 * 총 25점 만점
 */
export function analyzeStructure(html: string): StructureAnalysis {
  const $ = cheerio.load(html);

  // 1. 목록형 콘텐츠 분석
  const listContent = analyzeListContent($);

  // 2. 표 형식 사용 분석
  const tableUsage = analyzeTableUsage($);

  // 3. 두괄식 작성 분석 (섹션 시작 부분에 핵심 내용 존재)
  const headingFirst = analyzeHeadingFirst($);

  // 4. 최신성 분석
  const freshness = analyzeFreshness($);

  return {
    listContent,
    tableUsage,
    headingFirst,
    freshness,
  };
}

function analyzeListContent($: cheerio.CheerioAPI): StructureAnalysis['listContent'] {
  const ulCount = $('ul').length;
  const olCount = $('ol').length;
  const liCount = $('li').length;
  const totalLists = ulCount + olCount;

  // 본문 텍스트 길이 대비 리스트 비율 계산
  const bodyText = $('body').text().length;
  const hasSubstantialLists = liCount >= 3 && totalLists >= 1;

  let score = 0;
  let detail = '';

  if (liCount >= 10 && totalLists >= 3) {
    score = 7;
    detail = `풍부한 목록 콘텐츠: ${totalLists}개 목록, ${liCount}개 항목`;
  } else if (liCount >= 5 && totalLists >= 2) {
    score = 5;
    detail = `적절한 목록 콘텐츠: ${totalLists}개 목록, ${liCount}개 항목`;
  } else if (hasSubstantialLists) {
    score = 3;
    detail = `기본 목록 존재: ${totalLists}개 목록, ${liCount}개 항목`;
  } else {
    score = 0;
    detail = '목록형 콘텐츠 부족 - AI 인용률 향상을 위해 목록 추가 권장';
  }

  return {
    name: '목록형 콘텐츠',
    passed: score >= 5,
    score,
    maxScore: 7,
    detail,
  };
}

function analyzeTableUsage($: cheerio.CheerioAPI): StructureAnalysis['tableUsage'] {
  const tables = $('table');
  const tableCount = tables.length;

  // 테이블 품질 검사 (thead, th 존재 여부)
  let qualityTables = 0;
  tables.each((_, table) => {
    const $table = $(table);
    const hasThead = $table.find('thead').length > 0;
    const hasTh = $table.find('th').length > 0;
    if (hasThead || hasTh) {
      qualityTables++;
    }
  });

  let score = 0;
  let detail = '';

  if (qualityTables >= 2) {
    score = 6;
    detail = `고품질 표 ${qualityTables}개 발견 - AI 인용률 2.5배 향상 기대`;
  } else if (qualityTables >= 1) {
    score = 4;
    detail = `표 ${qualityTables}개 발견 (헤더 포함)`;
  } else if (tableCount >= 1) {
    score = 2;
    detail = `표 ${tableCount}개 발견 - thead/th 추가로 품질 향상 권장`;
  } else {
    score = 0;
    detail = '표 형식 미사용 - 데이터 정리에 표 활용 권장';
  }

  return {
    name: '표 형식 사용',
    passed: score >= 4,
    score,
    maxScore: 6,
    detail,
  };
}

function analyzeHeadingFirst($: cheerio.CheerioAPI): StructureAnalysis['headingFirst'] {
  // 각 섹션(h1-h6) 다음의 첫 40-60 단어 분석
  const headings = $('h1, h2, h3, h4, h5, h6');
  let sectionsWithGoodStart = 0;
  let totalSections = 0;

  headings.each((_, heading) => {
    const $heading = $(heading);
    const nextElement = $heading.next();

    if (nextElement.length) {
      totalSections++;
      const text = nextElement.text().trim();
      const words = text.split(/\s+/).slice(0, 60);

      // 첫 60단어 내에 핵심 답변 패턴이 있는지 확인
      // 숫자, 정의형 문장, 결론 키워드 등
      const hasDirectAnswer =
        /^\d+|^[가-힣]+[은는이가]\s|결론|요약|핵심|정리|따라서|결과적으로/.test(
          words.join(' ')
        );

      if (hasDirectAnswer || words.length >= 20) {
        sectionsWithGoodStart++;
      }
    }
  });

  const ratio = totalSections > 0 ? sectionsWithGoodStart / totalSections : 0;

  let score = 0;
  let detail = '';

  if (ratio >= 0.7) {
    score = 7;
    detail = `두괄식 구조 우수: ${sectionsWithGoodStart}/${totalSections} 섹션`;
  } else if (ratio >= 0.5) {
    score = 5;
    detail = `두괄식 구조 양호: ${sectionsWithGoodStart}/${totalSections} 섹션`;
  } else if (ratio >= 0.3) {
    score = 3;
    detail = `두괄식 구조 개선 필요: ${sectionsWithGoodStart}/${totalSections} 섹션`;
  } else {
    score = 1;
    detail = '섹션 시작에 핵심 답변 배치 권장';
  }

  return {
    name: '두괄식 작성',
    passed: score >= 5,
    score,
    maxScore: 7,
    detail,
  };
}

function analyzeFreshness($: cheerio.CheerioAPI): StructureAnalysis['freshness'] {
  // 날짜 관련 메타 태그 및 스키마 검사
  const datePatterns = [
    $('meta[property="article:published_time"]').attr('content'),
    $('meta[property="article:modified_time"]').attr('content'),
    $('meta[name="date"]').attr('content'),
    $('time[datetime]').attr('datetime'),
  ];

  // JSON-LD에서 날짜 추출 시도
  let schemaDate: string | null = null;
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const json = JSON.parse($(script).html() || '');
      if (json.datePublished) schemaDate = json.datePublished;
      if (json.dateModified) schemaDate = json.dateModified;
    } catch {
      // JSON 파싱 실패 무시
    }
  });

  const dates = [...datePatterns, schemaDate].filter(Boolean);
  const hasDate = dates.length > 0;

  let isRecent = false;
  let dateStr = '';

  if (hasDate) {
    const latestDate = dates
      .map((d) => new Date(d!))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (latestDate) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      isRecent = latestDate > oneYearAgo;
      dateStr = latestDate.toISOString().split('T')[0];
    }
  }

  let score = 0;
  let detail = '';

  if (isRecent) {
    score = 5;
    detail = `최신 콘텐츠 확인: ${dateStr}`;
  } else if (hasDate) {
    score = 2;
    detail = `날짜 표기 있음 (${dateStr}) - 콘텐츠 업데이트 권장`;
  } else {
    score = 0;
    detail = '발행일/수정일 표기 없음 - datePublished 스키마 추가 권장';
  }

  return {
    name: '콘텐츠 최신성',
    passed: score >= 3,
    score,
    maxScore: 5,
    detail,
  };
}

export function getStructureScore(analysis: StructureAnalysis): number {
  return (
    analysis.listContent.score +
    analysis.tableUsage.score +
    analysis.headingFirst.score +
    analysis.freshness.score
  );
}
