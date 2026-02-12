import { Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { QueryListPanel } from './QueryListPanel';
import { SchedulerPage } from './SchedulerPage';

const validTabs = new Set(['queries', 'scheduler']);

export function QueryOpsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = validTabs.has(tabParam ?? '') ? tabParam! : 'queries';

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <Tabs value={tab} onChange={handleTabChange}>
      <Tabs.List mb="md">
        <Tabs.Tab value="queries">질문 관리</Tabs.Tab>
        <Tabs.Tab value="scheduler">질문 예약</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="queries">
        <QueryListPanel />
      </Tabs.Panel>
      <Tabs.Panel value="scheduler">
        <SchedulerPage />
      </Tabs.Panel>
    </Tabs>
  );
}
