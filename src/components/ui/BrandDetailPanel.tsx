import { useState } from 'react';
import {
  Group,
  Text,
  Badge,
  Stack,
  Button,
  Divider,
  SimpleGrid,
  TextInput,
  TagsInput,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import type { BrandDetail } from '../../types';

interface ServiceGuide {
  icon: React.FC<{ size?: number; stroke?: number; color?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  onClick: () => void;
}

interface BrandDetailPanelProps {
  brand: BrandDetail;
  onSave?: (data: { name: string; competitors: string[]; marketingPoints: string[]; keywords: string[] }) => void;
  onDelete?: () => void;
  serviceGuides?: ServiceGuide[];
}

export function BrandDetailPanel({ brand, onSave, onDelete, serviceGuides }: BrandDetailPanelProps) {
  const isActive = brand.isActive !== false;
  const competitors = brand.competitors ?? [];
  const marketingPoints = brand.marketingPoints ?? [];
  const keywords = brand.keywords ?? [];

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompetitors, setEditCompetitors] = useState<string[]>([]);
  const [editMarketingPoints, setEditMarketingPoints] = useState<string[]>([]);
  const [editKeywords, setEditKeywords] = useState<string[]>([]);

  const startEdit = () => {
    setEditName(brand.name);
    setEditCompetitors([...competitors]);
    setEditMarketingPoints([...marketingPoints]);
    setEditKeywords([...keywords]);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveAll = () => {
    if (!editName.trim()) return;
    onSave?.({
      name: editName.trim(),
      competitors: editCompetitors,
      marketingPoints: editMarketingPoints,
      keywords: editKeywords,
    });
    setEditing(false);
  };

  const globalActions = (
    <Group gap="xs" justify="flex-end">
      <Button size="xs" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={cancelEdit}>
        취소
      </Button>
      <Button size="xs" leftSection={<IconCheck size={14} />} onClick={saveAll}>
        저장
      </Button>
    </Group>
  );

  return (
    <Stack gap="lg">
      {/* 브랜드 헤더 */}
      <div>
        {editing ? (
          <TextInput
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="브랜드명"
            size="md"
            autoFocus
          />
        ) : (
          <>
            <Stack gap="xs">
              <Group gap="sm" align="baseline" wrap="wrap">
                <Text fw={700} size="xl">{brand.name}</Text>
                <Badge color={isActive ? 'green' : 'gray'} variant="light" size="sm">
                  {isActive ? '활성' : '비활성'}
                </Badge>
              </Group>
              <Group gap="xs">
                <Button size="xs" variant="subtle" color="gray" leftSection={<IconEdit size={14} />} onClick={startEdit}>
                  수정
                </Button>
                <Button size="xs" variant="subtle" color="red" leftSection={<IconTrash size={14} />} onClick={onDelete}>
                  삭제
                </Button>
              </Group>
            </Stack>
            <Text size="xs" c="dimmed" mt={2}>
              등록일 {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString('ko-KR') : '-'}
            </Text>
          </>
        )}
      </div>

      <Divider />

      {/* 경쟁사 */}
      <div>
        <Text size="sm" c="dimmed" mb={8}>경쟁사</Text>
        {editing ? (
          <TagsInput
            value={editCompetitors}
            onChange={setEditCompetitors}
            placeholder="경쟁사 입력 후 Enter"
            size="sm"
          />
        ) : competitors.length > 0 ? (
          <Group gap="xs">
            {competitors.map((c, i) => (
              <Badge key={i} variant="light" color="gray" size="lg" radius="sm">
                {c}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text size="xs" c="dimmed" fs="italic">
            경쟁사를 등록하면 AI 응답에서 경쟁사 언급을 추적합니다.
          </Text>
        )}
      </div>

      {/* 마케팅 포인트 */}
      <div>
        <Text size="sm" c="dimmed" mb={8}>마케팅 포인트</Text>
        {editing ? (
          <TagsInput
            value={editMarketingPoints}
            onChange={setEditMarketingPoints}
            placeholder="USP·강점 입력 후 Enter"
            size="sm"
          />
        ) : marketingPoints.length > 0 ? (
          <Group gap="xs">
            {marketingPoints.map((mp, i) => (
              <Badge key={i} variant="light" color="teal" size="lg" radius="sm">
                {mp}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text size="xs" c="dimmed" fs="italic">
            브랜드의 USP·강점을 입력하면 AI 인사이트 분석에 활용됩니다.
          </Text>
        )}
      </div>

      {/* 키워드 */}
      <div>
        <Text size="sm" c="dimmed" mb={8}>키워드</Text>
        {editing ? (
          <TagsInput
            value={editKeywords}
            onChange={setEditKeywords}
            placeholder="키워드 입력 후 Enter"
            size="sm"
          />
        ) : keywords.length > 0 ? (
          <Group gap="xs">
            {keywords.map((kw, i) => (
              <Badge key={i} variant="light" color="blue" size="lg" radius="sm">
                {kw}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text size="xs" c="dimmed" fs="italic">
            관련 키워드를 등록하면 더 정확한 마케팅 전략을 제안받을 수 있습니다.
          </Text>
        )}
      </div>

      {/* 저장/취소 */}
      {editing && globalActions}

      {/* 가이드 */}
      {serviceGuides && serviceGuides.length > 0 && (
        <>
          <Divider />
          <div>
            <Text size="xs" c="dimmed" mb="sm">시작하기</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {serviceGuides.map((guide) => (
                <Group
                  key={guide.title}
                  gap="sm"
                  wrap="nowrap"
                  py="xs"
                  px="sm"
                  style={{
                    cursor: 'pointer',
                    borderRadius: 'var(--mantine-radius-sm)',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="guide-row"
                  onClick={guide.onClick}
                >
                  <guide.icon size={16} stroke={1.5} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>{guide.title}</Text>
                    <Text size="xs" c="dimmed">{guide.description}</Text>
                  </div>
                  <Button variant="outline" color="gray" size="compact-xs" onClick={guide.onClick}>
                    바로가기
                  </Button>
                </Group>
              ))}
            </SimpleGrid>
          </div>
        </>
      )}
    </Stack>
  );
}
