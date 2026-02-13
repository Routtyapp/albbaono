import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
  Alert,
  Checkbox,
  Box,
  Image,
  Container,
  FileButton,
  Loader,
  CloseButton,
} from '@mantine/core';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapImage from '@tiptap/extension-image';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconPhoto,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconUpload,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getFeed,
  createFeed,
  updateFeed,
  type FeedInput,
} from '../../services/feed';
import { apiUpload } from '../../services/client';

const FEED_CATEGORIES = [
  { value: 'general', label: '일반' },
  { value: 'seo', label: 'SEO' },
  { value: 'geo', label: 'GEO' },
  { value: 'update', label: '업데이트' },
  { value: 'tip', label: '팁' },
];

async function uploadImage(file: File): Promise<string> {
  const result = await apiUpload('/api/upload', file);
  return result.url;
}

export function FeedEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingEditorImage, setIsUploadingEditorImage] = useState(false);

  const editorImageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      TiptapImage.configure({ inline: false, allowBase64: false }),
    ],
    content: '',
  });

  // 수정 모드: 기존 피드 데이터 로드
  useEffect(() => {
    if (!id) return;
    setIsLoadingFeed(true);
    getFeed(id)
      .then((feed) => {
        setFormTitle(feed.title);
        setFormCategory(feed.category);
        setFormThumbnailUrl(feed.thumbnailUrl || '');
        setFormIsFeatured(feed.isFeatured);
        editor?.commands.setContent(feed.content);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '피드를 불러오는데 실패했습니다.');
      })
      .finally(() => setIsLoadingFeed(false));
  }, [id, editor]);

  // 에디터 본문 이미지 삽입
  const handleEditorImageUpload = useCallback(async (file: File | null) => {
    if (!file || !editor) return;
    setIsUploadingEditorImage(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingEditorImage(false);
    }
  }, [editor]);

  // 썸네일 업로드
  const handleThumbnailUpload = useCallback(async (file: File | null) => {
    if (!file) return;
    setIsUploadingThumbnail(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setFormThumbnailUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '썸네일 업로드에 실패했습니다.');
    } finally {
      setIsUploadingThumbnail(false);
    }
  }, []);

  const handleSave = async () => {
    const content = editor?.getHTML() || '';
    if (!formTitle.trim() || !content.trim() || content === '<p></p>') {
      setError('제목과 본문은 필수입니다.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const data: FeedInput = {
        title: formTitle.trim(),
        content,
        category: formCategory,
        thumbnailUrl: formThumbnailUrl.trim() || undefined,
        isFeatured: formIsFeatured,
      };

      if (isEditMode && id) {
        await updateFeed(id, data);
      } else {
        await createFeed(data);
      }
      navigate('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Back + Title */}
        <Group gap="sm">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/feed')}
            px="xs"
          >
            돌아가기
          </Button>
        </Group>

        <Title order={3}>{isEditMode ? '피드 수정' : '새 피드 작성'}</Title>

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

        {isLoadingFeed ? (
          <Text c="dimmed">불러오는 중...</Text>
        ) : (
          <>
            {/* 제목 */}
            <TextInput
              label="제목"
              placeholder="피드 제목을 입력하세요"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              size="md"
              required
            />

            {/* 리치 텍스트 에디터 */}
            <Box>
              <Text size="sm" fw={500} mb={4}>
                본문 <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span>
              </Text>
              <RichTextEditor editor={editor} styles={{ root: { backgroundColor: '#fff' }, content: { backgroundColor: '#fff' } }}>
                <RichTextEditor.Toolbar sticky stickyOffset={52} style={{ backgroundColor: '#fff' }}>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.Strikethrough />
                    <RichTextEditor.Code />
                    <RichTextEditor.ClearFormatting />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1 />
                    <RichTextEditor.H2 />
                    <RichTextEditor.H3 />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.BulletList />
                    <RichTextEditor.OrderedList />
                    <RichTextEditor.Blockquote />
                    <RichTextEditor.Hr />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link />
                    <RichTextEditor.Unlink />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    {/* 이미지 업로드 버튼 */}
                    <RichTextEditor.Control
                      onClick={() => editorImageInputRef.current?.click()}
                      aria-label="이미지 삽입"
                      disabled={isUploadingEditorImage}
                    >
                      {isUploadingEditorImage ? <Loader size={16} /> : <IconPhoto size={16} />}
                    </RichTextEditor.Control>
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Control
                      onClick={() => editor?.chain().focus().undo().run()}
                      aria-label="Undo"
                    >
                      <IconArrowBackUp size={16} />
                    </RichTextEditor.Control>
                    <RichTextEditor.Control
                      onClick={() => editor?.chain().focus().redo().run()}
                      aria-label="Redo"
                    >
                      <IconArrowForwardUp size={16} />
                    </RichTextEditor.Control>
                  </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>

                <RichTextEditor.Content style={{ minHeight: 300 }} />
              </RichTextEditor>

              {/* 숨겨진 파일 input (에디터 이미지용) */}
              <input
                ref={editorImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  handleEditorImageUpload(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
              />
            </Box>

            {/* 메타 정보 */}
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={5}>메타 정보</Title>

                {/* 썸네일 업로드 */}
                <Box>
                  <Text size="sm" fw={500} mb={4}>
                    썸네일 이미지
                  </Text>
                  {formThumbnailUrl ? (
                    <Box pos="relative" style={{ display: 'inline-block' }}>
                      <Image
                        src={formThumbnailUrl}
                        alt="썸네일 미리보기"
                        h={160}
                        w="100%"
                        radius="md"
                        fit="cover"
                      />
                      <CloseButton
                        pos="absolute"
                        top={8}
                        right={8}
                        size="sm"
                        variant="filled"
                        color="dark"
                        onClick={() => setFormThumbnailUrl('')}
                        aria-label="썸네일 삭제"
                      />
                    </Box>
                  ) : (
                    <FileButton
                      onChange={handleThumbnailUpload}
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    >
                      {(props) => (
                        <Button
                          {...props}
                          variant="light"
                          color="gray"
                          leftSection={isUploadingThumbnail ? <Loader size={16} /> : <IconUpload size={16} />}
                          loading={isUploadingThumbnail}
                        >
                          썸네일 업로드
                        </Button>
                      )}
                    </FileButton>
                  )}
                </Box>

                <Select
                  label="카테고리"
                  value={formCategory}
                  onChange={(val) => setFormCategory(val || 'general')}
                  data={FEED_CATEGORIES}
                />

                <Checkbox
                  label="주요 글 (히어로 캐러셀에 표시)"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.currentTarget.checked)}
                />
              </Stack>
            </Paper>

            {/* 저장 버튼 */}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => navigate('/feed')}>
                취소
              </Button>
              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={!formTitle.trim()}
                size="md"
              >
                {isEditMode ? '수정 완료' : '발행하기'}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Container>
  );
}
