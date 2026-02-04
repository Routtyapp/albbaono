import * as cheerio from 'cheerio';
import type { ContentAnalysis } from '../../types/geoScore.js';

/**
 * 콘텐츠 품질 분석기 (권위 및 신뢰성)
 * - 데이터/통계 포함 (5점)
 * - 출처 표기 (5점)
 * - HTML vs 이미지 (5점)
 * 총 15점 만점
 */
export function analyzeContent(html: string): ContentAnalysis {
  const $ = cheerio.load(html);

  return {
    hasStatistics: analyzeStatistics($),
    hasCitations: analyzeCitations($),
    htmlVsImage: analyzeHtmlVsImage($),
  };
}

function analyzeStatistics($: cheerio.CheerioAPI): ContentAnalysis['hasStatistics'] {
  const bodyText = $('body').text();

  // 통계 패턴 검사
  const patterns = {
    // 퍼센트 (예: 50%, 72.5%)
    percentage: /\d+(?:\.\d+)?%/g,
    // 숫자 + 단위 (예: 100만, 2.5배, 30억)
    numberWithUnit: /\d+(?:\.\d+)?(?:만|억|천|배|개|건|명|원|달러|%)/g,
    // 연도 (예: 2024년, 2023)
    year: /20[1-2]\d년?/g,
    // 통계 키워드
    statKeywords: /(?:통계|조사|연구|리포트|보고서|데이터|분석|결과|기준)/g,
  };

  const percentMatches = bodyText.match(patterns.percentage) || [];
  const numberMatches = bodyText.match(patterns.numberWithUnit) || [];
  const yearMatches = bodyText.match(patterns.year) || [];
  const keywordMatches = bodyText.match(patterns.statKeywords) || [];

  const totalMatches =
    percentMatches.length +
    numberMatches.length +
    Math.min(yearMatches.length, 3) +
    keywordMatches.length;

  let score = 0;
  let detail = '';

  if (totalMatches >= 10) {
    score = 5;
    detail = `풍부한 데이터 포함: 통계 ${percentMatches.length}개, 수치 ${numberMatches.length}개`;
  } else if (totalMatches >= 5) {
    score = 4;
    detail = `적절한 데이터 포함: 통계/수치 ${totalMatches}개`;
  } else if (totalMatches >= 2) {
    score = 2;
    detail = `기본 데이터 존재 - 더 많은 통계/수치 추가 권장`;
  } else {
    score = 0;
    detail = '구체적인 데이터/통계 부족 - AI 신뢰도 향상을 위해 수치 데이터 추가 권장';
  }

  return {
    name: '데이터/통계',
    passed: score >= 3,
    score,
    maxScore: 5,
    detail,
  };
}

function analyzeCitations($: cheerio.CheerioAPI): ContentAnalysis['hasCitations'] {
  // 외부 링크 분석
  const externalLinks: string[] = [];
  const internalLinks: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http://') || href.startsWith('https://')) {
      externalLinks.push(href);
    } else if (href.startsWith('/') || !href.includes('://')) {
      internalLinks.push(href);
    }
  });

  // 인용 관련 요소 검사
  const blockquotes = $('blockquote').length;
  const citeElements = $('cite').length;
  const footnotes = $('[class*="footnote"], [id*="footnote"], [class*="reference"]').length;

  // 신뢰할 수 있는 도메인 참조 검사
  const trustedDomains = [
    'wikipedia.org',
    'gov.kr',
    'go.kr',
    'ac.kr',
    'edu',
    'bloomberg.com',
    'reuters.com',
    'statista.com',
  ];
  const trustedRefs = externalLinks.filter((link) =>
    trustedDomains.some((domain) => link.includes(domain))
  ).length;

  const citationScore =
    Math.min(externalLinks.length, 5) +
    blockquotes * 2 +
    citeElements * 2 +
    trustedRefs * 2 +
    footnotes;

  let score = 0;
  let detail = '';

  if (citationScore >= 10 || trustedRefs >= 2) {
    score = 5;
    detail = `출처 표기 우수: 외부 링크 ${externalLinks.length}개, 인용 ${blockquotes}개`;
  } else if (citationScore >= 5) {
    score = 4;
    detail = `출처 표기 양호: 외부 링크 ${externalLinks.length}개`;
  } else if (externalLinks.length >= 2 || blockquotes >= 1) {
    score = 2;
    detail = '기본 출처 존재 - 권위있는 출처 추가 권장';
  } else {
    score = 0;
    detail = '출처/인용 표기 없음 - 외부 참조 링크 추가 권장';
  }

  return {
    name: '출처 표기',
    passed: score >= 3,
    score,
    maxScore: 5,
    detail,
  };
}

function analyzeHtmlVsImage($: cheerio.CheerioAPI): ContentAnalysis['htmlVsImage'] {
  // 이미지 분석
  const images = $('img');
  let imagesWithAlt = 0;
  let infographicSuspects = 0;

  images.each((_, img) => {
    const $img = $(img);
    const alt = $img.attr('alt') || '';
    const src = $img.attr('src') || '';
    const width = parseInt($img.attr('width') || '0');
    const height = parseInt($img.attr('height') || '0');

    if (alt) imagesWithAlt++;

    // 인포그래픽/텍스트 이미지 의심 (넓은 이미지, 특정 키워드)
    if (
      width > 600 ||
      src.includes('infographic') ||
      src.includes('chart') ||
      alt.includes('표') ||
      alt.includes('차트') ||
      alt.includes('그래프')
    ) {
      infographicSuspects++;
    }
  });

  // 텍스트 콘텐츠 비율
  const textContent = $('p, li, td, th, h1, h2, h3, h4, h5, h6')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
  const textLength = textContent.length;

  // HTML 테이블 사용
  const tables = $('table').length;
  const lists = $('ul, ol').length;
  const structuredElements = tables + lists;

  let score = 0;
  let detail = '';

  // 텍스트 충분하고 구조화된 요소 있음
  if (textLength > 1000 && structuredElements >= 2) {
    score = 5;
    detail = `HTML 구조화 우수: 텍스트 ${textLength}자, 표/목록 ${structuredElements}개`;
  } else if (textLength > 500 && structuredElements >= 1) {
    score = 4;
    detail = `HTML 구조화 양호: 텍스트 ${textLength}자`;
  } else if (textLength > 300) {
    score = 3;
    detail = '기본 텍스트 콘텐츠 존재 - 구조화 요소(표, 목록) 추가 권장';
  } else if (infographicSuspects > 2) {
    score = 1;
    detail = '이미지 의존도 높음 - 텍스트 이미지를 HTML로 변환 권장';
  } else {
    score = 2;
    detail = '텍스트 콘텐츠 부족 - AI가 읽을 수 있는 HTML 텍스트 추가 권장';
  }

  // 이미지 alt 태그 보너스/감점
  if (images.length > 0) {
    const altRatio = imagesWithAlt / images.length;
    if (altRatio < 0.5) {
      detail += ' | 이미지 alt 태그 부족';
    }
  }

  return {
    name: 'HTML vs 이미지',
    passed: score >= 3,
    score,
    maxScore: 5,
    detail,
  };
}

export function getContentScore(analysis: ContentAnalysis): number {
  return (
    analysis.hasStatistics.score +
    analysis.hasCitations.score +
    analysis.htmlVsImage.score
  );
}
