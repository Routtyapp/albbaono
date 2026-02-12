import { useState } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Modal,
  NavLink,
  Text,
  Title,
  Stack,
  Group,
  List,
  Badge,
  Box,
  ScrollArea,
  Alert,
  Table,
  Divider,
} from '@mantine/core';
import {
  IconChartBar,
  IconTags,
  IconMessageQuestion,
  IconFileDescription,
  IconTrophy,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface GuideModalProps {
  opened: boolean;
  onClose: () => void;
}

const menuItems = [
  { key: 'brands', label: '브랜드', icon: IconTags },
  { key: 'queryOps', label: '질문 관리', icon: IconMessageQuestion },
  { key: 'performance', label: '성과', icon: IconChartBar },
  { key: 'reports', label: '리포트/인사이트', icon: IconFileDescription },
  { key: 'score', label: 'GEO 스코어', icon: IconTrophy },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="sm">
      <Title order={4} fz="md">{title}</Title>
      {children}
    </Stack>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <List type="ordered" spacing="xs" fz="sm" c="dimmed">
      {steps.map((s, i) => <List.Item key={i}>{s}</List.Item>)}
    </List>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} py="xs" px="sm">
      <Text fz="sm" lh={1.6}>{children}</Text>
    </Alert>
  );
}

function Requirement({ children }: { children: ReactNode }) {
  return (
    <Alert variant="light" color="orange" icon={<IconAlertTriangle size={16} />} py="xs" px="sm">
      <Text fz="sm" lh={1.6}>{children}</Text>
    </Alert>
  );
}

