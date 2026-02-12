import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  TextInput,
  Modal,
  Alert,
  TagsInput,
  Center,
  UnstyledButton,
  Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconAlertCircle,
  IconRefresh,
  IconTags,
  IconMessageQuestion,
  IconChartBar,
  IconCalendarEvent,
  IconFileDescription,
  IconChevronDown,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { getBrands } from '../../services/api';
import type { Brand, BrandDetail } from '../../types';
import { addBrand, updateBrand, deleteBrand } from '../../services/api';
import { BrandsSkeleton, BrandDetailPanel } from '../../components/ui';

export function Brands() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 선택된 브랜드 ID
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // 무한 스크롤
  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 정렬
  type SortMode = 'alpha' | 'oldest' | 'newest';
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const sortedBrands = useMemo(() => {
    const sorted = [...brands];
    switch (sortMode) {
      case 'alpha':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
  }, [brands, sortMode]);

  // 모달 상태
  const [opened, { open, close }] = useDisclosure(false);
  useBodyScrollLock(opened);
  const [brandName, setBrandName] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [modalMarketingPoints, setModalMarketingPoints] = useState<string[]>([]);
  const [modalKeywords, setModalKeywords] = useState<string[]>([]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const brandsData = await getBrands();
      setBrands(brandsData.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 무한 스크롤 IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [brands.length]);

  // 정렬 변경 시 visibleCount 리셋
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortMode]);

  // 첫 브랜드 자동 선택
  useEffect(() => {
    if (brands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brands[0].id);
    }
  }, [brands, selectedBrandId]);

  // 브랜드별 상세 데이터
  const brandDetailsMap = useMemo(() => {
    const map: Record<string, BrandDetail> = {};

    brands.forEach((brand) => {
      map[brand.id] = {
        ...brand,
        isActive: true,
      };
    });

    return map;
  }, [brands]);

  // 선택된 브랜드 상세 정보
  const selectedBrandDetail = selectedBrandId ? brandDetailsMap[selectedBrandId] : null;

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
  };

  const handleOpenAdd = () => {
    setBrandName('');
    setCompetitors([]);
    setModalMarketingPoints([]);
    setModalKeywords([]);
    open();
  };

  const handleInlineSave = async (data: { name: string; competitors: string[]; marketingPoints: string[]; keywords: string[] }) => {
    if (!selectedBrandId) return;
    try {
      await updateBrand(selectedBrandId, data);
      setBrands((prev) =>
        prev.map((b) =>
          b.id === selectedBrandId ? { ...b, ...data } : b
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand');
    }
  };

  const handleAddSave = async () => {
    if (!brandName.trim()) return;
    try {
      const newBrand = await addBrand({
        name: brandName,
        competitors,
        marketingPoints: modalMarketingPoints,
        keywords: modalKeywords,
      });
      setBrands((prev) => [...prev, newBrand]);
      setSelectedBrandId(newBrand.id);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand');
    }
  };

  const handleDelete = async (id?: string) => {
    const targetId = id || selectedBrandId;
    if (!targetId) return;

    try {
      await deleteBrand(targetId);
      setBrands((prev) => prev.filter((b) => b.id !== targetId));
      if (selectedBrandId === targetId) {
        const remaining = brands.filter((b) => b.id !== targetId);
        setSelectedBrandId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brand');
    }
  };

  const serviceGuides = [
    {
      icon: IconMessageQuestion,
      title: '질문 관리',
      description: 'AI에게 테스트할 질문을 등록하고 실행',
      path: '/dashboard/query-ops',
    },
    {
      icon: IconChartBar,
      title: '성과 개요',
      description: '인용률·순위·엔진별 성과를 한눈에',
      path: '/dashboard/overview',
    },
    {
      icon: IconCalendarEvent,
      title: '스케줄러',
      description: '자동 테스트 실행 빈도 설정',
      path: '/dashboard/scheduler',
    },
    {
      icon: IconFileDescription,
      title: '리포트 & 인사이트',
      description: 'AI 분석 리포트와 실행 가이드 확인',
      path: '/dashboard/reports',
    },
  ];

  if (isLoading) {
    return <BrandsSkeleton />;
  }

  return (
    <Stack gap="lg">
      {/* 헤더 */}
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>브랜드 관리</Title>
          <Text c="dimmed" size="sm">
            모니터링할 브랜드와 경쟁사를 등록하세요
          </Text>
        </div>
        <Group wrap="wrap">
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={loadData}
          >
            새로고침
          </Button>
          <Menu shadow="sm" width={160}>
            <Menu.Target>
              <UnstyledButton
                style={{
                  border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                  borderRadius: 'var(--mantine-radius-md)',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text size="sm">
                  {sortMode === 'alpha' ? '가나다순' : sortMode === 'oldest' ? '오래된 순' : '최신 순'}
                </Text>
                <IconChevronDown size={14} color="var(--mantine-color-dimmed)" />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => setSortMode('alpha')} fw={sortMode === 'alpha' ? 600 : undefined}>
                가나다순
              </Menu.Item>
              <Menu.Item onClick={() => setSortMode('oldest')} fw={sortMode === 'oldest' ? 600 : undefined}>
                오래된 순
              </Menu.Item>
              <Menu.Item onClick={() => setSortMode('newest')} fw={sortMode === 'newest' ? 600 : undefined}>
                최신 순
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAdd}>
            브랜드 추가
          </Button>
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

      {brands.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md" maw={400}>
              <IconTags size={48} stroke={1.5} color="var(--mantine-color-brand-5)" />
              <div style={{ textAlign: 'center' }}>
                <Text size="lg">왜 브랜드를 등록해야 하나요?</Text>
                <Text size="sm" c="dimmed" mt="xs">
                  브랜드를 등록하면 AI(ChatGPT, Gemini) 응답에서 브랜드가 언급(인용)되는지 자동으로 추적합니다.
                  경쟁사 대비 가시성을 분석하고 인사이트를 제공합니다.
                </Text>
              </div>
              <Text size="xs" c="dimmed" ta="center">
                예: "삼성전자" 브랜드를 등록하고 "최고의 TV 추천해줘"라고 테스트하면,
                AI가 삼성전자를 추천하는지 확인할 수 있습니다.
              </Text>
              <Button size="md" leftSection={<IconPlus size={16} />} onClick={handleOpenAdd}>
                첫 브랜드 추가하기 (30초)
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--mantine-spacing-md)', alignItems: 'start' }} className="brands-grid">
          {/* 왼쪽: 브랜드 목록 */}
          <Paper p="xs" radius="md" withBorder style={{ maxHeight: 480, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" px="xs" py={6}>
              <Text size="xs" c="dimmed">브랜드 목록</Text>
              <Text size="xs" c="dimmed">{brands.length}개</Text>
            </Group>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <Stack gap={2}>
                {sortedBrands.slice(0, visibleCount).map((brand) => {
                  const isSelected = selectedBrandId === brand.id;
                  return (
                    <UnstyledButton
                      key={brand.id}
                      onClick={() => handleSelectBrand(brand.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--mantine-radius-sm)',
                        backgroundColor: isSelected
                          ? 'light-dark(var(--mantine-color-brand-0), var(--mantine-color-brand-9))'
                          : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Text
                        size="sm"
                        fw={isSelected ? 600 : 400}
                        c={isSelected ? 'brand' : undefined}
                        truncate
                      >
                        {brand.name}
                      </Text>
                    </UnstyledButton>
                  );
                })}
                {visibleCount < sortedBrands.length && (
                  <div ref={sentinelRef} style={{ height: 1 }} />
                )}
              </Stack>
            </div>
          </Paper>

          {/* 오른쪽: 페이지 스타일 패널 */}
          {selectedBrandDetail && (
            <Paper p={{ base: 'md', sm: 'xl' }} radius="md" withBorder>
              <BrandDetailPanel
                brand={selectedBrandDetail}
                onSave={handleInlineSave}
                onDelete={() => handleDelete()}
                serviceGuides={serviceGuides.map((g) => ({
                  icon: g.icon,
                  title: g.title,
                  description: g.description,
                  onClick: () => navigate(g.path),
                }))}
              />
            </Paper>
          )}
        </div>
      )}

      {/* 브랜드 추가/수정 모달 */}
      <Modal
        opened={opened}
        onClose={close}
        title="새 브랜드 추가"
        centered
        lockScroll={false}
      >
        <Stack gap="md">
          <TextInput
            label="브랜드명"
            placeholder="예: 율립"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
          />
          <TagsInput
            label="경쟁사 브랜드"
            placeholder="경쟁사 입력 후 Enter"
            description="AI 응답에서 추적할 경쟁사 브랜드명"
            value={competitors}
            onChange={setCompetitors}
          />
          <TagsInput
            label="마케팅 포인트"
            placeholder="USP·강점 입력 후 Enter"
            description="브랜드의 핵심 차별점이나 강점"
            value={modalMarketingPoints}
            onChange={setModalMarketingPoints}
          />
          <TagsInput
            label="키워드"
            placeholder="키워드 입력 후 Enter"
            description="브랜드와 관련된 핵심 키워드"
            value={modalKeywords}
            onChange={setModalKeywords}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              취소
            </Button>
            <Button onClick={handleAddSave} disabled={!brandName.trim()}>
              추가
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
