import { Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { QueryListPanel } from './QueryListPanel';
import { QueryHistoryPanel } from './QueryHistoryPanel';

const validTabs = new Set(['queries', 'history']);

export function QueryOpsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = validTabs.has(tabParam ?? '') ? (tabParam as 'queries' | 'history') : 'queries';

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <Tabs value={tab} onChange={handleTabChange}>
      <Tabs.List mb="md">
        <Tabs.Tab value="queries">쿼리 목록</Tabs.Tab>
        <Tabs.Tab value="history">테스트 이력</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="queries">
        <QueryListPanel />
      </Tabs.Panel>
      <Tabs.Panel value="history">
        <QueryHistoryPanel />
      </Tabs.Panel>
    </Tabs>
  );
}
