export interface QueryTemplate {
  id: string;
  label: string;
  template: string;
  category: string;
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  { id: 'recommend', label: '추천 요청', template: '최고의 {brand} 추천해줘', category: '제품 추천' },
  { id: 'compare', label: '비교 요청', template: '{brand} vs {competitor} 비교해줘', category: '서비스 비교' },
  { id: 'review', label: '평판 조회', template: '{brand} 사용자 리뷰 어때?', category: '브랜드 평판' },
  { id: 'howto', label: '사용법', template: '{brand} 어떻게 사용하나요?', category: '기술 문의' },
  { id: 'price', label: '가격 문의', template: '{brand} 요금제 알려줘', category: '가격 문의' },
];

export function applyTemplate(template: string, brand: string, competitor?: string): string {
  let result = template.replace(/\{brand\}/g, brand);
  if (competitor) {
    result = result.replace(/\{competitor\}/g, competitor);
  } else {
    result = result.replace(/\{competitor\}/g, '경쟁사');
  }
  return result;
}
