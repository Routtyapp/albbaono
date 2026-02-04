import * as cheerio from 'cheerio';
import type { MetaAnalysis } from '../../types/geoScore.js';

/**
 * 메타태그 분석기
 * - Title 최적화 (7점)
 * - Description 최적화 (7점)
 * - Open Graph (3점)
 * - Canonical URL (3점)
 * 총 20점 만점
 */
export function analyzeMeta(html: string, url: string): MetaAnalysis {
  const $ = cheerio.load(html);

  return {
    titleOptimization: analyzeTitleOptimization($),
    descriptionOptimization: analyzeDescriptionOptimization($),
    openGraph: analyzeOpenGraph($),
    canonicalUrl: analyzeCanonicalUrl($, url),
  };
}

function analyzeTitleOptimization($: cheerio.CheerioAPI): MetaAnalysis['titleOptimization'] {
  const title = $('title').text().trim();
  const metaTitle = $('meta[property="og:title"]').attr('content')?.trim();

  const effectiveTitle = title || metaTitle || '';

  if (!effectiveTitle) {
    return {
      name: 'Title 최적화',
      passed: false,
      score: 0,
      maxScore: 7,
      detail: 'Title 태그 없음 - 필수 요소',
    };
  }

  const length = effectiveTitle.length;
  let score = 0;
  let detail = '';

  // 쇼핑 의도 키워드 검사
  const intentKeywords = [
    '추천', '비교', '리뷰', '가격', '구매', '최고', '베스트',
    '가이드', '방법', '사용법', '선택', '순위', '용', '위한',
  ];
  const hasIntentKeyword = intentKeywords.some((kw) => effectiveTitle.includes(kw));

  // 길이 평가 (50-60자가 이상적)
  if (length >= 50 && length <= 60) {
    score = 5;
    detail = `Title 길이 최적 (${length}자)`;
  } else if (length >= 40 && length <= 70) {
    score = 4;
    detail = `Title 길이 양호 (${length}자) - 50-60자 권장`;
  } else if (length >= 20 && length < 40) {
    score = 2;
    detail = `Title 너무 짧음 (${length}자) - 50-60자 권장`;
  } else if (length > 70) {
    score = 2;
    detail = `Title 너무 김 (${length}자) - 검색 결과에서 잘릴 수 있음`;
  } else {
    score = 1;
    detail = `Title 길이 부족 (${length}자)`;
  }

  // 의도 키워드 보너스
  if (hasIntentKeyword) {
    score = Math.min(score + 2, 7);
    detail += ' | 쇼핑 의도 키워드 포함';
  }

  return {
    name: 'Title 최적화',
    passed: score >= 4,
    score,
    maxScore: 7,
    detail,
  };
}

function analyzeDescriptionOptimization($: cheerio.CheerioAPI): MetaAnalysis['descriptionOptimization'] {
  const description = $('meta[name="description"]').attr('content')?.trim();
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim();

  const effectiveDesc = description || ogDescription || '';

  if (!effectiveDesc) {
    return {
      name: 'Description 최적화',
      passed: false,
      score: 0,
      maxScore: 7,
      detail: 'Meta Description 없음 - 필수 요소',
    };
  }

  const length = effectiveDesc.length;
  let score = 0;
  let detail = '';

  // 쇼핑 의도 문구 검사
  const intentPhrases = [
    '을 찾는', '를 찾는', '을 위한', '를 위한', '보다',
    '추천', '비교', '방법', '가이드', '완벽', '최신',
  ];
  const hasIntentPhrase = intentPhrases.some((phrase) => effectiveDesc.includes(phrase));

  // 길이 평가 (120-160자가 이상적)
  if (length >= 120 && length <= 160) {
    score = 5;
    detail = `Description 길이 최적 (${length}자)`;
  } else if (length >= 100 && length <= 180) {
    score = 4;
    detail = `Description 길이 양호 (${length}자)`;
  } else if (length >= 50 && length < 100) {
    score = 2;
    detail = `Description 너무 짧음 (${length}자) - 120-160자 권장`;
  } else if (length > 180) {
    score = 2;
    detail = `Description 너무 김 (${length}자) - 검색 결과에서 잘릴 수 있음`;
  } else {
    score = 1;
    detail = `Description 길이 부족 (${length}자)`;
  }

  // 의도 문구 보너스
  if (hasIntentPhrase) {
    score = Math.min(score + 2, 7);
    detail += ' | 쇼핑 의도 문구 포함';
  }

  return {
    name: 'Description 최적화',
    passed: score >= 4,
    score,
    maxScore: 7,
    detail,
  };
}

function analyzeOpenGraph($: cheerio.CheerioAPI): MetaAnalysis['openGraph'] {
  const ogTags = {
    title: $('meta[property="og:title"]').attr('content'),
    description: $('meta[property="og:description"]').attr('content'),
    image: $('meta[property="og:image"]').attr('content'),
    url: $('meta[property="og:url"]').attr('content'),
    type: $('meta[property="og:type"]').attr('content'),
  };

  const essentialTags = ['title', 'description', 'image'];
  const presentTags = essentialTags.filter(
    (tag) => ogTags[tag as keyof typeof ogTags]
  );

  let score = 0;
  let detail = '';

  if (presentTags.length === 3) {
    score = 3;
    detail = 'Open Graph 태그 완벽 (title, description, image)';
  } else if (presentTags.length === 2) {
    score = 2;
    const missing = essentialTags.filter((t) => !presentTags.includes(t));
    detail = `Open Graph 양호 - 누락: ${missing.join(', ')}`;
  } else if (presentTags.length === 1) {
    score = 1;
    detail = 'Open Graph 부족 - 소셜 공유 최적화 필요';
  } else {
    score = 0;
    detail = 'Open Graph 태그 없음 - og:title, og:description, og:image 추가 권장';
  }

  return {
    name: 'Open Graph',
    passed: score >= 2,
    score,
    maxScore: 3,
    detail,
  };
}

function analyzeCanonicalUrl($: cheerio.CheerioAPI, pageUrl: string): MetaAnalysis['canonicalUrl'] {
  const canonical = $('link[rel="canonical"]').attr('href');

  if (!canonical) {
    return {
      name: 'Canonical URL',
      passed: false,
      score: 0,
      maxScore: 3,
      detail: 'Canonical URL 없음 - 중복 콘텐츠 이슈 방지를 위해 추가 권장',
    };
  }

  // Canonical URL이 현재 페이지와 일치하는지 확인
  try {
    const canonicalUrl = new URL(canonical, pageUrl);
    const currentUrl = new URL(pageUrl);

    const isMatch =
      canonicalUrl.hostname === currentUrl.hostname &&
      canonicalUrl.pathname === currentUrl.pathname;

    if (isMatch) {
      return {
        name: 'Canonical URL',
        passed: true,
        score: 3,
        maxScore: 3,
        detail: 'Canonical URL 정상 설정',
      };
    } else {
      return {
        name: 'Canonical URL',
        passed: true,
        score: 2,
        maxScore: 3,
        detail: `Canonical URL 설정됨 (다른 페이지로 지정: ${canonicalUrl.pathname})`,
      };
    }
  } catch {
    return {
      name: 'Canonical URL',
      passed: true,
      score: 1,
      maxScore: 3,
      detail: 'Canonical URL 형식 오류',
    };
  }
}

export function getMetaScore(analysis: MetaAnalysis): number {
  return (
    analysis.titleOptimization.score +
    analysis.descriptionOptimization.score +
    analysis.openGraph.score +
    analysis.canonicalUrl.score
  );
}
