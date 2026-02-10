import { Stack, Grid, Skeleton, Group, Paper } from '@mantine/core';

// 메트릭 카드 스켈레톤
export function MetricCardSkeleton() {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="xs">
        <Skeleton height={14} width="40%" />
        <Skeleton height={32} width="60%" />
        <Skeleton height={12} width="30%" />
      </Stack>
    </Paper>
  );
}

// 차트 카드 스켈레톤
export function ChartCardSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Skeleton height={20} width="30%" />
          <Skeleton height={28} width={100} />
        </Group>
        <Skeleton height={height} radius="md" />
      </Stack>
    </Paper>
  );
}

// 테이블 스켈레톤
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Skeleton height={20} width="25%" />
        <Stack gap="xs">
          {/* 헤더 */}
          <Group gap="md">
            <Skeleton height={16} width="20%" />
            <Skeleton height={16} width="15%" />
            <Skeleton height={16} width="15%" />
            <Skeleton height={16} width="20%" />
            <Skeleton height={16} width="15%" />
          </Group>
          {/* 행들 */}
          {Array.from({ length: rows }).map((_, i) => (
            <Group key={i} gap="md" py="xs">
              <Skeleton height={14} width="20%" />
              <Skeleton height={14} width="15%" />
              <Skeleton height={14} width="15%" />
              <Skeleton height={14} width="20%" />
              <Skeleton height={14} width="15%" />
            </Group>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

// Overview 페이지 스켈레톤
export function OverviewSkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Skeleton height={32} width={200} />
        <Group gap="sm">
          <Skeleton height={36} width={150} />
          <Skeleton height={36} width={100} />
        </Group>
      </Group>

      {/* 메트릭 카드 그리드 */}
      <Grid>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
            <MetricCardSkeleton />
          </Grid.Col>
        ))}
      </Grid>

      {/* 차트 영역 */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <ChartCardSkeleton height={300} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ChartCardSkeleton height={300} />
        </Grid.Col>
      </Grid>

      {/* 테이블 영역 */}
      <TableSkeleton rows={5} />
    </Stack>
  );
}

// Visibility 페이지 스켈레톤
export function VisibilitySkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Skeleton height={32} width={200} />
          <Skeleton height={16} width={300} />
        </Stack>
        <Skeleton height={36} width={120} />
      </Group>

      {/* 요약 카드 */}
      <Paper p="lg" radius="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="xs" align="center">
              <Skeleton height={120} width={120} circle />
              <Skeleton height={14} width={80} />
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              {Array.from({ length: 3 }).map((_, i) => (
                <Group key={i} justify="space-between">
                  <Skeleton height={14} width="30%" />
                  <Skeleton height={8} width="50%" />
                  <Skeleton height={14} width="10%" />
                </Group>
              ))}
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* 테이블 */}
      <TableSkeleton rows={6} />
    </Stack>
  );
}

// Brands 페이지 스켈레톤 (마스터-디테일 레이아웃)
export function BrandsSkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Skeleton height={32} width={180} />
          <Skeleton height={16} width={280} />
        </Stack>
        <Group gap="sm">
          <Skeleton height={36} width={100} />
          <Skeleton height={36} width={120} />
        </Group>
      </Group>

      {/* 마스터-디테일 레이아웃 */}
      <Grid>
        {/* 좌측: 브랜드 목록 */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <Paper key={i} p="sm" radius="md" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Skeleton height={32} width={32} radius="sm" />
                      <Stack gap={4}>
                        <Skeleton height={14} width={80} />
                        <Group gap="xs">
                          <Skeleton height={12} width={40} radius="xl" />
                          <Skeleton height={12} width={50} />
                        </Group>
                      </Stack>
                    </Group>
                    <Skeleton height={20} width={40} radius="xl" />
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* 우측: 상세 패널 */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* 헤더 */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <Stack gap={4}>
                  <Group gap="sm">
                    <Skeleton height={24} width={120} />
                    <Skeleton height={20} width={50} radius="xl" />
                  </Group>
                  <Skeleton height={14} width={150} />
                </Stack>
                <Group gap="xs">
                  <Skeleton height={36} width={36} radius="md" />
                  <Skeleton height={36} width={36} radius="md" />
                </Group>
              </Group>
            </Paper>

            {/* 통계 그리드 */}
            <Grid>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 6, sm: 3 }}>
                  <Paper p="md" radius="md" withBorder>
                    <Stack gap={4} align="center">
                      <Skeleton height={12} width={60} />
                      <Skeleton height={28} width={50} />
                    </Stack>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>

            {/* 차트 */}
            <Paper p="md" radius="md" withBorder>
              <Skeleton height={16} width={120} mb="md" />
              <Skeleton height={120} radius="md" />
            </Paper>

            {/* 경쟁사 태그 */}
            <Paper p="md" radius="md" withBorder>
              <Skeleton height={16} width={100} mb="sm" />
              <Group gap="xs">
                <Skeleton height={24} width={60} radius="xl" />
                <Skeleton height={24} width={50} radius="xl" />
                <Skeleton height={24} width={70} radius="xl" />
              </Group>
            </Paper>

            {/* 빠른 액션 */}
            <Paper p="md" radius="md" withBorder>
              <Group gap="sm">
                <Skeleton height={32} width={100} radius="md" />
                <Skeleton height={32} width={110} radius="md" />
                <Skeleton height={32} width={100} radius="md" />
              </Group>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

