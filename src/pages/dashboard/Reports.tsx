import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  ThemeIcon,
  Alert,
  Menu,
  Center,
  Progress,
  Tooltip,
  SimpleGrid,
} from '@mantine/core';
import { Sparkline } from '@mantine/charts';
import {
  IconFileDescription,
  IconAlertCircle,
  IconRefresh,
  IconChevronDown,
  IconCalendarWeek,
  IconCalendarMonth,
  IconSelect,
  IconPlayerPlay,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStats, generateReport, downloadReportPdf, deleteReport } from '../../services/api';
import type { Stats } from '../../types';
import { ReportsSkeleton, ReportDetailPanel } from '../../components/ui';
import { useSidebarData } from '../../hooks/useSidebarData';

export function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sidebarData = useSidebarData();

  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedReportId = searchParams.get('reportId');

  useEffect(() => {
    loadStats();
  }, []);

  // 첫 리포트 자동 선택 (사이드바 데이터 로드 후)
  useEffect(() => {
    if (sidebarData.reports.length > 0 && !selectedReportId) {
      const next = new URLSearchParams(searchParams);
      next.set('reportId', sidebarData.reports[0].id);
      setSearchParams(next, { replace: true });
    }
  }, [sidebarData.reports, selectedReportId]);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStats(), sidebarData.refresh()]);
  }, [sidebarData]);

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    setIsGenerating(true);
    setError(null);
    try {
      const report = await generateReport(type);
      sidebarData.addReport(report);
      const next = new URLSearchParams(searchParams);
      next.set('reportId', report.id);
      setSearchParams(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedReport = sidebarData.reports.find(r => r.id === selectedReportId) || null;

  // 트렌드 스파크라인 데이터: 날짜 오름차순 정렬 → citationRate 배열
  const sparklineData = useMemo(() => {
    if (sidebarData.reports.length < 2) return [];
    return [...sidebarData.reports]
      .sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime())
      .map((r) => r.metrics.citationRate);
  }, [sidebarData.reports]);

  // 최신 리포트 시그널
  const latestReport = sidebarData.reports.length > 0 ? sidebarData.reports[0] : null;

  const handleDeleteReport = async () => {
    if (!selectedReportId) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteReport(selectedReportId);
      sidebarData.removeReport(selectedReportId);
      const next = new URLSearchParams(searchParams);
      next.delete('reportId');
      setSearchParams(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedReport) return;

    setIsDownloading(true);
    setError(null);
    try {
      const pdfData = {
        title: selectedReport.title,
        type: selectedReport.type,
        period: selectedReport.period,
        generatedAt: selectedReport.generatedAt,
        metrics: {
          citationRate: selectedReport.metrics.citationRate,
          citationRateChange: selectedReport.metrics.citationRateChange,
          shareOfVoice: selectedReport.metrics.shareOfVoice,
          shareOfVoiceChange: selectedReport.metrics.shareOfVoiceChange,
          avgRank: selectedReport.metrics.avgRank,
          avgRankChange: selectedReport.metrics.avgRankChange,
          totalTests: selectedReport.metrics.totalTests,
          totalTestsChange: selectedReport.metrics.totalTestsChange,
        },
        enginePerformance: selectedReport.metrics.enginePerformance.map((ep) => ({
          engine: ep.engine,
          citationRate: ep.citationRate,
          avgRank: ep.avgRank,
          totalTests: ep.totalTests,
          citations: ep.citations,
          change: ep.change,
        })),
        highlights: selectedReport.highlights,
        topQueries: selectedReport.topQueries,
        worstQueries: selectedReport.worstQueries,
        aiAnalysis: selectedReport.aiAnalysis || null,
      };

      const blob = await downloadReportPdf(pdfData);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GEO_Report_${selectedReport.type}_${selectedReport.period.replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 다운로드에 실패했습니다');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || sidebarData.isLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <Stack gap="lg">
      {/* 헤더 */}
      <Group justify="space-between">
        <div>
          <Title order={2}>리포트</Title>
          <Text c="dimmed" size="sm">
            AI 가시성 리포트를 확인하세요
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
          >
            새로고침
          </Button>
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <Tooltip
                label={`최소 5개 테스트 필요, 현재 ${stats?.totalTests || 0}개`}
                disabled={!stats || stats.totalTests >= 5}
              >
                <Button
                  rightSection={<IconChevronDown size={14} />}
                  disabled={!stats || stats.totalTests < 5}
                  loading={isGenerating}
                  data-disabled={!stats || stats.totalTests < 5 ? true : undefined}
                  style={!stats || stats.totalTests < 5 ? { pointerEvents: 'all' } : undefined}
                >
                  리포트 생성
                </Button>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCalendarWeek size={16} />}
                onClick={() => handleGenerateReport('weekly')}
              >
                주간 리포트
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCalendarMonth size={16} />}
                onClick={() => handleGenerateReport('monthly')}
              >
                월간 리포트
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="오류"
          color="red"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* 트렌드 + 시그널 요약 */}
      {(sparklineData.length >= 2 || latestReport) && (
        <Paper p="md" radius="md" withBorder>
          <Group grow align="flex-start">
            {/* 트렌드 스냅샷 */}
            {sparklineData.length >= 2 && (
              <div>
                <Text fw={500} size="xs" c="dimmed" mb={4}>인용률 추이</Text>
                <Sparkline
                  w="100%"
                  h={48}
                  data={sparklineData}
                  curveType="linear"
                  trendColors={{ positive: 'teal.6', negative: 'red.6', neutral: 'gray.5' }}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Group gap={6} mt={6}>
                  <Text size="lg" fw={700}>
                    {sparklineData[sparklineData.length - 1]}%
                  </Text>
                  {(() => {
                    const diff = +(sparklineData[sparklineData.length - 1] - sparklineData[sparklineData.length - 2]).toFixed(1);
                    const color = diff > 0 ? 'teal' : diff < 0 ? 'red' : 'gray';
                    return (
                      <Badge size="sm" variant="light" color={color}>
                        {diff > 0 ? '+' : ''}{diff}%p
                      </Badge>
                    );
                  })()}
                </Group>
              </div>
            )}

            {/* 주요 시그널 */}
            {latestReport && (
              <div>
                <Text fw={500} size="xs" c="dimmed" mb="xs">주요 시그널</Text>
                <Stack gap={6}>
                  {(() => {
                    const m = latestReport.metrics;
                    const signals: { label: string; value: number; suffix: string }[] = [
                      { label: '인용률', value: m.citationRateChange, suffix: '%p' },
                      { label: '점유율', value: m.shareOfVoiceChange, suffix: '%p' },
                      { label: '테스트 수', value: m.totalTestsChange, suffix: '회' },
                    ];
                    return signals.map((s) => {
                      const color = s.value > 0 ? 'teal' : s.value < 0 ? 'red' : 'gray';
                      const Icon = s.value > 0 ? IconTrendingUp : s.value < 0 ? IconTrendingDown : IconMinus;
                      return (
                        <Group key={s.label} gap="xs" wrap="nowrap">
                          <ThemeIcon size={20} variant="light" color={color} radius="xl">
                            <Icon size={12} />
                          </ThemeIcon>
                          <Text size="xs" style={{ flex: 1 }}>{s.label}</Text>
                          <Badge size="xs" variant="light" color={color}>
                            {s.value > 0 ? '+' : ''}{s.value}{s.suffix}
                          </Badge>
                        </Group>
                      );
                    });
                  })()}
                </Stack>
              </div>
            )}
          </Group>
        </Paper>
      )}

      {/* 리포트 상세 / 빈 상태 */}
      {sidebarData.reports.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <ThemeIcon size="xl" variant="light" color="gray">
              <IconFileDescription size={24} />
            </ThemeIcon>
            <Title order={4}>리포트로 AI 가시성을 분석하세요</Title>
            <Text size="sm" c="dimmed" ta="center" maw={460}>
              리포트는 누적된 테스트 데이터를 기반으로 브랜드의 AI 가시성 성과를 종합 분석합니다.
            </Text>

            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              <Badge variant="light" color="teal" size="lg">인용률 추이</Badge>
              <Badge variant="light" color="blue" size="lg">점유율 분석</Badge>
              <Badge variant="light" color="grape" size="lg">엔진별 성과</Badge>
              <Badge variant="light" color="orange" size="lg">주요 쿼리 순위</Badge>
            </SimpleGrid>

            {stats && stats.totalTests >= 5 ? (
              <Text size="sm" c="dimmed" ta="center">
                상단의 "리포트 생성" 버튼을 클릭하여 주간 또는 월간 리포트를 생성하세요.
              </Text>
            ) : (
              <Stack align="center" gap="sm" w="100%" maw={400}>
                <Paper p="md" radius="md" withBorder w="100%">
                  <Group justify="space-between" mb={6}>
                    <Text size="sm" fw={500}>테스트 진행률</Text>
                    <Text size="sm" fw={700} c="brand">{stats?.totalTests || 0} / 5</Text>
                  </Group>
                  <Progress
                    value={((stats?.totalTests || 0) / 5) * 100}
                    size="lg"
                    radius="xl"
                    color="brand"
                  />
                  <Text size="xs" c="dimmed" mt={6}>
                    {5 - (stats?.totalTests || 0)}개 더 테스트하면 첫 리포트를 생성할 수 있습니다
                  </Text>
                </Paper>
                <Button
                  variant="light"
                  leftSection={<IconPlayerPlay size={16} />}
                  onClick={() => navigate('/dashboard/query-ops')}
                >
                  쿼리 운영에서 테스트 실행하기
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      ) : selectedReport ? (
        <ReportDetailPanel
          report={selectedReport}
          onDownloadPdf={handleDownloadPdf}
          isDownloading={isDownloading}
          onDelete={handleDeleteReport}
          isDeleting={isDeleting}
        />
      ) : (
        <Paper p="xl" radius="md" withBorder>
          <Center h={400}>
            <Stack align="center" gap="md">
              <IconSelect size={48} stroke={1.5} color="gray" />
              <Text c="dimmed">사이드바에서 리포트를 선택하세요</Text>
            </Stack>
          </Center>
        </Paper>
      )}
    </Stack>
  );
}
