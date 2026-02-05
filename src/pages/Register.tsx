import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Alert,
  Center,
  Box,
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

    // 비밀번호 확인
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
      setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container size={420} py={40}>
        <Center mb={30}>
          <Title
            order={1}
            style={{
              color: 'white',
              fontSize: '2rem',
              fontWeight: 700,
            }}
          >
            GEO Tracker
          </Title>
        </Center>

        <Paper radius="md" p="xl" withBorder shadow="xl">
          <Title order={2} ta="center" mb={5}>
            회원가입
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb={20}>
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
            >
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="이름"
                placeholder="이름 (선택)"
                leftSection={<IconUser size={16} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <TextInput
                label="이메일"
                placeholder="your@email.com"
                leftSection={<IconMail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
              />

              <PasswordInput
                label="비밀번호"
                placeholder="최소 6자 이상"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />

              <PasswordInput
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                leftSection={<IconLock size={16} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />

              <Button type="submit" fullWidth loading={loading} mt="md">
                회원가입
              </Button>
            </Stack>
          </form>

          <Text c="dimmed" size="xs" ta="center" mt="xl">
            <Anchor component={Link} to="/" size="xs">
              홈으로 돌아가기
            </Anchor>
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}
