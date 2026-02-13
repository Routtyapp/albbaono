import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  Modal,
  Alert,
  Badge,
  Skeleton,
  ActionIcon,
  Pagination,
  Box,
  Grid,
  Tabs,
  Image,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconAlertCircle,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getFeeds,
  deleteFeed,
  type Feed as FeedType,
} from '../../services/feed';

const FEED_CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'general', label: '일반' },
  { value: 'seo', label: 'SEO' },
  { value: 'geo', label: 'GEO' },
  { value: 'update', label: '업데이트' },
  { value: 'tip', label: '팁' },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'gray',
  seo: 'blue',
  geo: 'teal',
  update: 'violet',
  tip: 'orange',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ──────────── Skeleton ──────────── */
function FeedSkeleton() {
  return (
    <Stack gap="md">
      <Skeleton height={280} radius="md" />
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {[1, 2, 3].map((i) => (
              <Paper key={i} p="lg" radius="md" withBorder>
                <Group wrap="nowrap">
                  <div style={{ flex: 1 }}>
                    <Skeleton height={16} width="30%" mb="sm" />
                    <Skeleton height={20} width="80%" mb="xs" />
                    <Skeleton height={14} width="100%" mb="xs" />
                    <Skeleton height={14} width="60%" />
                  </div>
                  <Skeleton height={90} width={140} radius="md" />
                </Group>
              </Paper>
            ))}
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="lg" radius="md" withBorder>
            <Skeleton height={20} width="40%" mb="md" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={14} width="90%" mb="sm" />
            ))}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

