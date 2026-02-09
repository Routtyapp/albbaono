import { Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { Reports } from './Reports';
import { Insights } from './Insights';

const validTabs = new Set(['reports', 'insights']);

export function ReportsInsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = validTabs.has(tabParam ?? '') ? (tabParam as 'reports' | 'insights') : 'reports';

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <Tabs value={tab} onChange={handleTabChange}>
      <Tabs.List mb="md">
        <Tabs.Tab value="reports">리포트</Tabs.Tab>
        <Tabs.Tab value="insights">인사이트</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="reports">
        <Reports />
      </Tabs.Panel>
      <Tabs.Panel value="insights">
        <Insights />
      </Tabs.Panel>
    </Tabs>
  );
}
