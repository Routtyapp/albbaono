import type { ReactNode } from 'react';
import { Stack, Divider, Box, ActionIcon, Tooltip, Text, UnstyledButton, Group, Badge, Progress, Paper, ScrollArea, Modal, SegmentedControl, Center, Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChartBar,
  IconEye,
  IconMessageQuestion,
  IconFileDescription,
  IconSettings,
  IconTags,
  IconTargetArrow,
  IconChartDots3,
  IconTrophy,
  IconBrain,
  IconChevronLeft,
  IconChevronRight,
  IconTrendingUp,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
} from '@tabler/icons-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSidebarData, type SidebarData } from '../../hooks/useSidebarData';
import type { Brand, MonitoredQuery, Stats, Report, TestResult } from '../../data/mockData';
import type { SavedInsight } from '../../services/api';

const trackerMenuItems = [
  { label: 'Overview', shortLabel: '개요', icon: IconChartBar, path: '/dashboard', key: 'overview' },
  { label: '브랜드 설정', shortLabel: '브랜드', icon: IconTags, path: '/dashboard/brands', key: 'brands' },
  { label: '쿼리 관리', shortLabel: '쿼리', icon: IconMessageQuestion, path: '/dashboard/queries', key: 'queries' },
  { label: 'AI 가시성', shortLabel: '가시성', icon: IconEye, path: '/dashboard/visibility', key: 'visibility' },
  { label: 'AI 인사이트', shortLabel: '인사이트', icon: IconBrain, path: '/dashboard/insights', key: 'insights' },
  { label: '리포트', shortLabel: '리포트', icon: IconFileDescription, path: '/dashboard/reports', key: 'reports' },
];

const scoreMenuItems = [
  { label: 'Score Overview', shortLabel: '스코어', icon: IconTrophy, path: '/dashboard/score', key: 'score' },
  { label: '성과 분석', shortLabel: '성과', icon: IconChartDots3, path: '/dashboard/score/analysis', key: 'analysis' },
  { label: '경쟁사 비교', shortLabel: '경쟁사', icon: IconTargetArrow, path: '/dashboard/score/competitors', key: 'competitors' },
];

