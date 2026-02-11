import { useState, useEffect, useMemo } from 'react';
import { Stack, Text, Alert, SegmentedControl, Group, Button, Paper } from '@mantine/core';
import { AreaChart, BarChart } from '@mantine/charts';
import { IconAlertCircle, IconTrendingUp, IconPlayerPlay } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { ChartCard, TrendSkeleton } from '../../components/ui';
import { getTrends } from '../../services/stats';
import type { TrendData } from '../../types';

type Range = 'week' | 'month' | 'quarter';

const RANGE_OPTIONS = [
  { value: 'week', label: '1주' },
  { value: 'month', label: '1개월' },
  { value: 'quarter', label: '3개월' },
];

const ENGINE_COLORS: Record<string, string> = {
  ChatGPT: 'grape.6',
  Gemini: 'blue.6',
};


export function Trend() {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('month');
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trendData = await getTrends(range);
      setData(trendData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 엔진별 데이터를 병합 AreaChart용 포맷으로 변환
  const engineChartData = useMemo(() => {
    if (!data) return [];
    const engines = Object.keys(data.byEngine);
    // 모든 날짜를 수집
    const dateSet = new Set<string>();
    for (const pts of Object.values(data.byEngine)) {
      for (const p of pts) dateSet.add(p.date);
    }
    const dates = [...dateSet].sort();
    return dates.map((date) => {
      const entry: Record<string, string | number> = { date };
      for (const eng of engines) {
        const pt = data.byEngine[eng]?.find((p) => p.date === date);
        entry[eng] = pt ? pt.citationRate : 0;
      }
      return entry;
    });
  }, [data]);

  // 카테고리 비교 BarChart용 데이터
  const categoryChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byCategory).map(([category, points]) => {
      const totalTests = points.reduce((s, p) => s + p.totalTests, 0);
      const citedCount = points.reduce((s, p) => s + p.citedCount, 0);
      const citationRate = totalTests > 0 ? Math.round((citedCount / totalTests) * 1000) / 10 : 0;
      return { category, citationRate };
    }).sort((a, b) => b.citationRate - a.citationRate);
  }, [data]);

  if (isLoading) return <TrendSkeleton />;

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" title="오류">
        {error}
      </Alert>
    );
  }

  const isEmpty = !data || data.overall.length === 0;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconTrendingUp size={24} />
          <Text size="xl">트렌드 분석</Text>
        </Group>
        <SegmentedControl
          value={range}
          onChange={(v) => setRange(v as Range)}
          data={RANGE_OPTIONS}
        />
      </Group>

      {isEmpty ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <IconTrendingUp size={48} stroke={1.5} color="gray" />
            <Text>선택한 기간에 데이터가 없습니다</Text>
            <Text size="sm" c="dimmed" ta="center" maw={400}>
              트렌드 차트를 보려면 테스트 결과가 필요합니다.
              쿼리 운영에서 테스트를 실행하면 시간에 따른 인용률 변화를 분석할 수 있습니다.
            </Text>
            <Button
              variant="light"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={() => navigate('/dashboard/query-ops')}
            >
              쿼리 운영으로 이동
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          {/* 전체 인용률 추이 */}
          <ChartCard title="전체 인용률 추이" subtitle="일자별 인용률 및 테스트 수">
            <AreaChart
              h={300}
              data={data!.overall.map((p) => ({
                date: p.date,
                '인용률': p.citationRate,
                '테스트 수': p.totalTests,
              }))}
              dataKey="date"
              series={[
                { name: '인용률', color: 'teal.6' },
              ]}
              curveType="monotone"
              valueFormatter={(value) => `${value}%`}
              tickLine="xy"
              gridAxis="xy"
            />
          </ChartCard>

          {/* 엔진별 인용률 추이 */}
          {Object.keys(data!.byEngine).length > 0 && (
            <ChartCard title="엔진별 인용률 추이" subtitle="AI 엔진별 인용률 비교">
              <AreaChart
                h={300}
                data={engineChartData}
                dataKey="date"
                series={Object.keys(data!.byEngine).map((eng) => ({
                  name: eng,
                  color: ENGINE_COLORS[eng] || 'gray.6',
                }))}
                curveType="monotone"
                valueFormatter={(value) => `${value}%`}
                tickLine="xy"
                gridAxis="xy"
              />
            </ChartCard>
          )}

          {/* 카테고리별 인용률 비교 */}
          {categoryChartData.length > 0 && (
            <ChartCard title="카테고리별 인용률" subtitle="카테고리별 평균 인용률 비교">
              <BarChart
                h={Math.max(200, categoryChartData.length * 50)}
                data={categoryChartData}
                dataKey="category"
                orientation="vertical"
                series={[
                  { name: 'citationRate', color: 'teal.6', label: '인용률 (%)' },
                ]}
                tickLine="none"
                gridAxis="none"
                barProps={{ radius: 4 }}
                valueFormatter={(value) => `${value}%`}
              />
            </ChartCard>
          )}
        </>
      )}
    </Stack>
  );
}
