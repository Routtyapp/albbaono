import type { UrlAnalysis } from '../../types/geoScore.js';

/**
 * URL 규칙 분석기
 * - 하이픈 사용 여부 (5점)
 * - 소문자 사용 여부 (5점)
 * - 한글/인코딩 문자 없음 (5점)
 * 총 15점 만점
 */
export function analyzeUrl(url: string): UrlAnalysis {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return createFailedAnalysis();
  }

  const pathname = parsed.pathname;

  // 1. 하이픈 vs 언더스코어 검사
  const hasUnderscore = pathname.includes('_');
  const usesHyphens = {
    name: '하이픈 사용',
    passed: !hasUnderscore,
    score: hasUnderscore ? 0 : 5,
    maxScore: 5,
    detail: hasUnderscore
      ? `URL에 언더스코어(_) 발견: "${pathname}" - 하이픈(-) 사용 권장`
      : '하이픈 사용 규칙 준수',
  };

  // 2. 소문자 검사
  const hasUppercase = pathname !== pathname.toLowerCase();
  const isLowercase = {
    name: '소문자 사용',
    passed: !hasUppercase,
    score: hasUppercase ? 0 : 5,
    maxScore: 5,
    detail: hasUppercase
      ? `URL에 대문자 포함: "${pathname}" - 소문자 사용 권장`
      : '소문자 규칙 준수',
  };

  // 3. 인코딩 문자 검사 (한글 URL 등)
  const encodedPattern = /%[A-Fa-f0-9]{2}/;
  const hasEncodedChars = encodedPattern.test(pathname);
  const noEncodedChars = {
    name: '영문 URL',
    passed: !hasEncodedChars,
    score: hasEncodedChars ? 0 : 5,
    maxScore: 5,
    detail: hasEncodedChars
      ? `인코딩된 문자 감지: "${pathname}" - 영문 URL 사용 권장`
      : '영문 URL 규칙 준수',
  };

  return {
    usesHyphens,
    isLowercase,
    noEncodedChars,
  };
}

function createFailedAnalysis(): UrlAnalysis {
  const failedItem = {
    name: '',
    passed: false,
    score: 0,
    maxScore: 5,
    detail: 'URL 파싱 실패',
  };

  return {
    usesHyphens: { ...failedItem, name: '하이픈 사용' },
    isLowercase: { ...failedItem, name: '소문자 사용' },
    noEncodedChars: { ...failedItem, name: '영문 URL' },
  };
}

export function getUrlScore(analysis: UrlAnalysis): number {
  return (
    analysis.usesHyphens.score +
    analysis.isLowercase.score +
    analysis.noEncodedChars.score
  );
}
