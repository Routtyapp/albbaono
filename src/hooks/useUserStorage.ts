import { useAuth } from '../contexts/AuthContext';

/**
 * 사용자별 localStorage 접근을 위한 훅
 * 로그인한 사용자의 ID를 기반으로 키를 생성하여 데이터 분리
 */
export function useUserStorage() {
  const { user } = useAuth();

  const getKey = (baseKey: string) => {
    if (!user?.id) return null;
    return `${user.id}:${baseKey}`;
  };

  const getItem = <T>(baseKey: string, defaultValue: T): T => {
    const key = getKey(baseKey);
    if (!key) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const setItem = <T>(baseKey: string, value: T): void => {
    const key = getKey(baseKey);
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const removeItem = (baseKey: string): void => {
    const key = getKey(baseKey);
    if (!key) return;

    localStorage.removeItem(key);
  };

  return {
    getItem,
    setItem,
    removeItem,
    isReady: !!user?.id,
  };
}
