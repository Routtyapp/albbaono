import { Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { ScoreOverview } from './ScoreOverview';
import { ScoreAnalysis } from './ScoreAnalysis';
import { ScoreCompetitors } from './ScoreCompetitors';

const validTabs = new Set(['overview', 'technical', 'competitors']);

export function ScorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = validTabs.has(tabParam ?? '') ? (tabParam as 'overview' | 'technical' | 'competitors') : 'overview';

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
        <Tabs.Tab value="technical">기술 분석</Tabs.Tab>
        <Tabs.Tab value="competitors">경쟁사</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="overview">
        <ScoreOverview />
      </Tabs.Panel>
      <Tabs.Panel value="technical">
        <ScoreAnalysis />
      </Tabs.Panel>
      <Tabs.Panel value="competitors">
        <ScoreCompetitors />
      </Tabs.Panel>
    </Tabs>
  );
}
