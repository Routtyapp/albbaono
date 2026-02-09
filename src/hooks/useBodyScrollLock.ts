import { useEffect } from 'react';

/**
 * 모달이 열릴 때 body 스크롤을 막되, 스크롤바가 사라지면서
 * 발생하는 레이아웃 깨짐(콘텐츠 점프)을 paddingRight 보상으로 방지한다.
 *
 * Mantine Modal의 lockScroll={false}와 함께 사용한다.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [locked]);
}