// 스켈레톤 패널
function PanelSkeleton() {
  return (
    <Stack gap="md">
      <Box>
        <Skeleton height={12} width="40%" mb={4} />
        <Skeleton height={28} width="50%" />
      </Box>
      <Divider />
      <Box>
        <Skeleton height={12} width="30%" mb={8} />
        <Stack gap="xs">
          {[1, 2, 3].map((i) => (
            <Paper key={i} p="xs" withBorder radius="md">
              <Skeleton height={14} width="60%" mb={4} />
              <Skeleton height={8} width="100%" />
            </Paper>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

// Overview 패널
function OverviewPanel({ stats, brands }: { stats: Stats | null; brands: Brand[] }) {
  if (!stats) return <PanelSkeleton />;

  const citationRate = stats.citationRate || 0;
  const brandStats = stats.brandStats || [];

  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>전체 인용률</Text>
        <Group gap="xs" align="baseline">
          <Text size="xl" fw={700}>{citationRate.toFixed(1)}%</Text>
          <Group gap={2}>
            <IconTrendingUp size={14} color="var(--mantine-color-teal-6)" />
            <Text size="xs" c="teal.6">활성</Text>
          </Group>
        </Group>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>브랜드별 현황</Text>
        <Stack gap="xs">
          {brandStats.length > 0 ? (
            brandStats.slice(0, 5).map((bs) => {
              const brand = brands.find(b => b.id === bs.brandId);
              return (
                <Paper key={bs.brandId} p="xs" withBorder radius="md">
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={500}>{brand?.name || bs.brandId}</Text>
                    <Text size="sm" fw={600}>{bs.citationRate.toFixed(1)}%</Text>
                  </Group>
                  <Progress value={bs.citationRate} size="xs" color="brand" />
                </Paper>
              );
            })
          ) : (
            <Text size="sm" c="dimmed">등록된 브랜드가 없습니다</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

// 브랜드 패널
function BrandsPanel({ brands }: { brands: Brand[] }) {
  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>등록된 브랜드</Text>
        <Text size="xl" fw={700}>{brands.length}개</Text>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>브랜드 목록</Text>
        <Stack gap="xs">
          {brands.length > 0 ? (
            brands.slice(0, 5).map((brand) => (
              <Paper key={brand.id} p="xs" withBorder radius="md">
                <Group justify="space-between">
                  <Text size="sm">{brand.name}</Text>
                  <Badge size="xs" variant="light" color="brand">활성</Badge>
                </Group>
              </Paper>
            ))
          ) : (
            <Text size="sm" c="dimmed">등록된 브랜드가 없습니다</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

// 쿼리 패널
function QueriesPanel({ queries }: { queries: MonitoredQuery[] }) {
  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>총 쿼리 수</Text>
        <Text size="xl" fw={700}>{queries.length}개</Text>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>최근 쿼리</Text>
        <Stack gap="xs">
          {queries.length > 0 ? (
            queries.slice(0, 5).map((query) => (
              <Paper key={query.id} p="xs" withBorder radius="md">
                <Text size="sm" lineClamp={1}>{query.query}</Text>
                <Text size="xs" c="dimmed">{query.category}</Text>
              </Paper>
            ))
          ) : (
            <Text size="sm" c="dimmed">등록된 쿼리가 없습니다</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

// AI 가시성 패널 - 쿼리 결과 목록
function VisibilityPanel({ stats, results, selectedResultId, onSelectResult, hasMore, total, onLoadMore, isLoadingMore }: {
  stats: Stats | null;
  results: TestResult[];
  selectedResultId: string | null;
  onSelectResult: (id: string) => void;
  hasMore: boolean;
  total: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}) {
  if (!stats) return <PanelSkeleton />;

  const citationRate = stats.citationRate || 0;

  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>전체 인용률</Text>
        <Group gap="xs" align="baseline">
          <Text size="xl" fw={700}>{citationRate.toFixed(1)}%</Text>
          <Badge size="xs" color="teal" variant="light">
            {stats.citedCount}/{stats.totalTests}
          </Badge>
        </Group>
      </Box>

      <Divider />

      <Box>
        <Group justify="space-between" mb={8}>
          <Text size="xs" c="dimmed">테스트 결과</Text>
          <Badge size="xs" variant="light">{results.length}/{total}개</Badge>
        </Group>
        <Stack gap={6}>
          {results.length > 0 ? (
            <>
              {results.map((result) => (
                <UnstyledButton
                  key={result.id}
                  onClick={() => onSelectResult(result.id)}
                  style={{ width: '100%' }}
                >
                  <Paper
                    p="xs"
                    withBorder
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedResultId === result.id
                        ? 'var(--mantine-color-brand-0)'
                        : undefined,
                      borderColor: selectedResultId === result.id
                        ? 'var(--mantine-color-brand-4)'
                        : undefined,
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Text size="sm" lineClamp={2} mb={4}>{result.query}</Text>
                    <Group gap="xs">
                      <Badge
                        size="xs"
                        color={result.cited ? 'teal' : 'gray'}
                        variant="light"
                      >
                        {result.cited ? '인용됨' : '미인용'}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {new Date(result.testedAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </Group>
                  </Paper>
                </UnstyledButton>
              ))}
              {hasMore && (
                <UnstyledButton
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  style={{ width: '100%' }}
                >
                  <Paper
                    p="xs"
                    withBorder
                    radius="md"
                    style={{
                      cursor: isLoadingMore ? 'wait' : 'pointer',
                      backgroundColor: 'var(--mantine-color-gray-0)',
                      textAlign: 'center',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Text size="sm" c="brand.6" fw={500}>
                      {isLoadingMore ? '로딩 중...' : '더 보기'}
                    </Text>
                  </Paper>
                </UnstyledButton>
              )}
            </>
          ) : (
            <Text size="sm" c="dimmed">테스트 결과가 없습니다</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

// 인사이트 패널
function InsightsPanel({ insights }: { insights: SavedInsight[] }) {
  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>저장된 분석</Text>
        <Text size="xl" fw={700}>{insights.length}개</Text>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>최근 인사이트</Text>
        <Stack gap="xs">
          {insights.length > 0 ? (
            insights.slice(0, 3).map((insight) => (
              <Paper key={insight.id} p="xs" withBorder radius="md">
                <Text size="sm" fw={500}>{insight.brandName}</Text>
                <Text size="xs" c="dimmed">
                  {insight.actionableInsights?.length || 0}개의 액션 아이템
                </Text>
              </Paper>
            ))
          ) : (
            <Text size="sm" c="dimmed">분석된 인사이트가 없습니다</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

// 리포트 패널
function ReportsPanel({ reports }: { reports: Report[] }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>생성된 리포트</Text>
        <Text size="xl" fw={700}>{reports.length}개</Text>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>최근 리포트</Text>
        <Stack gap="xs">
          {reports.length > 0 ? (
            reports.slice(0, 3).map((report) => (
              <Paper key={report.id} p="xs" withBorder radius="md">
                <Text size="sm" fw={500}>{report.title}</Text>
                <Text size="xs" c="dimmed">{formatDate(report.generatedAt)}</Text>
              </Paper>
            ))
          ) : (
            <Text size="sm" c="dimmed">생성된 리포트가 없습니다</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

// GEO Score 패널
function ScorePanel() {
  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>GEO Score란?</Text>
        <Text size="sm" lh={1.5}>
          웹사이트가 AI 검색 엔진(ChatGPT, Gemini 등)에 얼마나 최적화되어 있는지 측정하는 점수입니다.
        </Text>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>평가 카테고리</Text>
        <Stack gap="xs">
          <Paper p="xs" withBorder radius="md">
            <Text size="sm" fw={500}>Structure</Text>
            <Text size="xs" c="dimmed">HTML 구조, 헤딩 계층</Text>
          </Paper>
          <Paper p="xs" withBorder radius="md">
            <Text size="sm" fw={500}>Schema</Text>
            <Text size="xs" c="dimmed">구조화된 데이터 마크업</Text>
          </Paper>
          <Paper p="xs" withBorder radius="md">
            <Text size="sm" fw={500}>URL</Text>
            <Text size="xs" c="dimmed">URL 구조 및 가독성</Text>
          </Paper>
          <Paper p="xs" withBorder radius="md">
            <Text size="sm" fw={500}>Meta</Text>
            <Text size="xs" c="dimmed">메타 태그 최적화</Text>
          </Paper>
          <Paper p="xs" withBorder radius="md">
            <Text size="sm" fw={500}>Content</Text>
            <Text size="xs" c="dimmed">콘텐츠 품질 및 구조</Text>
          </Paper>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>등급 체계</Text>
        <Group gap="xs">
          <Badge color="teal" variant="filled">A+</Badge>
          <Badge color="teal" variant="light">A</Badge>
          <Badge color="blue" variant="light">B+</Badge>
          <Badge color="blue" variant="outline">B</Badge>
          <Badge color="yellow" variant="light">C</Badge>
          <Badge color="orange" variant="light">D</Badge>
          <Badge color="red" variant="light">F</Badge>
        </Group>
      </Box>
    </Stack>
  );
}

// 성과 분석 패널
function AnalysisPanel({ stats }: { stats: Stats | null }) {
  if (!stats) return <PanelSkeleton />;

  const citationRate = stats.citationRate || 0;

  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>인용률</Text>
        <Group gap="xs" align="baseline">
          <Text size="xl" fw={700}>{citationRate.toFixed(1)}%</Text>
          <Text size="xs" c="teal.6">현재</Text>
        </Group>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>주요 지표</Text>
        <Stack gap="xs">
          <Paper p="xs" withBorder radius="md">
            <Group justify="space-between">
              <Text size="sm">총 테스트</Text>
              <Text size="sm" fw={600}>{stats.totalTests}회</Text>
            </Group>
          </Paper>
          <Paper p="xs" withBorder radius="md">
            <Group justify="space-between">
              <Text size="sm">인용 횟수</Text>
              <Text size="sm" fw={600}>{stats.citedCount}회</Text>
            </Group>
          </Paper>
          <Paper p="xs" withBorder radius="md">
            <Group justify="space-between">
              <Text size="sm">등록 브랜드</Text>
              <Text size="sm" fw={600}>{stats.brandStats?.length || 0}개</Text>
            </Group>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}

// 경쟁사 비교 패널
function CompetitorsPanel() {
  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>GEO Score vs AI 인용</Text>
        <Text size="sm" lh={1.5}>
          GEO Score가 높아도 AI에서 인용되지 않을 수 있습니다.
        </Text>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={8}>점수 외 영향 요인</Text>
        <Stack gap="xs">
          <Paper p="xs" withBorder radius="md" bg="yellow.0">
            <Text size="sm" fw={500}>브랜드 인지도</Text>
            <Text size="xs" c="dimmed">AI는 학습 데이터에서 자주 언급된 브랜드를 우선 추천합니다</Text>
          </Paper>
          <Paper p="xs" withBorder radius="md" bg="blue.0">
            <Text size="sm" fw={500}>도메인 권위</Text>
            <Text size="xs" c="dimmed">오래된 도메인, 백링크 품질, 업계 내 평판이 영향</Text>
          </Paper>
          <Paper p="xs" withBorder radius="md" bg="teal.0">
            <Text size="sm" fw={500}>콘텐츠 신선도</Text>
            <Text size="xs" c="dimmed">최신 정보, 정기적 업데이트가 AI 학습에 반영</Text>
          </Paper>
          <Paper p="xs" withBorder radius="md" bg="grape.0">
            <Text size="sm" fw={500}>사용자 신뢰 신호</Text>
            <Text size="xs" c="dimmed">리뷰, 소셜 미디어 언급, 뉴스 보도 빈도</Text>
          </Paper>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text size="xs" c="dimmed" mb={4}>분석 팁</Text>
        <Text size="xs" c="dimmed" lh={1.6}>
          경쟁사보다 GEO Score가 높다면 기술적 최적화는 완료된 것입니다.
          인용이 안 된다면 <Text span fw={600} c="dark">브랜드 마케팅</Text>과
          <Text span fw={600} c="dark"> 콘텐츠 전략</Text>에 집중하세요.
        </Text>
      </Box>
    </Stack>
  );
}

// 현재 경로에 따른 패널 컴포넌트 반환
function getExpandedPanel(
  pathname: string,
  data: SidebarData,
  visibilityState?: {
    selectedResultId: string | null;
    onSelectResult: (id: string) => void;
    hasMore: boolean;
    total: number;
    onLoadMore: () => void;
    isLoadingMore: boolean;
  }
): { title: string; content: ReactNode } {
  const { stats, brands, queries, reports, insights, results, isLoading } = data;

  if (isLoading) {
    return { title: '로딩 중...', content: <PanelSkeleton /> };
  }

  if (pathname === '/dashboard') {
    return { title: 'Overview', content: <OverviewPanel stats={stats} brands={brands} /> };
  }
  if (pathname.startsWith('/dashboard/brands')) {
    return { title: '브랜드 설정', content: <BrandsPanel brands={brands} /> };
  }
  if (pathname.startsWith('/dashboard/queries')) {
    return { title: '쿼리 관리', content: <QueriesPanel queries={queries} /> };
  }
  if (pathname.startsWith('/dashboard/visibility')) {
    return {
      title: 'AI 가시성',
      content: (
        <VisibilityPanel
          stats={stats}
          results={results}
          selectedResultId={visibilityState?.selectedResultId ?? null}
          onSelectResult={visibilityState?.onSelectResult ?? (() => {})}
          hasMore={visibilityState?.hasMore ?? false}
          total={visibilityState?.total ?? 0}
          onLoadMore={visibilityState?.onLoadMore ?? (() => {})}
          isLoadingMore={visibilityState?.isLoadingMore ?? false}
        />
      ),
    };
  }
  if (pathname.startsWith('/dashboard/insights')) {
    return { title: 'AI 인사이트', content: <InsightsPanel insights={insights} /> };
  }
  if (pathname.startsWith('/dashboard/reports')) {
    return { title: '리포트', content: <ReportsPanel reports={reports} /> };
  }
  if (pathname === '/dashboard/score') {
    return { title: 'GEO Score', content: <ScorePanel /> };
  }
  if (pathname.startsWith('/dashboard/score/analysis')) {
    return { title: '성과 분석', content: <AnalysisPanel stats={stats} /> };
  }
  if (pathname.startsWith('/dashboard/score/competitors')) {
    return { title: '경쟁사 비교', content: <CompetitorsPanel /> };
  }
  return { title: 'Overview', content: <OverviewPanel stats={stats} brands={brands} /> };
}

export type SidebarPosition = 'left' | 'right';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  position: SidebarPosition;
  onPositionChange: (position: SidebarPosition) => void;
}

// 아이콘 메뉴 컴포넌트
function IconMenu({
  onToggle,
  collapsed,
  navigate,
  location,
  position,
  onSettingsOpen,
}: {
  onToggle: () => void;
  collapsed: boolean;
  navigate: (path: string) => void;
  location: { pathname: string };
  position: SidebarPosition;
  onSettingsOpen: () => void;
}) {
  const expandIcon = position === 'right' ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />;
  const collapseIcon = position === 'right' ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />;
  const tooltipPosition = position === 'right' ? 'left' : 'right';

  return (
    <Stack gap={0} align="center" h="100%" py="xs">
      <Box mb="md">
        <Tooltip label={collapsed ? '메뉴 펼치기' : '메뉴 접기'} position={tooltipPosition} withArrow>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onToggle}>
            {collapsed ? expandIcon : collapseIcon}
          </ActionIcon>
        </Tooltip>
      </Box>

      {trackerMenuItems.map((item) => {
        const isActive = item.path === '/dashboard'
          ? location.pathname === '/dashboard'
          : location.pathname.startsWith(item.path);
        return (
          <UnstyledButton
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 64,
            }}
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: isActive ? 'var(--mantine-color-brand-1)' : 'transparent',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <item.icon
                size={20}
                stroke={1.5}
                color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-gray-7)'}
              />
            </Box>
            <Text
              size="12px"
              mt={4}
              c={isActive ? 'brand.6' : 'gray.7'}
              fw={isActive ? 600 : 400}
              style={{ lineHeight: 1.2 }}
            >
              {item.shortLabel}
            </Text>
          </UnstyledButton>
        );
      })}

      <Divider w="80%" my="xs" />

      {scoreMenuItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <UnstyledButton
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 64,
            }}
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: isActive ? 'var(--mantine-color-brand-1)' : 'transparent',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <item.icon
                size={20}
                stroke={1.5}
                color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-gray-7)'}
              />
            </Box>
            <Text
              size="12px"
              mt={4}
              c={isActive ? 'brand.6' : 'gray.7'}
              fw={isActive ? 600 : 400}
              style={{ lineHeight: 1.2 }}
            >
              {item.shortLabel}
            </Text>
          </UnstyledButton>
        );
      })}

      <Divider w="80%" my="xs" />

      <Tooltip label="설정" position={tooltipPosition} withArrow>
        <UnstyledButton
          onClick={onSettingsOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
          }}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'var(--mantine-color-gray-1)',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
            }}
          >
            <IconSettings size={20} stroke={1.5} color="var(--mantine-color-gray-7)" />
          </Box>
        </UnstyledButton>
      </Tooltip>
    </Stack>
  );
}

export function Sidebar({ collapsed, onToggle, position, onPositionChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const sidebarData = useSidebarData();

  // AI 가시성 페이지의 선택된 결과 ID
  const selectedResultId = searchParams.get('resultId');
  const handleSelectResult = (id: string) => {
    setSearchParams({ resultId: id });
  };

  const { title, content } = getExpandedPanel(location.pathname, sidebarData, {
    selectedResultId,
    onSelectResult: handleSelectResult,
    hasMore: sidebarData.resultsHasMore,
    total: sidebarData.resultsTotal,
    onLoadMore: sidebarData.loadMoreResults,
    isLoadingMore: sidebarData.isLoadingMore,
  });

  const panelBorderStyle = position === 'right'
    ? { borderRight: '1px solid var(--mantine-color-gray-2)' }
    : { borderLeft: '1px solid var(--mantine-color-gray-2)' };

  const settingsModal = (
    <Modal
      opened={settingsOpened}
      onClose={closeSettings}
      title={<Text fw={600}>설정</Text>}
      centered
      size="sm"
    >
      <Stack gap="md">
        <Box>
          <Text size="sm" fw={500} mb="xs">사이드바 위치</Text>
          <SegmentedControl
            value={position}
            onChange={(value) => onPositionChange(value as SidebarPosition)}
            fullWidth
            data={[
              {
                value: 'left',
                label: (
                  <Center>
                    <Group gap={8}>
                      <IconLayoutSidebarLeftCollapse size={16} />
                      <span>왼쪽</span>
                    </Group>
                  </Center>
                ),
              },
              {
                value: 'right',
                label: (
                  <Center>
                    <Group gap={8}>
                      <IconLayoutSidebarRightCollapse size={16} />
                      <span>오른쪽</span>
                    </Group>
                  </Center>
                ),
              },
            ]}
          />
        </Box>
      </Stack>
    </Modal>
  );

  if (collapsed) {
    return (
      <>
        {settingsModal}
        <Box h="100%" px={8}>
          <IconMenu
            onToggle={onToggle}
            collapsed={collapsed}
            navigate={navigate}
            location={location}
            position={position}
            onSettingsOpen={openSettings}
          />
        </Box>
      </>
    );
  }

  const detailPanel = (
    <Box
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        ...panelBorderStyle,
      }}
    >
      <Box p="md" pb="sm">
        <Text size="lg" fw={700}>{title}</Text>
      </Box>
      <ScrollArea flex={1} px="md" pb="md">
        {content}
      </ScrollArea>
    </Box>
  );

  const iconMenu = (
    <Box w={64} style={{ flexShrink: 0 }}>
      <IconMenu
        onToggle={onToggle}
        collapsed={collapsed}
        navigate={navigate}
        location={location}
        position={position}
        onSettingsOpen={openSettings}
      />
    </Box>
  );

  return (
    <>
      {settingsModal}
      <Group gap={0} h="100%" wrap="nowrap" align="stretch">
        {position === 'right' ? (
          <>
            {detailPanel}
            {iconMenu}
          </>
        ) : (
          <>
            {iconMenu}
            {detailPanel}
          </>
        )}
      </Group>
    </>
  );
}
