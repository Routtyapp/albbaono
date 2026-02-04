import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  ThemeIcon,
  Alert,
  Menu,
  Center,
  Grid,
  ScrollArea,
} from '@mantine/core';
import {
  IconFileDescription,
  IconAlertCircle,
  IconRefresh,
  IconChevronDown,
  IconCalendarWeek,
  IconCalendarMonth,
  IconSelect,
} from '@tabler/icons-react';
import { getReports, getStats, generateReport, downloadReportPdf, deleteReport } from '../../services/api';
import type { Report, Stats } from '../../types';
import { ReportsSkeleton, ReportListItem, ReportDetailPanel } from '../../components/ui';

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // 첫 리포트 자동 선택
  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportsData, statsData] = await Promise.all([
        getReports(),
        getStats(),
      ]);
      setReports(reportsData.reports);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    setIsGenerating(true);
    setError(null);
    try {
      const report = await generateReport(type);
      setReports((prev) => [report, ...prev]);
      setSelectedReportId(report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const selectedReport = reports.find(r => r.id === selectedReportId) || null;

  const handleDeleteReport = async () => {
    if (!selectedReportId) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteReport(selectedReportId);
      setReports((prev) => prev.filter((r) => r.id !== selectedReportId));
      setSelectedReportId(null);
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
      };

      const blob = await downloadReportPdf(pdfData);

      // 다운로드 트리거
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

  if (isLoading) {
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
            onClick={loadData}
          >
            새로고침
          </Button>
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <Button
                rightSection={<IconChevronDown size={14} />}
                disabled={!stats || stats.totalTests < 5}
                loading={isGenerating}
              >
                리포트 생성
              </Button>
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

      {/* 현재 통계 요약 */}
      {stats && stats.totalTests > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Text fw={500} mb="sm" size="sm">현재 통계 요약</Text>
          <Group grow>
            <Paper p="sm" bg="gray.1" radius="md">
              <Text size="xs" c="dimmed">총 테스트</Text>
              <Text size="lg" fw={700}>{stats.totalTests}회</Text>
            </Paper>
            <Paper p="sm" bg="gray.1" radius="md">
              <Text size="xs" c="dimmed">인용률</Text>
              <Text size="lg" fw={700} c="teal">{stats.citationRate}%</Text>
            </Paper>
            <Paper p="sm" bg="gray.1" radius="md">
              <Text size="xs" c="dimmed">인용 횟수</Text>
              <Text size="lg" fw={700}>{stats.citedCount}회</Text>
            </Paper>
            <Paper p="sm" bg="gray.1" radius="md">
              <Text size="xs" c="dimmed">등록 브랜드</Text>
              <Text size="lg" fw={700}>{stats.brandStats?.length || 0}개</Text>
            </Paper>
          </Group>
        </Paper>
      )}

      {reports.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="gray">
                <IconFileDescription size={24} />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Text fw={500}>생성된 리포트가 없습니다</Text>
                <Text size="sm" c="dimmed">
                  {stats && stats.totalTests >= 5
                    ? '상단의 "리포트 생성" 버튼을 클릭하여 리포트를 생성하세요'
                    : `리포트 생성을 위해 최소 5개의 테스트가 필요합니다 (현재: ${stats?.totalTests || 0}개)`}
                </Text>
              </div>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Grid>
          {/* 좌측: 리포트 목록 */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" withBorder h="100%">
              <Text fw={500} mb="sm" size="sm" c="dimmed">
                리포트 목록 ({reports.length})
              </Text>
              <ScrollArea.Autosize mah={600}>
                <Stack gap="xs">
                  {reports.map((report) => (
                    <ReportListItem
                      key={report.id}
                      report={report}
                      isSelected={selectedReportId === report.id}
                      onClick={() => handleSelectReport(report.id)}
                    />
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            </Paper>
          </Grid.Col>

          {/* 우측: 리포트 상세 */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            {selectedReport ? (
              <ReportDetailPanel
                report={selectedReport}
                onDownloadPdf={handleDownloadPdf}
                isDownloading={isDownloading}
                onDelete={handleDeleteReport}
                isDeleting={isDeleting}
              />
            ) : (
              <Paper p="xl" radius="md" withBorder h="100%">
                <Center h={400}>
                  <Stack align="center" gap="md">
                    <IconSelect size={48} stroke={1.5} color="gray" />
                    <Text c="dimmed">좌측 목록에서 리포트를 선택하세요</Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
