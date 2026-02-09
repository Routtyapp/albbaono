import { Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { Overview } from './Overview';
import { Visibility } from './Visibility';
import { Trend } from './Trend';

const validTabs = new Set(['overview', 'visibility', 'trend']);

export function PerformancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = validTabs.has(tabParam ?? '') ? (tabParam as 'overview' | 'visibility' | 'trend') : 'overview';

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <Tabs value={tab} onChange={handleTabChange}>
      <Tabs.List mb="md">
        <Tabs.Tab value="overview">개요</Tabs.Tab>
        <Tabs.Tab value="visibility">가시성</Tabs.Tab>
        <Tabs.Tab value="trend">트렌드</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="overview">
        <Overview />
      </Tabs.Panel>
      <Tabs.Panel value="visibility">
        <Visibility />
      </Tabs.Panel>
      <Tabs.Panel value="trend">
        <Trend />
      </Tabs.Panel>
    </Tabs>
  );
}