function GuideContent({ active }: { active: string }) {
  const content: Record<string, ReactNode> = {
    brands: (
      <Stack gap="lg">
        <Text fz="sm" c="dimmed" lh={1.7}>
          AI 검색 결과에서 추적할 브랜드를 등록하고 관리합니다.
          경쟁사 브랜드도 함께 등록하면 같은 질문에서 인용 여부를 비교 분석할 수 있습니다.
        </Text>
        <Requirement>질문 테스트를 실행하려면 최소 1개 이상의 브랜드가 등록되어 있어야 합니다.</Requirement>
        <Section title="브랜드 등록 방법">
          <Steps steps={[
            '"브랜드 추가" 버튼을 클릭합니다.',
            '브랜드명을 입력합니다. (필수)',
            '경쟁사 브랜드명을 태그 형태로 추가합니다. (선택)',
            '"등록" 버튼을 눌러 완료합니다.',
          ]} />
        </Section>
        <Section title="브랜드 상세 정보">
          <Text fz="sm" c="dimmed" lh={1.7}>
            등록된 브랜드를 클릭하면 상세 패널이 열립니다. 여기서 다음 항목을 인라인 수정할 수 있습니다.
          </Text>
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>경쟁사</b> — 태그 형태로 경쟁 브랜드를 추가/삭제</List.Item>
            <List.Item><b>마케팅 포인트</b> — 브랜드의 강점이나 USP를 태그로 관리</List.Item>
            <List.Item><b>키워드</b> — AI 응답에서 추적할 핵심 키워드 등록</List.Item>
          </List>
        </Section>
        <Section title="브랜드 통계">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>인용률</b> — 해당 브랜드가 AI 응답에서 언급된 비율</List.Item>
            <List.Item><b>평균 순위</b> — AI 응답 내 브랜드 언급 순서의 평균</List.Item>
            <List.Item><b>테스트 수</b> — 브랜드에 연결된 질문의 총 테스트 횟수</List.Item>
            <List.Item><b>경쟁사 언급</b> — AI 응답에서 경쟁사가 언급된 통계</List.Item>
          </List>
        </Section>
        <Tip>
          브랜드명은 AI가 실제로 언급하는 형태와 동일하게 입력하세요. 예를 들어 "삼성전자"와 "Samsung" 등 여러 변형이 있다면 가장 대표적인 형태를 사용하세요.
        </Tip>
      </Stack>
    ),
    queryOps: (
      <Stack gap="lg">
        <Text fz="sm" c="dimmed" lh={1.7}>
          AI에게 테스트할 질문을 등록하고, 수동 실행 또는 자동 예약(스케줄링)으로 정기 테스트를 수행합니다.
          "질문 관리" 탭과 "질문 예약" 탭으로 구성되어 있습니다.
        </Text>
        <Requirement>테스트를 실행하려면 최소 1개 이상의 브랜드가 등록되어 있어야 합니다.</Requirement>

        <Divider label="질문 관리 탭" labelPosition="left" />

        <Section title="질문 등록 방법">
          <Steps steps={[
            '"질문 추가" 버튼을 클릭합니다.',
            '질의 내용을 입력합니다.',
            '카테고리를 선택합니다.',
            '모니터링할 브랜드를 연결합니다.',
            '등록 후 수동 테스트 또는 자동 예약이 가능합니다.',
          ]} />
        </Section>
        <Section title="질문 카테고리">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>제품 추천</b> — "OO 분야에서 추천할 만한 서비스는?"</List.Item>
            <List.Item><b>서비스 비교</b> — "A와 B 중 어떤 것이 더 나은가요?"</List.Item>
            <List.Item><b>기술 문의</b> — "OO 기능은 어떻게 사용하나요?"</List.Item>
            <List.Item><b>가격 문의</b> — "OO의 요금제는 어떻게 되나요?"</List.Item>
            <List.Item><b>브랜드 평판</b> — "OO의 사용자 리뷰는 어떤가요?"</List.Item>
            <List.Item><b>기타</b> — 위 카테고리에 해당하지 않는 질의</List.Item>
          </List>
        </Section>
        <Section title="테스트 실행">
          <Text fz="sm" c="dimmed" lh={1.7}>
            질문 목록에서 "테스트 실행" 버튼을 클릭하면 해당 질문이 AI 엔진(ChatGPT, Gemini)에 전송됩니다.
            각 결과에서 브랜드별 인용 여부, 인용 순위, 경쟁사 언급을 확인할 수 있습니다.
          </Text>
        </Section>
        <Section title="지원 AI 엔진">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>ChatGPT</b> — GPT-4o-mini 기반</List.Item>
            <List.Item><b>Gemini</b> — Gemini 2.0 Flash 기반</List.Item>
          </List>
        </Section>

        <Divider label="질문 예약 탭" labelPosition="left" />

        <Section title="자동 스케줄링">
          <Text fz="sm" c="dimmed" lh={1.7}>
            질문별로 테스트 빈도를 설정하여 자동 실행할 수 있습니다.
          </Text>
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>일간</b> — 매일 지정된 시간에 실행 (기본 09:00)</List.Item>
            <List.Item><b>주간</b> — 매주 지정 요일·시간에 실행 (기본 월요일 09:00)</List.Item>
            <List.Item><b>월간</b> — 매월 지정 날짜·시간에 실행 (기본 1일 09:00)</List.Item>
          </List>
          <Text fz="sm" c="dimmed" lh={1.7} mt="xs">
            스케줄러는 "질문 예약" 탭에서 활성화/비활성화할 수 있으며, 실행 시간과 요일도 커스터마이즈 가능합니다.
            실행 이력도 함께 확인할 수 있습니다.
          </Text>
        </Section>
        <Tip>
          구매 의도가 포함된 질문이 가장 효과적입니다. "OO 분야에서 추천할 만한 서비스는?", "OO 문제를 해결하려면 어떤 도구를 써야 해?" 등 실제 사용자가 AI에게 물어볼 법한 질문을 작성하세요.
        </Tip>
      </Stack>
    ),
    performance: (
      <Stack gap="lg">
        <Text fz="sm" c="dimmed" lh={1.7}>
          브랜드의 AI 가시성 성과를 한눈에 파악할 수 있는 대시보드입니다.
          "개요", "상세 인용", "성장" 3개 탭으로 구성되어 있습니다.
        </Text>

        <Divider label="개요 탭" labelPosition="left" />

        <Section title="확인할 수 있는 지표">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>총 테스트 수</b> — 지금까지 실행된 전체 질문 테스트 횟수</List.Item>
            <List.Item><b>인용률</b> — AI 응답에서 브랜드가 언급된 비율 (%)</List.Item>
            <List.Item><b>인용 횟수</b> — 브랜드가 실제로 인용된 총 횟수</List.Item>
            <List.Item><b>등록 브랜드 수</b> — 현재 모니터링 중인 브랜드 개수</List.Item>
            <List.Item><b>등록/활성 질문</b> — 전체 질문 수와 스케줄링이 활성화된 질문 수</List.Item>
          </List>
        </Section>
        <Section title="브랜드 필터">
          <Text fz="sm" c="dimmed" lh={1.7}>
            상단의 브랜드 선택 필터를 통해 전체 브랜드 또는 개별 브랜드별 통계를 확인할 수 있습니다.
            개별 브랜드를 선택하면 해당 브랜드의 평균 인용 순위도 함께 표시됩니다.
          </Text>
        </Section>
        <Section title="엔진별 성과">
          <Text fz="sm" c="dimmed" lh={1.7}>
            "전체 브랜드"를 선택하면 ChatGPT, Gemini 각 엔진별 인용 횟수, 테스트 수, 인용률을 비교할 수 있습니다.
          </Text>
        </Section>

        <Divider label="상세 인용 탭" labelPosition="left" />

        <Section title="결과 확인 방법">
          <Steps steps={[
            '질문 관리에서 테스트를 실행하거나, 실행된 결과 목록에서 항목을 선택합니다.',
            '선택한 결과의 AI 응답 원문과 브랜드별 인용 분석이 표시됩니다.',
            '키워드 하이라이트와 인용 맥락을 확인합니다.',
          ]} />
        </Section>
        <Section title="분석 항목">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>인용 여부</b> — AI 응답에서 브랜드가 직접 언급되었는지 여부</List.Item>
            <List.Item><b>인용 순위</b> — 응답 내에서 브랜드가 몇 번째로 언급되었는지</List.Item>
            <List.Item><b>경쟁사 언급</b> — 같은 응답에서 등록된 경쟁사가 언급되었는지 추적</List.Item>
            <List.Item><b>키워드 분석</b> — 응답에서 가장 많이 등장한 상위 10개 키워드를 자동 추출</List.Item>
            <List.Item><b>응답 원문</b> — AI의 전체 응답 텍스트 확인 (브랜드명 하이라이트)</List.Item>
          </List>
        </Section>

        <Divider label="성장 탭" labelPosition="left" />

        <Section title="시계열 분석">
          <Text fz="sm" c="dimmed" lh={1.7}>
            시간에 따른 AI 인용률의 변화를 시각적으로 보여줍니다.
            "개요" 탭이 현재 시점의 스냅샷이라면, "성장" 탭은 인용률이 올라가고 있는지, 내려가고 있는지를 파악할 수 있는 시계열 분석 도구입니다.
          </Text>
        </Section>
        <Section title="기간 선택">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>1주</b> — 최근 7일간 일별 추이. 단기 변동 파악에 적합</List.Item>
            <List.Item><b>1개월</b> — 최근 30일간 주별 추이. 기본 선택값</List.Item>
            <List.Item><b>3개월</b> — 최근 90일간 주별 추이. 장기 트렌드 파악에 적합</List.Item>
          </List>
        </Section>
        <Section title="3가지 차트">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>전체 인용률 추이</b> — 인용률(%)을 시간순으로 표시하여 상승/하락 추세를 파악</List.Item>
            <List.Item><b>엔진별 인용률 추이</b> — ChatGPT와 Gemini 각 엔진의 인용률을 색상별로 비교</List.Item>
            <List.Item><b>카테고리별 인용률</b> — 질문 카테고리별 평균 인용률을 비교</List.Item>
          </List>
        </Section>
        <Tip>
          데이터가 충분히 쌓여야 의미 있는 트렌드를 볼 수 있습니다. 스케줄러를 활용하여 정기적으로 테스트를 실행하면 더 정확한 시계열 분석이 가능합니다.
        </Tip>
      </Stack>
    ),
    reports: (
      <Stack gap="lg">
        <Text fz="sm" c="dimmed" lh={1.7}>
          AI 가시성 성과를 정리한 리포트를 생성하고, AI가 분석한 전략 인사이트를 확인합니다.
          "리포트" 탭과 "인사이트" 탭으로 구성되어 있습니다.
        </Text>

        <Divider label="리포트 탭" labelPosition="left" />

        <Requirement>리포트를 생성하려면 최소 5개 이상의 테스트가 완료되어 있어야 합니다.</Requirement>
        <Section title="리포트 생성 방법">
          <Steps steps={[
            '최소 5개의 테스트를 완료합니다.',
            '"리포트 생성" 버튼을 클릭합니다.',
            '주간 또는 월간 리포트 유형을 선택합니다.',
            '생성이 완료되면 목록에 추가됩니다.',
          ]} />
        </Section>
        <Section title="리포트에 포함되는 항목">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>인용률 및 변화 추이</b> — 전체 인용률과 이전 대비 증감폭</List.Item>
            <List.Item><b>점유율 (Share of Voice)</b> — AI 응답에서 브랜드가 차지하는 비중</List.Item>
            <List.Item><b>평균 순위 및 변동</b> — 인용 순위의 평균과 변화</List.Item>
            <List.Item><b>엔진별 성과</b> — ChatGPT, Gemini 각 엔진의 인용 수, 순위, 테스트 수</List.Item>
            <List.Item><b>브랜드별 상세</b> — 브랜드별 인용률, 순위, 성과 비교</List.Item>
            <List.Item><b>상위/하위 질문</b> — 인용이 잘 되는 질문과 개선이 필요한 질문</List.Item>
          </List>
        </Section>

        <Divider label="인사이트 탭" labelPosition="left" />

        <Section title="인사이트 생성 방법">
          <Steps steps={[
            '분석할 브랜드를 선택합니다.',
            '"인사이트 분석" 버튼을 클릭합니다.',
            'AI가 해당 브랜드의 모든 테스트 응답을 종합 분석합니다.',
            '분석 결과가 4개 탭으로 정리되어 표시됩니다.',
          ]} />
        </Section>
        <Section title="4가지 분석">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>공략 키워드</b> — 핵심 키워드를 중요도(높음/중간/낮음)별로 정리</List.Item>
            <List.Item><b>카테고리별 분석</b> — 질문 카테고리별로 AI가 중요시하는 요소와 개선 사항</List.Item>
            <List.Item><b>인용 패턴</b> — 인용 성공/실패의 공통 패턴 도출</List.Item>
            <List.Item><b>실행 가이드</b> — 우선순위별 구체적인 액션 아이템 제공</List.Item>
          </List>
        </Section>
        <Section title="내보내기">
          <Text fz="sm" c="dimmed" lh={1.7}>
            리포트와 인사이트 모두 PDF로 다운로드할 수 있습니다.
            인사이트는 최근 10건의 분석 히스토리가 저장되어 이전 분석과 비교할 수 있습니다.
          </Text>
        </Section>
        <Tip>
          주간 리포트로 단기 변화를 추적하고, 월간 리포트로 장기적인 트렌드를 파악하세요.
          인사이트의 "실행 가이드" 탭에서 콘텐츠 전략 개선 방향을 확인할 수 있습니다.
        </Tip>
      </Stack>
    ),
    score: (
      <Stack gap="lg">
        <Text fz="sm" c="dimmed" lh={1.7}>
          웹사이트 URL을 입력하면 AI 검색 엔진에 최적화되어 있는지 5가지 카테고리로 분석하여 점수와 등급을 제공합니다.
        </Text>
        <Section title="분석 방법">
          <Steps steps={[
            '분석할 웹사이트 URL을 입력합니다.',
            '서브페이지 포함 여부를 선택합니다. (최대 20페이지, 기본 10페이지)',
            '"분석 시작" 버튼을 클릭합니다.',
            '5개 카테고리별 점수와 종합 등급이 표시됩니다.',
          ]} />
        </Section>
        <Section title="5가지 평가 카테고리">
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><b>Structure (구조)</b> — HTML 구조, 헤딩(H1~H6) 계층, 시맨틱 마크업 적절성</List.Item>
            <List.Item><b>Schema (스키마)</b> — 구조화된 데이터(JSON-LD 등) 마크업 존재 여부와 품질</List.Item>
            <List.Item><b>URL</b> — URL 구조의 가독성, 깊이, 키워드 포함 여부</List.Item>
            <List.Item><b>Meta (메타태그)</b> — title, description, Open Graph 등 메타태그 최적화 수준</List.Item>
            <List.Item><b>Content (콘텐츠)</b> — 콘텐츠 품질, 구조화, 가독성, 핵심 키워드 밀도</List.Item>
          </List>
        </Section>
        <Section title="등급 체계">
          <Table fz="sm" withRowBorders={false}>
            <Table.Tbody>
              {[
                ['A+', '90~100점', '최고 수준의 GEO 최적화'],
                ['A', '85~89점', '우수한 최적화 상태'],
                ['B+', '80~84점', '양호, 소폭 개선 여지'],
                ['B', '75~79점', '평균 이상, 개선 권장'],
                ['C+', '70~74점', '보통, 여러 항목 개선 필요'],
                ['C', '60~69점', '미흡, 적극 개선 필요'],
                ['D', '50~59점', '부족, 다수 항목 미달'],
                ['F', '50점 미만', '심각한 개선 필요'],
              ].map(([grade, range, desc]) => (
                <Table.Tr key={grade}>
                  <Table.Td w={40}><Badge variant="light" color="gray" size="sm">{grade}</Badge></Table.Td>
                  <Table.Td w={90}><Text fz="sm" c="dimmed">{range}</Text></Table.Td>
                  <Table.Td><Text fz="sm" c="dimmed">{desc}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Section>
        <Section title="개선 권장 사항">
          <Text fz="sm" c="dimmed" lh={1.7}>
            분석 결과에 우선순위별 개선 권장 사항이 포함됩니다.
          </Text>
          <List spacing="xs" fz="sm" c="dimmed">
            <List.Item><Text span c="red">높음</Text> — 즉시 조치가 필요한 항목</List.Item>
            <List.Item><Text span c="yellow.7">중간</Text> — 개선하면 좋은 항목</List.Item>
            <List.Item><Text span c="blue">낮음</Text> — 추가 고려 사항</List.Item>
          </List>
        </Section>
        <Section title="경쟁사 비교">
          <Text fz="sm" c="dimmed" lh={1.7}>
            2개 이상의 사이트를 분석한 후 "경쟁사 비교" 기능을 사용할 수 있습니다.
            카테고리별 점수 차이, 강점/약점 비교, 점수 격차를 한눈에 확인할 수 있습니다.
          </Text>
        </Section>
        <Requirement>경쟁사 비교를 사용하려면 최소 2개 이상의 사이트 분석이 완료되어야 합니다.</Requirement>
        <Section title="히스토리">
          <Text fz="sm" c="dimmed" lh={1.7}>
            최근 10건의 분석 결과가 저장됩니다.
            이전 분석을 불러와 점수 변화를 추적하거나, 전체 히스토리를 초기화할 수 있습니다.
          </Text>
        </Section>
      </Stack>
    ),
  };

  return <>{content[active]}</>;
}

export function GuideModal({ opened, onClose }: GuideModalProps) {
  useBodyScrollLock(opened);
  const [active, setActive] = useState('brands');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Title order={3} fz="lg">사용 가이드</Title>
          <Badge size="sm" variant="light" color="brand">v1.0.1</Badge>
        </Group>
      }
      size="xl"
      centered
      lockScroll={false}
      styles={{
        body: { padding: 0, overflow: 'hidden' },
      }}
    >
      <Box style={{ display: 'flex', height: 520 }}>
        {/* Left menu */}
        <Box
          w={180}
          miw={180}
          py="md"
          style={{
            borderRight: '1px solid var(--mantine-color-default-border)',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              label={item.label}
              leftSection={<item.icon size={16} />}
              active={active === item.key}
              onClick={() => setActive(item.key)}
              variant="light"
              styles={{
                root: { borderRadius: 0 },
              }}
            />
          ))}
        </Box>

        {/* Right content */}
        <ScrollArea style={{ flex: 1 }} h={520}>
          <Box p="xl">
            <GuideContent active={active} />
          </Box>
        </ScrollArea>
      </Box>
    </Modal>
  );
}
