import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Box,
  UnstyledButton,
  Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Carousel } from '@mantine/carousel';
import {
  IconPlus,
  IconAlertCircle,
  IconRefresh,
  IconTags,
  IconSelect,
  IconBuilding,
  IconMessageQuestion,
  IconBrain,
  IconFileDescription,
  IconChevronDown,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { getBrands, addBrand, updateBrand, deleteBrand, getStats, getResults, getQueries, getSavedInsights } from '../../services/api';
import type { Brand, BrandDetail, TestResult, MonitoredQuery, BrandStats } from '../../types';
import type { SavedInsight } from '../../services/api';
import { BrandsSkeleton, BrandDetailPanel } from '../../components/ui';

export function Brands() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandStats, setBrandStats] = useState<BrandStats[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 선택된 브랜드 ID
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

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
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);

  // 모든 데이터 로드
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [brandsData, statsData, resultsData, queriesData, insightsData] = await Promise.all([
        getBrands(),
        getStats(),
        getResults(),
        getQueries(),
        getSavedInsights().catch(() => ({ insights: [] })),
      ]);
      setBrands(brandsData.brands);
      setBrandStats(statsData.brandStats || []);
      setResults(resultsData.results || []);
      setQueries(queriesData.queries || []);
      setInsights(insightsData.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 첫 브랜드 자동 선택
  useEffect(() => {
    if (brands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brands[0].id);
    }
  }, [brands, selectedBrandId]);

  // 브랜드별 상세 데이터 계산
  const brandDetailsMap = useMemo(() => {
    const map: Record<string, BrandDetail> = {};

    brands.forEach((brand) => {
      // 브랜드 통계 찾기
      const stats = brandStats.find((s) => s.brandId === brand.id);

      // 연결된 쿼리 수 계산
      const linkedQueries = queries.filter((q) => q.brandIds?.includes(brand.id)).length;

      // 경쟁사별 인용률 계산
      const competitorStats: Array<{ name: string; citationRate: number }> = [];
      if (brand.competitors && brand.competitors.length > 0) {
        brand.competitors.forEach((competitorName) => {
          // 해당 경쟁사가 언급된 결과 수 계산
          let mentionCount = 0;
          results.forEach((result) => {
            const brandResult = result.brandResults?.find((br) => br.brandId === brand.id);
            if (brandResult?.competitorMentions?.includes(competitorName)) {
              mentionCount++;
            }
          });
          const rate = results.length > 0 ? Math.round((mentionCount / results.length) * 1000) / 10 : 0;
          competitorStats.push({ name: competitorName, citationRate: rate });
        });
      }

      // 최근 활동 생성 (실제 데이터 기반)
      const recentActivity: BrandDetail['recentActivity'] = [];

      // 최근 테스트 결과 추가
      const brandResults = results
        .filter((r) => r.brandResults?.some((br) => br.brandId === brand.id))
        .slice(0, 3);
      brandResults.forEach((result) => {
        recentActivity.push({
          type: 'test',
          title: `"${result.query.slice(0, 30)}${result.query.length > 30 ? '...' : ''}" 테스트 완료`,
          timestamp: result.testedAt,
        });
      });

      // 해당 브랜드의 인사이트 추가
      const brandInsights = insights
        .filter((i) => i.brandId === brand.id)
        .slice(0, 2);
      brandInsights.forEach((insight) => {
        recentActivity.push({
          type: 'insight',
          title: `${brand.name} 인사이트 분석 완료`,
          timestamp: insight.metadata?.analyzedAt || new Date().toISOString(),
        });
      });

      // 시간순 정렬
      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      map[brand.id] = {
        ...brand,
        isActive: true,
        stats: {
          citationRate: stats?.citationRate ?? 0,
          avgRank: stats?.avgRank ?? null,
          totalTests: stats?.totalTests ?? 0,
          linkedQueries,
        },
        competitorStats,
        recentActivity: recentActivity.slice(0, 5),
      };
    });

    return map;
  }, [brands, brandStats, results, queries, insights]);

  // 선택된 브랜드 상세 정보
  const selectedBrandDetail = selectedBrandId ? brandDetailsMap[selectedBrandId] : null;

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
  };

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setBrandName('');
    setCompetitors([]);
    open();
  };

  const handleOpenEdit = (brand?: Brand) => {
    const targetBrand = brand || brands.find((b) => b.id === selectedBrandId);
    if (targetBrand) {
      setEditingBrand(targetBrand);
      setBrandName(targetBrand.name);
      setCompetitors(targetBrand.competitors || []);
      open();
    }
  };

  const handleSave = async () => {
    if (!brandName.trim()) return;

    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, { name: brandName, competitors });
        setBrands((prev) =>
          prev.map((b) =>
            b.id === editingBrand.id ? { ...b, name: brandName, competitors } : b
          )
        );
      } else {
        const newBrand = await addBrand({ name: brandName, competitors });
        setBrands((prev) => [...prev, newBrand]);
        setSelectedBrandId(newBrand.id);
      }
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

  if (isLoading) {
    return <BrandsSkeleton />;
  }

  return (
    <Stack gap="lg">
      {/* 헤더 */}
      <Group justify="space-between">
        <div>
          <Title order={2}>브랜드 설정</Title>
          <Text c="dimmed" size="sm">
            모니터링할 브랜드와 경쟁사를 등록하세요
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={loadAllData}
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
        <Stack gap="lg">
          {/* 상단: 브랜드 캐러셀 */}
          <style>{`
            .brand-carousel .mantine-Carousel-control[data-inactive] { visibility: hidden !important; pointer-events: none !important; }
            .brand-carousel::after {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 60px;
              height: 100%;
              background: linear-gradient(to right, transparent, var(--mantine-color-body));
              pointer-events: none;
              z-index: 1;
            }
          `}</style>
          <Carousel
            className="brand-carousel"
            style={{ position: 'relative' }}
            slideSize="154px"
            slideGap="sm"
            align="start"
            slidesToScroll={3}
            containScroll="trimSnaps"
            withControls={sortedBrands.length > 5}
            styles={{
              controls: {
                top: '50%',
                transform: 'translateY(-50%)',
                left: -18,
                right: -18,
                zIndex: 2,
              },
              control: {
                backgroundColor: 'var(--mantine-color-body)',
                border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                boxShadow: 'var(--mantine-shadow-sm)',
                width: 36,
                height: 36,
                borderRadius: '50%',
              },
            }}
          >
            {sortedBrands.map((brand) => {
              const isSelected = selectedBrandId === brand.id;

              return (
                <Carousel.Slide key={brand.id}>
                  <UnstyledButton
                    onClick={() => handleSelectBrand(brand.id)}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: 16,
                      backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
                      position: 'relative',
                      overflow: 'hidden',
                      border: isSelected
                        ? '3px solid var(--mantine-color-brand-5)'
                        : '3px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* 하단 브랜드 라벨 */}
                    <Group
                      gap={6}
                      wrap="nowrap"
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 12,
                        right: 12,
                      }}
                    >
                      <IconBuilding size={16} stroke={1.5} color="light-dark(var(--mantine-color-gray-6), var(--mantine-color-dark-2))" style={{ flexShrink: 0 }} />
                      <Text size="sm" c="light-dark(var(--mantine-color-gray-7), var(--mantine-color-dark-0))" truncate>
                        {brand.name}
                      </Text>
                    </Group>
                  </UnstyledButton>
                </Carousel.Slide>
              );
            })}
          </Carousel>

          {/* 바로가기 */}
          <Group gap="sm">
            <Button
              variant="default"
              c="dimmed"
              leftSection={<IconMessageQuestion size={16} />}
              onClick={() => navigate('/dashboard/query-ops')}
            >
              쿼리 관리
            </Button>
            <Button
              variant="default"
              c="dimmed"
              leftSection={<IconBrain size={16} />}
              onClick={() => navigate('/dashboard/reports?tab=insights')}
            >
              인사이트 보기
            </Button>
            <Button
              variant="default"
              c="dimmed"
              leftSection={<IconFileDescription size={16} />}
              onClick={() => navigate('/dashboard/reports?tab=reports')}
            >
              리포트 확인
            </Button>
          </Group>

          {/* 하단: 브랜드 상세 */}
          {selectedBrandDetail ? (
            <BrandDetailPanel
              brand={selectedBrandDetail}
              onEdit={() => handleOpenEdit()}
              onDelete={() => handleDelete()}
            />
          ) : (
            <Paper p="xl" radius="md" withBorder>
              <Center h={400}>
                <Stack align="center" gap="md">
                  <IconSelect size={48} stroke={1.5} color="gray" />
                  <Text c="dimmed">상단 캐러셀에서 브랜드를 선택하세요</Text>
                </Stack>
              </Center>
            </Paper>
          )}
        </Stack>
      )}

      {/* 브랜드 추가/수정 모달 */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingBrand ? '브랜드 수정' : '새 브랜드 추가'}
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
          <Text size="xs" c="dimmed">
            예시: "삼성", "LG", "애플" (경쟁사가 언급되면 별도 표시됩니다)
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={!brandName.trim()}>
              {editingBrand ? '수정' : '추가'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
