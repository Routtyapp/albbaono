import * as cheerio from 'cheerio';
import type { SchemaAnalysis } from '../../types/geoScore.js';

/**
 * 스키마 마크업 분석기
 * - Product 스키마 (10점)
 * - FAQ 스키마 (5점)
 * - HowTo 스키마 (5점)
 * - Review 스키마 (5점)
 * 총 25점 만점
 */
export function analyzeSchema(html: string): SchemaAnalysis {
  const $ = cheerio.load(html);

  // JSON-LD 스키마 추출
  const schemas: any[] = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const json = JSON.parse($(script).html() || '');
      if (Array.isArray(json)) {
        schemas.push(...json);
      } else {
        schemas.push(json);
      }
    } catch {
      // JSON 파싱 실패 무시
    }
  });

  // 마이크로데이터 검사
  const hasMicrodata = {
    product: $('[itemtype*="schema.org/Product"]').length > 0,
    faq: $('[itemtype*="schema.org/FAQPage"]').length > 0,
    howTo: $('[itemtype*="schema.org/HowTo"]').length > 0,
    review: $('[itemtype*="schema.org/Review"]').length > 0,
  };

  return {
    productSchema: analyzeProductSchema(schemas, hasMicrodata.product),
    faqSchema: analyzeFaqSchema(schemas, hasMicrodata.faq),
    howToSchema: analyzeHowToSchema(schemas, hasMicrodata.howTo),
    reviewSchema: analyzeReviewSchema(schemas, hasMicrodata.review),
  };
}

function findSchemaByType(schemas: any[], type: string): any | null {
  for (const schema of schemas) {
    if (schema['@type'] === type) return schema;
    if (Array.isArray(schema['@type']) && schema['@type'].includes(type)) return schema;
    if (schema['@graph']) {
      const found = findSchemaByType(schema['@graph'], type);
      if (found) return found;
    }
  }
  return null;
}

function analyzeProductSchema(schemas: any[], hasMicrodata: boolean): SchemaAnalysis['productSchema'] {
  const product = findSchemaByType(schemas, 'Product');

  if (!product && !hasMicrodata) {
    return {
      name: 'Product 스키마',
      passed: false,
      score: 0,
      maxScore: 10,
      detail: 'Product 스키마 없음 - 제품 페이지인 경우 추가 필수',
    };
  }

  if (hasMicrodata && !product) {
    return {
      name: 'Product 스키마',
      passed: true,
      score: 5,
      maxScore: 10,
      detail: 'Product 마이크로데이터 존재 - JSON-LD 형식 권장',
    };
  }

  // 필수 속성 체크
  const requiredFields = ['name', 'description'];
  const recommendedFields = ['image', 'brand', 'sku', 'offers'];
  const offerFields = ['price', 'priceCurrency', 'availability'];

  const hasRequired = requiredFields.every((field) => product[field]);
  const hasRecommended = recommendedFields.filter((field) => product[field]).length;

  // offers 내부 필드 체크
  let hasOfferDetails = 0;
  if (product.offers) {
    const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
    hasOfferDetails = offerFields.filter((field) => offers[field]).length;
  }

  const totalFields = hasRecommended + hasOfferDetails;
  let score = 0;
  let detail = '';
  const missingFields: string[] = [];

  if (!hasRequired) {
    score = 2;
    if (!product.name) missingFields.push('name');
    if (!product.description) missingFields.push('description');
  } else if (totalFields >= 6) {
    score = 10;
    detail = 'Product 스키마 완벽: 모든 권장 필드 포함';
  } else if (totalFields >= 4) {
    score = 8;
    if (!product.offers?.price) missingFields.push('price');
    if (!product.offers?.availability) missingFields.push('availability');
  } else if (totalFields >= 2) {
    score = 5;
    if (!product.brand) missingFields.push('brand');
    if (!product.sku) missingFields.push('sku');
    if (!product.offers) missingFields.push('offers');
  } else {
    score = 3;
  }

  if (missingFields.length > 0) {
    detail = `Product 스키마 존재 - 누락 필드: ${missingFields.join(', ')}`;
  } else if (!detail) {
    detail = 'Product 스키마 양호';
  }

  return {
    name: 'Product 스키마',
    passed: score >= 5,
    score,
    maxScore: 10,
    detail,
  };
}

