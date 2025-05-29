import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';

interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Login = ({ setIsAuthenticated }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        // 1. Endpoint correto?
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // 2. Tratamento da Resposta
      if (!response.ok) {
        // Tenta ler a mensagem de erro do backend
        let errorMessage = 'Login failed. Please check your credentials.'; // Mensagem padrão
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            // Seu backend retorna { error: "mensagem" }
            errorMessage = errorData.error;
          }
        } catch (_e) {
          // Se não conseguir parsear JSON, usa a mensagem padrão ou o statusText
          if (response.statusText) {
            errorMessage = response.statusText;
          }
        }
        throw new Error(errorMessage);
      }

      // Se chegou aqui, response.ok é true. O backend deve ter configurado o cookie.
      // O backend retorna { message: "OK" } no sucesso do login.
      // Não precisamos do 'token' do corpo da resposta se o cookie é httpOnly.
      // const data = await response.json(); // Não estritamente necessário se o backend só manda cookie
      // e uma mensagem de sucesso.

      // 3. Atualiza estado e navega
      setIsAuthenticated(true);
      // Disparar um evento para o App.tsx pegar (se ele ainda estiver usando essa lógica)
      // pode não ser mais necessário se o App.tsx já escuta 'storage' ou
      // se a navegação e o re-render já fazem o App.tsx reavaliar.
      // Para simplificar, a chamada a setIsAuthenticated deve ser suficiente.
      // window.dispatchEvent(new Event('tokenChanged')); // Pode ser opcional

      // 5. Redirecionamento
      navigate('/');
    } catch (err: unknown) {
      // 6. Tratamento de Erros
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ... (JSX do formulário continua o mesmo)
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Grid container>
            <Grid size={{ xs: 12 }} sx={{ textAlign: 'right' }}>
              {' '}
              {/* Ajustado para ocupar largura e alinhar */}
              <Link href="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
