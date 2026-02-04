import type { Grade } from '../types/geoScore.js';

/**
 * 총점을 기반으로 등급 계산
 */
export function calculateGrade(totalScore: number): Grade {
  if (totalScore >= 95) return 'A+';
  if (totalScore >= 85) return 'A';
  if (totalScore >= 78) return 'B+';
  if (totalScore >= 70) return 'B';
  if (totalScore >= 63) return 'C+';
  if (totalScore >= 55) return 'C';
  if (totalScore >= 40) return 'D';
  return 'F';
}

/**
 * 등급에 따른 설명 반환
 */
export function getGradeDescription(grade: Grade): string {
  const descriptions: Record<Grade, string> = {
    'A+': 'AI 검색 엔진 최적화 완벽',
    A: 'AI 검색 엔진 최적화 우수',
    'B+': 'AI 검색 엔진 최적화 양호',
    B: 'AI 검색 엔진 최적화 보통',
    'C+': '개선 필요',
    C: '상당한 개선 필요',
    D: '많은 개선 필요',
    F: '전면 개선 필요',
  };
  return descriptions[grade];
}

/**
 * 등급에 따른 색상 반환 (Mantine 색상)
 */
export function getGradeColor(grade: Grade): string {
  const colors: Record<Grade, string> = {
    'A+': 'teal',
    A: 'green',
    'B+': 'lime',
    B: 'yellow',
    'C+': 'orange',
    C: 'orange',
    D: 'red',
    F: 'red',
  };
  return colors[grade];
}
