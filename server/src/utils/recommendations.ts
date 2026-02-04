import type { Categories, Recommendation } from '../types/geoScore.js';

/**
 * 분석 결과를 바탕으로 개선 권장사항 생성
 */
export function generateRecommendations(categories: Categories): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Structure 권장사항
  for (const item of categories.structure.items) {
    if (!item.passed) {
      recommendations.push(createRecommendation('structure', item.name, item.detail, item.maxScore));
    }
  }

  // Schema 권장사항
  for (const item of categories.schema.items) {
    if (!item.passed) {
      recommendations.push(createRecommendation('schema', item.name, item.detail, item.maxScore));
    }
  }

  // URL 권장사항
  for (const item of categories.url.items) {
    if (!item.passed) {
      recommendations.push(createRecommendation('url', item.name, item.detail, item.maxScore));
    }
  }

  // Meta 권장사항
  for (const item of categories.meta.items) {
    if (!item.passed) {
      recommendations.push(createRecommendation('meta', item.name, item.detail, item.maxScore));
    }
  }

  // Content 권장사항
  for (const item of categories.content.items) {
    if (!item.passed) {
      recommendations.push(createRecommendation('content', item.name, item.detail, item.maxScore));
    }
  }

  // 우선순위 순으로 정렬
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

function createRecommendation(
  category: keyof Categories,
  name: string,
  detail: string,
  maxScore: number
): Recommendation {
  const suggestions = getSuggestion(category, name);

  return {
    priority: getPriority(maxScore),
    category,
    issue: `${name}: ${detail}`,
    suggestion: suggestions.suggestion,
    impact: suggestions.impact,
  };
}

function getPriority(maxScore: number): 'high' | 'medium' | 'low' {
  if (maxScore >= 7) return 'high';
  if (maxScore >= 5) return 'medium';
  return 'low';
}

function getSuggestion(
  category: keyof Categories,
  name: string
): { suggestion: string; impact: string } {
  const suggestions: Record<string, { suggestion: string; impact: string }> = {
    // Structure
    '목록형 콘텐츠': {
      suggestion: '핵심 정보를 <ul> 또는 <ol> 목록으로 정리하세요. AI는 목록 형태의 정보를 50% 더 자주 인용합니다.',
      impact: '최대 +7점',
    },
    '표 형식 사용': {
      suggestion: '비교 데이터나 스펙을 <table>로 정리하고 <thead>와 <th>를 포함하세요.',
      impact: '최대 +6점, 인용률 2.5배 증가',
    },
    '두괄식 작성': {
      suggestion: '각 섹션의 첫 40-60단어 안에 핵심 답변을 배치하세요.',
      impact: '최대 +7점',
    },
    '콘텐츠 최신성': {
      suggestion: 'datePublished, dateModified 스키마를 추가하고 콘텐츠를 정기적으로 업데이트하세요.',
      impact: '최대 +5점',
    },

    // Schema
    'Product 스키마': {
      suggestion: 'Product 스키마에 name, description, price, availability, brand, sku를 포함하세요.',
      impact: '최대 +10점',
    },
    'FAQ 스키마': {
      suggestion: 'FAQPage 스키마를 추가하고 최소 5개 이상의 Q&A를 포함하세요.',
      impact: '최대 +5점',
    },
    'HowTo 스키마': {
      suggestion: '가이드 콘텐츠에 HowTo 스키마를 추가하세요.',
      impact: '최대 +5점',
    },
    'Review 스키마': {
      suggestion: 'AggregateRating 스키마에 ratingValue와 reviewCount를 포함하세요.',
      impact: '최대 +5점',
    },

    // URL
    '하이픈 사용': {
      suggestion: 'URL에서 언더스코어(_)를 하이픈(-)으로 변경하세요.',
      impact: '+5점',
    },
    '소문자 사용': {
      suggestion: 'URL을 모두 소문자로 변경하세요.',
      impact: '+5점',
    },
    '영문 URL': {
      suggestion: '한글 URL을 영문으로 변경하세요 (예: /검색 → /search).',
      impact: '+5점',
    },

    // Meta
    'Title 최적화': {
      suggestion: 'Title을 50-60자로 조정하고 쇼핑 의도 키워드(추천, 비교, 가이드 등)를 포함하세요.',
      impact: '최대 +7점',
    },
    'Description 최적화': {
      suggestion: 'Description을 120-160자로 작성하고 "~를 찾는", "~를 위한" 같은 의도 문구를 포함하세요.',
      impact: '최대 +7점',
    },
    'Open Graph': {
      suggestion: 'og:title, og:description, og:image 태그를 추가하세요.',
      impact: '최대 +3점',
    },
    'Canonical URL': {
      suggestion: '<link rel="canonical" href="..."> 태그를 추가하세요.',
      impact: '최대 +3점',
    },

    // Content
    '데이터/통계': {
      suggestion: '구체적인 수치, 통계, 퍼센트 데이터를 추가하세요. AI는 정량적 데이터를 신뢰합니다.',
      impact: '최대 +5점',
    },
    '출처 표기': {
      suggestion: '신뢰할 수 있는 외부 소스 링크와 인용을 추가하세요.',
      impact: '최대 +5점',
    },
    'HTML vs 이미지': {
      suggestion: '텍스트 이미지를 HTML 텍스트로 변환하고 표/목록을 HTML로 작성하세요.',
      impact: '최대 +5점',
    },
  };

  return (
    suggestions[name] || {
      suggestion: '해당 항목을 개선하세요.',
      impact: '점수 향상',
    }
  );
}
