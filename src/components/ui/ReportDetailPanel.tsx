import {
  Paper,
  Group,
  Text,
  Badge,
  Stack,
  Button,
  Grid,
  List,
  ThemeIcon,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
  IconFileTypePdf,
  IconTrendingUp,
  IconTrendingDown,
  IconStar,
  IconAlertTriangle,
  IconTrash,
  IconBrain,
  IconCategory,
  IconUsers,
  IconBulb,
} from '@tabler/icons-react';
import type { Report } from '../../types';

interface ReportDetailPanelProps {
  report: Report;
  onDownloadPdf?: () => void;
  isDownloading?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function StatBox({
  label,
  value,
  change,
  color = 'blue',
  suffix = '',
}: {
  label: string;
  value: string | number;
  change?: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Group gap="xs" align="baseline">
          <Text size="xl" c={color}>
            {value}{suffix}
          </Text>
          {change !== undefined && change !== 0 && (
            <Group gap={2}>
              {change > 0 ? (
                <IconTrendingUp size={14} color="var(--mantine-color-teal-filled)" />
              ) : (
                <IconTrendingDown size={14} color="var(--mantine-color-red-filled)" />
              )}
              <Text size="xs" c={change > 0 ? 'teal' : 'red'}>
                {change > 0 ? '+' : ''}{change}{suffix === '%' ? '%p' : ''}
              </Text>
            </Group>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

export function ReportDetailPanel({
  report,
  onDownloadPdf,
  isDownloading = false,
  onDelete,
  isDeleting = false,
}: ReportDetailPanelProps) {
  const isWeekly = report.type === 'weekly';

  // 엔진별 성능 차트 데이터
  const engineChartData = (report.metrics.enginePerformance ?? []).map((ep) => ({
    name: ep.engine,
    citationRate: ep.citationRate,
    avgRank: ep.avgRank ?? 0,
  }));

  // 브랜드별 성능 차트 데이터
  const brandChartData = report.metrics.brandPerformance?.map((bp) => ({
    name: bp.brandName,
    citationRate: bp.citationRate,
  })) || [];

  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={4}>
            <Group gap="sm">
              <Text size="xl">
                {report.title}
              </Text>
              <Badge color={isWeekly ? 'blue' : 'teal'} variant="light">
                {isWeekly ? '주간' : '월간'}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              기간: {report.period} | 생성일: {new Date(report.generatedAt).toLocaleDateString('ko-KR')}
            </Text>
          </Stack>
          <Group gap="xs">
            <Button
              variant="light"
              leftSection={<IconFileTypePdf size={18} />}
              onClick={onDownloadPdf}
              loading={isDownloading}
            >
              PDF 다운로드
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={18} />}
              onClick={onDelete}
              loading={isDeleting}
            >
              삭제
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* 주요 지표 */}
      <Grid>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox
            label="인용률"
            value={report.metrics.citationRate}
            change={report.metrics.citationRateChange}
            color={report.metrics.citationRate >= 70 ? 'green' : report.metrics.citationRate >= 40 ? 'yellow' : 'red'}
            suffix="%"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox
            label="점유율"
            value={report.metrics.shareOfVoice}
            change={report.metrics.shareOfVoiceChange}
            color="violet"
            suffix="%"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox
            label="평균 순위"
            value={report.metrics.avgRank != null ? `#${report.metrics.avgRank.toFixed(1)}` : '-'}
            change={report.metrics.avgRankChange}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox
            label="총 테스트"
            value={report.metrics.totalTests}
            change={report.metrics.totalTestsChange}
            color="cyan"
            suffix="회"
          />
        </Grid.Col>
      </Grid>

      {/* 하이라이트 */}
      {report.highlights.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <ThemeIcon size="sm" variant="light" color="yellow">
              <IconStar size={14} />
            </ThemeIcon>
            <Text>주요 하이라이트</Text>
          </Group>
          <List size="sm" spacing="xs">
            {report.highlights.map((highlight, i) => (
              <List.Item key={i}>{highlight}</List.Item>
            ))}
          </List>
        </Paper>
      )}

      {/* AI 분석 결과 */}
      {report.aiAnalysis && (
        <>
          {/* AI 종합 분석 */}
          <Paper p="md" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <ThemeIcon size="sm" variant="light" color="violet">
                <IconBrain size={14} />
              </ThemeIcon>
              <Text>AI 종합 분석</Text>
            </Group>
            <Text size="sm" style={{ lineHeight: 1.7 }}>
              {report.aiAnalysis.summary}
            </Text>
          </Paper>

          {/* 카테고리별 분석 */}
          {report.aiAnalysis.categoryAnalysis.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <ThemeIcon size="sm" variant="light" color="blue">
                  <IconCategory size={14} />
                </ThemeIcon>
                <Text>카테고리별 분석</Text>
              </Group>
              <Grid>
                {report.aiAnalysis.categoryAnalysis.map((ca, i) => (
                  <Grid.Col key={i} span={{ base: 12, sm: 6 }}>
                    <Paper p="sm" radius="sm" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm">{ca.category}</Text>
                        <Badge
                          color={ca.citationRate >= 70 ? 'green' : ca.citationRate >= 40 ? 'yellow' : 'red'}
                          variant="light"
                          size="sm"
                        >
                          {ca.citationRate}%
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">{ca.insight}</Text>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>
          )}

          {/* 경쟁사 분석 */}
          {report.aiAnalysis.competitorAnalysis && (
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <ThemeIcon size="sm" variant="light" color="orange">
                  <IconUsers size={14} />
                </ThemeIcon>
                <Text>경쟁사 분석</Text>
              </Group>
              <Text size="sm" style={{ lineHeight: 1.7 }}>
                {report.aiAnalysis.competitorAnalysis}
              </Text>
            </Paper>
          )}

          {/* 개선 제안 */}
          {report.aiAnalysis.actionItems.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <ThemeIcon size="sm" variant="light" color="green">
                  <IconBulb size={14} />
                </ThemeIcon>
                <Text>개선 제안</Text>
              </Group>
              <List size="sm" spacing="xs" type="ordered">
                {report.aiAnalysis.actionItems.map((item, i) => (
                  <List.Item key={i}>{item}</List.Item>
                ))}
              </List>
            </Paper>
          )}
        </>
      )}

      {/* AI 엔진별 성능 */}
      {engineChartData.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Text mb="md">
            AI 엔진별 성능
          </Text>
          <BarChart
            h={Math.max(120, engineChartData.length * 50)}
            data={engineChartData}
            dataKey="name"
            orientation="vertical"
            series={[
              { name: 'citationRate', color: 'blue.6', label: '인용률 (%)' },
            ]}
            tickLine="none"
            gridAxis="none"
            barProps={{ radius: 4 }}
            valueFormatter={(value) => `${value}%`}
          />
        </Paper>
      )}

      {/* 브랜드별 성능 */}
      {brandChartData.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Text mb="md">
            브랜드별 인용 성과
          </Text>
          <BarChart
            h={Math.max(120, brandChartData.length * 50)}
            data={brandChartData}
            dataKey="name"
            orientation="vertical"
            series={[
              { name: 'citationRate', color: 'teal.6', label: '인용률 (%)' },
            ]}
            tickLine="none"
            gridAxis="none"
            barProps={{ radius: 4 }}
            valueFormatter={(value) => `${value}%`}
          />
        </Paper>
      )}

      {/* 인용률 높은 쿼리 */}
      {report.topQueries.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <ThemeIcon size="sm" variant="light" color="teal">
              <IconTrendingUp size={14} />
            </ThemeIcon>
            <Text>인용률 높은 쿼리</Text>
          </Group>
          <Stack gap="sm">
            {report.topQueries.map((q, i) => (
              <Group key={i} justify="space-between" wrap="nowrap">
                <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                  {q.query}
                </Text>
                <Badge color="teal" variant="light" style={{ flexShrink: 0 }}>
                  {q.citationRate}%
                </Badge>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* 인용률 낮은 쿼리 */}
      {report.worstQueries.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <ThemeIcon size="sm" variant="light" color="red">
              <IconAlertTriangle size={14} />
            </ThemeIcon>
            <Text>개선 필요 쿼리</Text>
          </Group>
          <Stack gap="sm">
            {report.worstQueries.map((q, i) => (
              <Group key={i} justify="space-between" wrap="nowrap">
                <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                  {q.query}
                </Text>
                <Badge color="red" variant="light" style={{ flexShrink: 0 }}>
                  {q.citationRate}%
                </Badge>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