// Queries 페이지 스켈레톤
export function QueriesSkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Skeleton height={32} width={180} />
          <Skeleton height={16} width={260} />
        </Stack>
        <Group gap="sm">
          <Skeleton height={36} width={200} />
          <Skeleton height={36} width={140} />
        </Group>
      </Group>

      {/* 필터 */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="md">
          <Skeleton height={36} width={200} />
          <Skeleton height={36} width={150} />
          <Skeleton height={36} width={150} />
        </Group>
      </Paper>

      {/* 테이블 */}
      <TableSkeleton rows={8} />
    </Stack>
  );
}

// Reports 페이지 스켈레톤
export function ReportsSkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Skeleton height={32} width={150} />
          <Skeleton height={16} width={300} />
        </Stack>
        <Skeleton height={36} width={140} />
      </Group>

      {/* 리포트 카드 그리드 */}
      <Grid>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid.Col key={i} span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Skeleton height={40} width={40} radius="md" />
                    <Stack gap={4}>
                      <Skeleton height={18} width={150} />
                      <Skeleton height={12} width={100} />
                    </Stack>
                  </Group>
                  <Skeleton height={24} width={60} radius="xl" />
                </Group>
                <Skeleton height={60} />
                <Group justify="flex-end">
                  <Skeleton height={32} width={80} />
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}

// Insights 페이지 스켈레톤 (2컬럼 레이아웃)
export function InsightsSkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Skeleton height={32} width={180} />
          <Skeleton height={16} width={320} />
        </Stack>
        <Group gap="sm">
          <Skeleton height={36} width={180} />
          <Skeleton height={36} width={140} />
        </Group>
      </Group>

      <Grid>
        {/* 좌측: 요약 + 리스트 */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              {/* 요약 카드 스켈레톤 */}
              <Stack gap="xs">
                <Skeleton height={12} width={80} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Group key={i} gap="xs" wrap="nowrap">
                    <Skeleton height={20} width={20} circle />
                    <Skeleton height={12} width="50%" />
                    <Skeleton height={18} width={40} radius="xl" />
                  </Group>
                ))}
              </Stack>
              <Skeleton height={1} />
              {/* 리스트 아이템 스켈레톤 */}
              <Stack gap="xs">
                <Skeleton height={12} width={100} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Paper key={i} p="sm" radius="md" withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Skeleton height={32} width={32} radius="sm" />
                        <Stack gap={4}>
                          <Skeleton height={14} width={80} />
                          <Skeleton height={12} width={60} />
                        </Stack>
                      </Group>
                      <Skeleton height={20} width={40} radius="xl" />
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* 우측: 메트릭 + 차트 */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* 메트릭 카드 4개 */}
            <Grid>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 6, sm: 3 }}>
                  <MetricCardSkeleton />
                </Grid.Col>
              ))}
            </Grid>
            {/* 탭 + 차트 스켈레톤 */}
            <Paper p="md" radius="md" withBorder>
              <Group gap="md" mb="md">
                <Skeleton height={32} width={100} />
                <Skeleton height={32} width={100} />
                <Skeleton height={32} width={100} />
                <Skeleton height={32} width={100} />
              </Group>
              <Skeleton height={300} radius="md" />
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

// Scheduler 페이지 스켈레톤
export function SchedulerSkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Skeleton height={32} width={180} />
          <Skeleton height={16} width={300} />
        </Stack>
        <Skeleton height={36} width={100} />
      </Group>

      {/* 캘린더 + 설정 */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder>
            <Skeleton height={20} width={120} mb="md" />
            <Skeleton height={280} radius="md" />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Skeleton height={20} width={120} />
                <Skeleton height={24} width={40} />
              </Group>
              <Skeleton height={14} width="60%" />
            </Paper>
            {Array.from({ length: 3 }).map((_, i) => (
              <Paper key={i} p="sm" radius="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Skeleton height={16} width={40} />
                    <Skeleton height={16} width={60} radius="xl" />
                  </Group>
                  <Skeleton height={12} width="50%" />
                  <Skeleton height={12} width="40%" />
                  <Skeleton height={28} width="100%" />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* 히스토리 테이블 */}
      <TableSkeleton rows={5} />
    </Stack>
  );
}

// Trend 페이지 스켈레톤
export function TrendSkeleton() {
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Skeleton height={32} width={180} />
        <Skeleton height={36} width={220} radius="md" />
      </Group>

      {/* 전체 인용률 추이 차트 */}
      <ChartCardSkeleton height={300} />

      {/* 엔진별 추이 차트 */}
      <ChartCardSkeleton height={300} />

      {/* 카테고리별 비교 차트 */}
      <ChartCardSkeleton height={250} />
    </Stack>
  );
}

// Score 페이지 스켈레톤
export function ScoreSkeleton() {
  return (
    <Stack gap="md">
      {/* 헤더 */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Skeleton height={32} width={200} />
          <Skeleton height={16} width={280} />
        </Stack>
        <Group gap="sm">
          <Skeleton height={36} width={150} />
          <Skeleton height={36} width={120} />
        </Group>
      </Group>

      {/* 스코어 카드 */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md" align="center">
              <Skeleton height={160} width={160} circle />
              <Skeleton height={20} width={120} />
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder h="100%">
            <Stack gap="md">
              <Skeleton height={20} width="30%" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Group key={i} justify="space-between">
                  <Skeleton height={14} width="25%" />
                  <Skeleton height={8} width="50%" />
                  <Skeleton height={14} width="10%" />
                </Group>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* 차트 */}
      <ChartCardSkeleton height={250} />
    </Stack>
  );
}