/* ──────────── Hero Carousel ──────────── */
function HeroCarousel({
  feeds,
  isAdmin,
  navigate,
}: {
  feeds: FeedType[];
  isAdmin: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [current, setCurrent] = useState(0);

  if (feeds.length === 0) return null;

  const feed = feeds[current];
  const prev = () => setCurrent((c) => (c === 0 ? feeds.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === feeds.length - 1 ? 0 : c + 1));

  return (
    <Paper
      radius="lg"
      style={{ overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => navigate(`/feed/${feed.id}`)}
    >
      <Grid gutter={0} align="stretch">
        {/* Left — text */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Box
            p={{ base: 28, md: 40 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              minHeight: 280,
            }}
          >
            <div>
              <Group gap={8} mb={20}>
                <Badge
                  size="sm"
                  variant="light"
                  color={CATEGORY_COLORS[feed.category] || 'gray'}
                  radius="sm"
                >
                  {FEED_CATEGORIES.find((c) => c.value === feed.category)?.label || feed.category}
                </Badge>
                <Text size="xs" c="dimmed">{formatDate(feed.createdAt)}</Text>
              </Group>

              <Title order={2} lh={1.35} mb={16} lineClamp={3}>
                {feed.title}
              </Title>

              <Text size="sm" c="dimmed" lh={1.7} lineClamp={3}>
                {feed.content}
              </Text>
            </div>

            {/* Controls */}
            <Group gap={8} mt={28} onClick={(e) => e.stopPropagation()}>
              <ActionIcon
                variant="default"
                size={36}
                radius="xl"
                onClick={prev}
                aria-label="이전"
              >
                <IconChevronLeft size={18} />
              </ActionIcon>
              <ActionIcon
                variant="default"
                size={36}
                radius="xl"
                onClick={next}
                aria-label="다음"
              >
                <IconChevronRight size={18} />
              </ActionIcon>

              {isAdmin && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={36}
                  radius="xl"
                  ml={4}
                  onClick={() => navigate(`/feed/edit/${feed.id}`)}
                  aria-label="편집"
                >
                  <IconEdit size={16} />
                </ActionIcon>
              )}
            </Group>
          </Box>
        </Grid.Col>

        {/* Right — image */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Box
            h="100%"
            mih={280}
            style={{
              background: feed.thumbnailUrl
                ? `url(${feed.thumbnailUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-5) 100%)',
            }}
          />
        </Grid.Col>
      </Grid>
    </Paper>
  );
}

/* ──────────── Article Card ──────────── */
function ArticleCard({
  feed,
  isAdmin,
  navigate,
  onDelete,
}: {
  feed: FeedType;
  isAdmin: boolean;
  navigate: ReturnType<typeof useNavigate>;
  onDelete: (id: string) => void;
}) {
  return (
    <Box
      py="xl"
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}
      onClick={() => navigate(`/feed/${feed.id}`)}
    >
      <Group wrap="nowrap" align="flex-start" gap={32}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap={8} mb={12}>
            <Badge
              size="lg"
              variant="light"
              color={CATEGORY_COLORS[feed.category] || 'gray'}
              radius="xl"
              styles={{ root: { textTransform: 'none', fontWeight: 500 } }}
            >
              {FEED_CATEGORIES.find((c) => c.value === feed.category)?.label || feed.category}
            </Badge>
            {isAdmin && (
              <Group gap={2} ml="auto" style={{ flexShrink: 0 }}>
                <ActionIcon variant="subtle" color="gray" size="xs" onClick={(e) => { e.stopPropagation(); navigate(`/feed/edit/${feed.id}`); }}>
                  <IconEdit size={14} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red" size="xs" onClick={(e) => { e.stopPropagation(); onDelete(feed.id); }}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            )}
          </Group>
          <Text fw={700} size="lg" lineClamp={2} mb={8} lh={1.4}>
            {feed.title}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2} lh={1.6} mb={8}>
            {feed.content}
          </Text>
          <Text size="xs" c="dimmed">{formatDate(feed.createdAt)}</Text>
        </div>
        {feed.thumbnailUrl && (
          <Image
            src={feed.thumbnailUrl}
            alt={feed.title}
            w={200}
            h={134}
            radius="lg"
            fit="cover"
            style={{ flexShrink: 0 }}
          />
        )}
      </Group>
    </Box>
  );
}

/* ──────────── Popular Sidebar ──────────── */
function PopularSidebar({ feeds, navigate }: { feeds: FeedType[]; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <Paper p="xl" radius="lg" bg="var(--mantine-color-gray-0)">
      <Title order={5} mb="lg">인기 글</Title>
      {feeds.length === 0 ? (
        <Text size="sm" c="dimmed">아직 등록된 글이 없습니다.</Text>
      ) : (
        <Stack gap="md">
          {feeds.map((feed, idx) => (
            <Group
              key={feed.id}
              gap="sm"
              wrap="nowrap"
              align="flex-start"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/feed/${feed.id}`)}
            >
              <Text
                fw={800}
                size="lg"
                c={idx < 3 ? 'blue' : 'dimmed'}
                style={{ minWidth: 22, textAlign: 'center', lineHeight: 1.3 }}
              >
                {idx + 1}
              </Text>
              <Text size="sm" fw={500} lineClamp={2} lh={1.3} style={{ minWidth: 0 }}>
                {feed.title}
              </Text>
            </Group>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

/* ══════════ Main Component ══════════ */
export function Feed() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [feeds, setFeeds] = useState<FeedType[]>([]);
  const [allFeeds, setAllFeeds] = useState<FeedType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState<string>('all');
  const limit = 5;

  // Delete confirm
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 전체 피드 로드 (캐러셀 + 사이드바용, 카테고리 무관)
  const loadAllFeeds = useCallback(async () => {
    try {
      const data = await getFeeds(1, undefined, 20);
      setAllFeeds(data.feeds);
    } catch {
      // 무시 — 메인 피드 로드 에러만 표시
    }
  }, []);

  useEffect(() => {
    loadAllFeeds();
  }, [loadAllFeeds]);

  // 카테고리별 피드 로드 (아티클 리스트용)
  const loadFeeds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFeeds(page, category);
      setFeeds(data.feeds);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '피드를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [page, category]);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  useEffect(() => {
    setPage(1);
  }, [category]);

  // 캐러셀/사이드바는 전체 피드 기반
  const featuredFeeds = useMemo(() => allFeeds.filter((f) => f.isFeatured), [allFeeds]);
  const popularFeeds = useMemo(
    () => [...allFeeds].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [allFeeds],
  );

  const handleDeleteConfirm = (id: string) => {
    setDeletingId(id);
    openDelete();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteFeed(deletingId);
      setFeeds((prev) => prev.filter((f) => f.id !== deletingId));
      setAllFeeds((prev) => prev.filter((f) => f.id !== deletingId));
      setTotal((prev) => prev - 1);
      closeDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Stack gap="lg">
      {/* Admin actions */}
      {isAdmin && (
        <Group justify="flex-end">
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/feed/write')}>
            새 글 작성
          </Button>
        </Group>
      )}

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

      {isLoading ? (
        <FeedSkeleton />
      ) : (
        <Stack gap="xl">
          {/* A. Hero Carousel — featured articles */}
          {featuredFeeds.length > 0 && (
            <HeroCarousel feeds={featuredFeeds} isAdmin={isAdmin} navigate={navigate} />
          )}

          {/* B + C. Article List + Popular Sidebar */}
          <Grid gutter="xl">
            {/* B. Article List */}
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Tabs value={category} onChange={(val) => setCategory(val || 'all')} mb="md">
                <Tabs.List>
                  {FEED_CATEGORIES.map((cat) => (
                    <Tabs.Tab key={cat.value} value={cat.value}>
                      {cat.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>

              {feeds.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">등록된 글이 없습니다.</Text>
              ) : (
                <Stack gap="md">
                  {feeds.map((feed) => (
                    <ArticleCard
                      key={feed.id}
                      feed={feed}
                      isAdmin={isAdmin}
                      navigate={navigate}
                      onDelete={handleDeleteConfirm}
                    />
                  ))}
                </Stack>
              )}

              {totalPages > 1 && (
                <Group justify="center" mt="xl">
                  <Pagination total={totalPages} value={page} onChange={setPage} />
                </Group>
              )}
            </Grid.Col>

            {/* C. Popular Sidebar */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <PopularSidebar feeds={popularFeeds} navigate={navigate} />
            </Grid.Col>
          </Grid>
        </Stack>
      )}

      {/* Delete Confirm Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="피드 삭제"
        centered
        lockScroll={false}
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">이 피드를 정말 삭제하시겠습니까?</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDelete}>
              취소
            </Button>
            <Button color="red" onClick={handleDelete}>
              삭제
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
