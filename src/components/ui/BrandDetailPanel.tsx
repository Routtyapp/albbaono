import {
  Paper,
  Group,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Grid,
  Timeline,
  ThemeIcon,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
  IconEdit,
  IconTrash,
  IconFlask,
  IconFileReport,
  IconSearch,
  IconBulb,
} from '@tabler/icons-react';
import type { BrandDetail } from '../../types';

interface BrandDetailPanelProps {
  brand: BrandDetail;
  onEdit?: () => void;
  onDelete?: () => void;
}

function StatBox({
  label,
  value,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed" ta="center">
          {label}
        </Text>
        <Text size="xl" c={color}>
          {value}
        </Text>
      </Stack>
    </Paper>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'test':
      return <IconFlask size={12} />;
    case 'insight':
      return <IconBulb size={12} />;
    case 'report':
      return <IconFileReport size={12} />;
    default:
      return <IconSearch size={12} />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'test':
      return 'blue';
    case 'insight':
      return 'violet';
    case 'report':
      return 'green';
    default:
      return 'gray';
  }
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return '방금 전';
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export function BrandDetailPanel({ brand, onEdit, onDelete }: BrandDetailPanelProps) {
  const isActive = brand.isActive !== false;

  // 기본값 설정
  const stats = brand.stats ?? {
    citationRate: 0,
    avgRank: null,
    totalTests: 0,
    linkedQueries: 0,
  };
  const competitors = brand.competitors ?? [];
  const competitorStats = brand.competitorStats ?? [];
  const recentActivity = brand.recentActivity ?? [];

  // 경쟁사 비교 차트 데이터
  const chartData = [
    { name: brand.name, citationRate: stats.citationRate },
    ...competitorStats,
  ].sort((a, b) => b.citationRate - a.citationRate);

  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={4}>
            <Group gap="sm">
              <Text size="xl">
                {brand.name}
              </Text>
              <Badge color={isActive ? 'green' : 'gray'} variant="light">
                {isActive ? '활성' : '비활성'}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              등록일: {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString('ko-KR') : '-'}
            </Text>
          </Stack>
          <Group gap="xs">
            <ActionIcon variant="light" color="blue" size="lg" onClick={onEdit}>
              <IconEdit size={18} />
            </ActionIcon>
            <ActionIcon variant="light" color="red" size="lg" onClick={onDelete}>
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      {/* 통계 카드 그리드 */}
      <Grid>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox
            label="인용률"
            value={`${stats.citationRate}%`}
            color={stats.citationRate >= 70 ? 'green' : stats.citationRate >= 40 ? 'yellow' : 'red'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox
            label="평균 순위"
            value={stats.avgRank !== null ? `#${stats.avgRank.toFixed(1)}` : '-'}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox label="테스트 수" value={`${stats.totalTests}회`} color="violet" />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatBox label="연결된 쿼리" value={`${stats.linkedQueries}개`} color="cyan" />
        </Grid.Col>
      </Grid>

      {/* 경쟁사 비교 차트 */}
      {chartData.length > 1 && (
        <Paper p="md" radius="md" withBorder>
          <Text mb="md">
            경쟁사 인용 비교
          </Text>
          <BarChart
            h={Math.max(120, chartData.length * 40)}
            data={chartData}
            dataKey="name"
            orientation="vertical"
            series={[{ name: 'citationRate', color: 'blue.6', label: '인용률' }]}
            tickLine="none"
            gridAxis="none"
            barProps={{ radius: 4 }}
            valueFormatter={(value) => `${value}%`}
          />
        </Paper>
      )}

      {/* 경쟁사 태그 */}
      {competitors.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Text mb="sm">
            등록된 경쟁사
          </Text>
          <Group gap="xs">
            {competitors.map((competitor, i) => (
              <Badge key={i} variant="light" color="orange" size="lg">
                {competitor}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}

      {/* 최근 활동 타임라인 */}
      {recentActivity.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Text mb="md">
            최근 활동
          </Text>
          <Timeline bulletSize={24} lineWidth={2}>
            {recentActivity.slice(0, 5).map((activity, i) => (
              <Timeline.Item
                key={i}
                bullet={
                  <ThemeIcon size={24} radius="xl" color={getActivityColor(activity.type)}>
                    {getActivityIcon(activity.type)}
                  </ThemeIcon>
                }
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm">{activity.title}</Text>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                    {formatRelativeTime(activity.timestamp)}
                  </Text>
                </Group>
              </Timeline.Item>
            ))}
          </Timeline>
        </Paper>
      )}

    </Stack>
  );
}