function analyzeFaqSchema(schemas: any[], hasMicrodata: boolean): SchemaAnalysis['faqSchema'] {
  const faq = findSchemaByType(schemas, 'FAQPage');

  if (!faq && !hasMicrodata) {
    return {
      name: 'FAQ 스키마',
      passed: false,
      score: 0,
      maxScore: 5,
      detail: 'FAQ 스키마 없음 - 자주 묻는 질문 섹션 추가 권장',
    };
  }

  const mainEntity = faq?.mainEntity;
  const questionCount = Array.isArray(mainEntity) ? mainEntity.length : mainEntity ? 1 : 0;

  let score = 0;
  let detail = '';

  if (questionCount >= 5) {
    score = 5;
    detail = `FAQ 스키마 완벽: ${questionCount}개 Q&A 포함`;
  } else if (questionCount >= 3) {
    score = 4;
    detail = `FAQ 스키마 양호: ${questionCount}개 Q&A - 5개 이상 권장`;
  } else if (questionCount >= 1 || hasMicrodata) {
    score = 2;
    detail = 'FAQ 스키마 존재 - 더 많은 Q&A 추가 권장';
  }

  return {
    name: 'FAQ 스키마',
    passed: score >= 3,
    score,
    maxScore: 5,
    detail,
  };
}

function analyzeHowToSchema(schemas: any[], hasMicrodata: boolean): SchemaAnalysis['howToSchema'] {
  const howTo = findSchemaByType(schemas, 'HowTo');

  if (!howTo && !hasMicrodata) {
    return {
      name: 'HowTo 스키마',
      passed: false,
      score: 0,
      maxScore: 5,
      detail: 'HowTo 스키마 없음 - 가이드/튜토리얼 콘텐츠인 경우 추가 권장',
    };
  }

  const steps = howTo?.step;
  const stepCount = Array.isArray(steps) ? steps.length : steps ? 1 : 0;

  let score = 0;
  let detail = '';

  if (stepCount >= 5) {
    score = 5;
    detail = `HowTo 스키마 완벽: ${stepCount}개 단계 포함`;
  } else if (stepCount >= 3) {
    score = 4;
    detail = `HowTo 스키마 양호: ${stepCount}개 단계`;
  } else if (stepCount >= 1 || hasMicrodata) {
    score = 2;
    detail = 'HowTo 스키마 존재 - 상세 단계 추가 권장';
  }

  return {
    name: 'HowTo 스키마',
    passed: score >= 3,
    score,
    maxScore: 5,
    detail,
  };
}

function analyzeReviewSchema(schemas: any[], hasMicrodata: boolean): SchemaAnalysis['reviewSchema'] {
  const review = findSchemaByType(schemas, 'Review');
  const aggregateRating = findSchemaByType(schemas, 'AggregateRating');
  const product = findSchemaByType(schemas, 'Product');

  const hasReviewInProduct = product?.review || product?.aggregateRating;

  if (!review && !aggregateRating && !hasReviewInProduct && !hasMicrodata) {
    return {
      name: 'Review 스키마',
      passed: false,
      score: 0,
      maxScore: 5,
      detail: 'Review/Rating 스키마 없음 - 리뷰 데이터가 있다면 스키마 추가 권장',
    };
  }

  let score = 0;
  let detail = '';

  if (aggregateRating || product?.aggregateRating) {
    const rating = aggregateRating || product?.aggregateRating;
    const hasRatingValue = rating?.ratingValue;
    const hasReviewCount = rating?.reviewCount || rating?.ratingCount;

    if (hasRatingValue && hasReviewCount) {
      score = 5;
      detail = `Review 스키마 완벽: 평점 ${rating.ratingValue}, 리뷰 ${hasReviewCount}개`;
    } else {
      score = 3;
      detail = 'AggregateRating 존재 - reviewCount 추가 권장';
    }
  } else if (review || hasMicrodata) {
    score = 2;
    detail = 'Review 스키마 존재 - AggregateRating 추가 권장';
  }

  return {
    name: 'Review 스키마',
    passed: score >= 3,
    score,
    maxScore: 5,
    detail,
  };
}

export function getSchemaScore(analysis: SchemaAnalysis): number {
  return (
    analysis.productSchema.score +
    analysis.faqSchema.score +
    analysis.howToSchema.score +
    analysis.reviewSchema.score
  );
}
