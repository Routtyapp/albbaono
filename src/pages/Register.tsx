import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Alert,
  Center,
  Box,
  Image,
  Divider,
} from '@mantine/core';
import { IconMail, IconLock, IconUser, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    const result = await register(email, password, name || undefined);

    if (result.success) {
      navigate('/dashboard');
      return;
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0efed',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container size={400} py={40}>
        <Center mb={32}>
          <Anchor component={Link} to="/" underline="never">
            <Image src="/YeogiJeogiFontLogo (1).png" alt="여기저기" h={36} w="auto" />
          </Anchor>
        </Center>

        <Paper radius="lg" p={32} shadow="sm" bg="white">
          <Text size="lg" ta="center" mb={4}>
            회원가입
          </Text>
          <Text c="dimmed" size="sm" ta="center" mb={24}>
            이미 계정이 있으신가요?{' '}
            <Anchor component={Link} to="/login" size="sm">
              로그인
            </Anchor>
          </Text>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              mb="md"
              variant="light"
              radius="md"
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              icon={<IconCheck size={16} />}
              color="green"
              mb="md"
              variant="light"
              radius="md"
            >
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="이름"
                placeholder="이름 (선택)"
                leftSection={<IconUser size={16} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                radius="md"
                size="md"
              />

              <TextInput
                label="이메일"
                placeholder="your@email.com"
                leftSection={<IconMail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                radius="md"
                size="md"
              />

              <PasswordInput
                label="비밀번호"
                placeholder="최소 6자 이상"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                radius="md"
                size="md"
              />

              <PasswordInput
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                leftSection={<IconLock size={16} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                radius="md"
                size="md"
              />

              <Button type="submit" fullWidth loading={loading} mt="sm" size="md" radius="md">
                회원가입
              </Button>
            </Stack>
          </form>

          <Divider my="lg" />

          <Text c="dimmed" size="xs" ta="center">
            <Anchor component={Link} to="/" size="xs" c="dimmed">
              ← 홈으로 돌아가기
            </Anchor>
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}


