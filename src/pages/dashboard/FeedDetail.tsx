import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Alert,
  Badge,
  Box,
  Image,
  Container,
  Skeleton,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconCalendar,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFeed, deleteFeed, type Feed } from '../../services/feed';

const CATEGORY_LABELS: Record<string, string> = {
  general: '일반',
  seo: 'SEO',
  geo: 'GEO',
  update: '업데이트',
  tip: '팁',
};

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
    month: 'long',
    day: 'numeric',
  });
}

function DetailSkeleton() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Skeleton height={16} width={80} />
        <Skeleton height={36} width="80%" />
        <Skeleton height={14} width={120} />
        <Skeleton height={300} radius="md" />
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="60%" />
      </Stack>
    </Container>
  );
}

export function FeedDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [feed, setFeed] = useState<Feed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getFeed(id)
      .then(setFeed)
      .catch((err) => setError(err instanceof Error ? err.message : '피드를 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteFeed(id);
      navigate('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      closeDelete();
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (error || !feed) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red">
          {error || '피드를 찾을 수 없습니다.'}
        </Alert>
        <Button variant="subtle" mt="md" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/feed')}>
          피드 목록으로
        </Button>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        {/* 뒤로가기 */}
        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/feed')}
          px="xs"
          w="fit-content"
        >
          피드 목록
        </Button>

        {/* 카테고리 + 날짜 */}
        <Group gap="sm">
          <Badge
            size="md"
            variant="light"
            color={CATEGORY_COLORS[feed.category] || 'gray'}
          >
            {CATEGORY_LABELS[feed.category] || feed.category}
          </Badge>
          <Group gap={4}>
            <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed">{formatDate(feed.createdAt)}</Text>
          </Group>
        </Group>

        {/* 제목 */}
        <Title order={2} lh={1.3}>
          {feed.title}
        </Title>

        {/* Admin 액션 */}
        {isAdmin && (
          <Group gap="xs">
            <Button
              variant="light"
              size="xs"
              leftSection={<IconEdit size={14} />}
              onClick={() => navigate(`/feed/edit/${feed.id}`)}
            >
              수정
            </Button>
            <Button
              variant="light"
              color="red"
              size="xs"
              leftSection={<IconTrash size={14} />}
              onClick={openDelete}
            >
              삭제
            </Button>
          </Group>
        )}

        {/* 썸네일 */}
        {feed.thumbnailUrl && (
          <Image
            src={feed.thumbnailUrl}
            alt={feed.title}
            radius="md"
            mah={400}
            fit="cover"
          />
        )}

        {/* 본문 */}
        <Box
          className="feed-content"
          style={{
            lineHeight: 1.8,
            fontSize: 'var(--mantine-font-size-md)',
            wordBreak: 'keep-all',
          }}
          dangerouslySetInnerHTML={{ __html: feed.content }}
        />

      </Stack>

      {/* 삭제 확인 */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="피드 삭제" centered size="sm" lockScroll={false}>
        <Stack gap="md">
          <Text size="sm">이 피드를 정말 삭제하시겠습니까?</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDelete}>취소</Button>
            <Button color="red" onClick={handleDelete}>삭제</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
