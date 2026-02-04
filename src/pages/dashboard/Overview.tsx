import { useState, useEffect, useMemo } from 'react';
import { Grid, Title, Text, Stack, Group, Button, Alert, Badge, Select, Center } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
  IconTrendingUp,
  IconPercentage,
  IconHash,
  IconSearch,
  IconRefresh,
  IconAlertCircle,
  IconBuilding,
} from '@tabler/icons-react';
import { MetricCard, ChartCard, OverviewSkeleton } from '../../components/ui';
import { getStats, getQueries, getBrands } from '../../services/api';
import type { Stats, MonitoredQuery, TestResult, Brand } from '../../types';
import { AI_ENGINES as ENGINES } from '../../types';

export function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, queriesData, brandsData] = await Promise.all([
        getStats(),
        getQueries(),
        getBrands(),
      ]);
      setStats(statsData);
      setQueries(queriesData.queries);
      setBrands(brandsData.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // 브랜드 선택 옵션
  const brandOptions = useMemo(() => {
    return [
      { value: 'all', label: '전체 브랜드' },
      ...brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
      })),
    ];
  }, [brands]);

  // 선택된 브랜드 기준 필터링된 통계
  const filteredStats = useMemo(() => {
    if (!stats) return null;
    if (!selectedBrandId || selectedBrandId === 'all') return stats;

    const selectedBrand = stats.brandStats?.find((bs) => bs.brandId === selectedBrandId);
    if (!selectedBrand) return stats;

    // 해당 브랜드의 결과만 필터링
    const filteredResults = stats.recentResults.filter((result) => {
      const brandResult = result.brandResults?.find((br) => br.brandId === selectedBrandId);
      return brandResult !== undefined;
    });

    return {
      ...stats,
      totalTests: selectedBrand.totalTests,
      citationRate: selectedBrand.citationRate,
      citedCount: selectedBrand.citedCount,
      recentResults: filteredResults,
    };
  }, [stats, selectedBrandId]);

  // 선택된 브랜드 정보
  const selectedBrand = useMemo(() => {
    if (!selectedBrandId || selectedBrandId === 'all') return null;
    return brands.find((b) => b.id === selectedBrandId) || null;
  }, [brands, selectedBrandId]);

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red">
        {error}
      </Alert>
    );
  }

  const recentResults = filteredStats?.recentResults || [];

  // 최근 결과로 차트 데이터 생성 (브랜드 필터링 적용)
  const chartData = recentResults.slice(0, 10).reverse().map((r: TestResult, i: number) => {
    // 브랜드가 선택된 경우 해당 브랜드의 인용 여부 확인
    if (selectedBrandId && selectedBrandId !== 'all') {
      const brandResult = r.brandResults?.find((br) => br.brandId === selectedBrandId);
      return {
        name: `#${i + 1}`,
        인용: brandResult?.cited ? 1 : 0,
      };
    }
    return {
      name: `#${i + 1}`,
      인용: r.cited ? 1 : 0,
    };
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>알빠노</Title>
          <Group gap="xs">
            <Text c="dimmed" size="sm">
              AI 가시성 현황을 한눈에 확인하세요
            </Text>
            {selectedBrand && (
              <Badge variant="light" color="brand">
                {selectedBrand.name}
              </Badge>
            )}
          </Group>
        </div>
        <Group gap="sm">
          <Select
            placeholder="브랜드 선택"
            data={brandOptions}
            value={selectedBrandId || 'all'}
            onChange={(value) => setSelectedBrandId(value)}
            leftSection={<IconBuilding size={16} />}
            w={180}
            size="sm"
            allowDeselect={false}
            styles={{
              input: {
                backgroundColor: 'var(--mantine-color-gray-1)',
              },
            }}
          />
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={loadData}>
            새로고침
          </Button>
        </Group>
      </Group>

      {/* 메트릭 카드 */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <MetricCard
            title={selectedBrand ? `${selectedBrand.name} 테스트` : "전체 테스트"}
            value={filteredStats?.totalTests || 0}
            suffix="회"
            icon={<IconSearch size={20} />}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="인용률"
            value={`${filteredStats?.citationRate || 0}%`}
            icon={<IconTrendingUp size={20} />}
            color="teal"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="인용 횟수"
            value={filteredStats?.citedCount || 0}
            suffix="회"
            icon={<IconPercentage size={20} />}
            color="grape"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="등록 브랜드"
            value={brands.length}
            suffix="개"
            icon={<IconHash size={20} />}
            color="orange"
          />
        </Grid.Col>
      </Grid>

      {/* 차트 섹션 */}
      {recentResults.length > 0 ? (
        <Grid>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <ChartCard
              title="최근 테스트 결과"
              subtitle={`최근 ${Math.min(10, recentResults.length)}개 테스트`}
            >
              <BarChart
                h={300}
                data={chartData}
                dataKey="name"
                series={[{ name: '인용', color: 'teal.6' }]}
                tickLine="y"
              />
            </ChartCard>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <ChartCard
              title={selectedBrand ? `${selectedBrand.name} 현황` : "모니터링 현황"}
              subtitle={selectedBrand ? "선택된 브랜드 통계" : "등록된 쿼리 및 엔진별 통계"}
            >
              <Stack gap="md" p="md">
                <Group justify="space-between">
                  <Text>등록된 쿼리</Text>
                  <Text fw={700} size="xl">{queries.length}개</Text>
                </Group>
                <Group justify="space-between">
                  <Text>활성 쿼리</Text>
                  <Text fw={700} size="xl">{queries.filter(q => q.isActive).length}개</Text>
                </Group>
                <Group justify="space-between">
                  <Text>총 테스트</Text>
                  <Text fw={700} size="xl">{filteredStats?.totalTests || 0}회</Text>
                </Group>
                <Group justify="space-between">
                  <Text>인용 성공</Text>
                  <Text fw={700} size="xl" c="teal">{filteredStats?.citedCount || 0}회</Text>
                </Group>
                {selectedBrand && (
                  <Group justify="space-between">
                    <Text>평균 순위</Text>
                    <Text fw={700} size="xl" c="blue">
                      {stats?.brandStats?.find(bs => bs.brandId === selectedBrandId)?.avgRank
                        ? `${stats?.brandStats?.find(bs => bs.brandId === selectedBrandId)?.avgRank}위`
                        : '-'}
                    </Text>
                  </Group>
                )}
                {!selectedBrand && stats?.engineStats && stats.engineStats.length > 0 && (
                  <>
                    <Text size="sm" c="dimmed" mt="md">엔진별 통계</Text>
                    {stats.engineStats.map((es) => (
                      <Group key={es.engine} justify="space-between">
                        <Badge
                          color={es.engine === 'gemini' ? 'blue' : 'teal'}
                          variant="light"
                        >
                          {ENGINES.find(e => e.value === es.engine)?.label || es.engine}
                        </Badge>
                        <Text size="sm">
                          {es.citedCount}/{es.totalTests} ({es.citationRate}%)
                        </Text>
                      </Group>
                    ))}
                  </>
                )}
              </Stack>
            </ChartCard>
          </Grid.Col>
        </Grid>
      ) : (
        <ChartCard title="테스트 결과" actions={false}>
          <Center h={200}>
            <Stack align="center" gap="sm">
              <Text c="dimmed">아직 테스트 결과가 없습니다</Text>
              <Text size="sm" c="dimmed">쿼리 관리에서 쿼리를 추가하고 테스트해보세요</Text>
            </Stack>
          </Center>
        </ChartCard>
      )}

      {/* 최근 테스트 결과 */}
      {recentResults.length > 0 && (
        <ChartCard
          title={selectedBrand ? `${selectedBrand.name} 최근 결과` : "최근 테스트 결과"}
          subtitle="최근 5개"
        >
          <Stack gap="xs">
            {recentResults.slice(0, 5).map((result: TestResult) => {
              // 선택된 브랜드가 있으면 해당 브랜드 결과만 표시
              const brandResult = selectedBrandId && selectedBrandId !== 'all'
                ? result.brandResults?.find((br) => br.brandId === selectedBrandId)
                : null;

              return (
                <Group key={result.id} justify="space-between" p="xs" style={{ borderRadius: 8, background: 'var(--mantine-color-gray-1)' }}>
                  <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                    {result.query}
                  </Text>
                  <Group gap="xs">
                    {selectedBrandId && selectedBrandId !== 'all' ? (
                      // 선택된 브랜드의 결과만 표시
                      <Badge
                        color={brandResult?.cited ? 'teal' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {brandResult?.cited ? '인용됨' : '미인용'}
                        {brandResult?.rank ? ` #${brandResult.rank}` : ''}
                      </Badge>
                    ) : (result.brandResults?.length ?? 0) > 0 ? (
                      // 전체 브랜드 결과 표시
                      result.brandResults!.map((br) => (
                        <Badge
                          key={br.brandId}
                          color={br.cited ? 'teal' : 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {br.brandName}{br.rank ? ` #${br.rank}` : ''}
                        </Badge>
                      ))
                    ) : (
                      <Text size="sm" c={result.cited ? 'teal' : 'gray'} fw={500}>
                        {result.cited ? '인용됨' : '미인용'}
                      </Text>
                    )}
                  </Group>
                </Group>
              );
            })}
          </Stack>
        </ChartCard>
      )}
    </Stack>
  );
}
