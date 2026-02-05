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
import { IconMail, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
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
            로그인
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb={20}>
            계정이 없으신가요?{' '}
            <Anchor component={Link} to="/register" size="sm">
              회원가입
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

          <form onSubmit={handleSubmit}>
            <Stack>
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
                placeholder="비밀번호를 입력하세요"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />

              <Button type="submit" fullWidth loading={loading} mt="md">
                로그인
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
