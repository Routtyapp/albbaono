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
  Grid,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconAlertCircle,
  IconRefresh,
  IconTags,
  IconSelect,
} from '@tabler/icons-react';
import { getBrands, addBrand, updateBrand, deleteBrand, getStats, getResults, getQueries, getSavedInsights } from '../../services/api';
import type { Brand, BrandDetail, TestResult, MonitoredQuery, BrandStats } from '../../types';
import type { SavedInsight } from '../../services/api';
import { BrandsSkeleton, BrandListItem, BrandDetailPanel } from '../../components/ui';

export function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandStats, setBrandStats] = useState<BrandStats[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 선택된 브랜드 ID
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

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
            <Stack align="center" gap="md">
              <IconTags size={48} stroke={1.5} color="gray" />
              <div style={{ textAlign: 'center' }}>
                <Text fw={500}>등록된 브랜드가 없습니다</Text>
                <Text size="sm" c="dimmed">
                  브랜드를 추가하면 쿼리 테스트 시 자동으로 인용 여부를 체크합니다
                </Text>
              </div>
              <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAdd}>
                첫 브랜드 추가하기
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Grid>
          {/* 좌측: 브랜드 목록 */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" withBorder h="100%">
              <Text fw={500} mb="sm" size="sm" c="dimmed">
                브랜드 목록 ({brands.length})
              </Text>
              <ScrollArea.Autosize mah={600}>
                <Stack gap="xs">
                  {brands.map((brand) => {
                    const detail = brandDetailsMap[brand.id];
                    return (
                      <BrandListItem
                        key={brand.id}
                        brand={brand}
                        citationRate={detail?.stats?.citationRate ?? 0}
                        queryCount={detail?.stats?.linkedQueries ?? 0}
                        isSelected={selectedBrandId === brand.id}
                        onClick={() => handleSelectBrand(brand.id)}
                      />
                    );
                  })}
                </Stack>
              </ScrollArea.Autosize>
            </Paper>
          </Grid.Col>

          {/* 우측: 브랜드 상세 */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            {selectedBrandDetail ? (
              <BrandDetailPanel
                brand={selectedBrandDetail}
                onEdit={() => handleOpenEdit()}
                onDelete={() => handleDelete()}
              />
            ) : (
              <Paper p="xl" radius="md" withBorder h="100%">
                <Center h={400}>
                  <Stack align="center" gap="md">
                    <IconSelect size={48} stroke={1.5} color="gray" />
                    <Text c="dimmed">좌측 목록에서 브랜드를 선택하세요</Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Grid.Col>
        </Grid>
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
