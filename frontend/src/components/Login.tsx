// frontend/src/components/Login.tsx
import { useState } from 'react';
import type { FormEvent } from 'react'; // Mantendo seu import de tipo
import { useNavigate, Link as RouterLink } from 'react-router'; // Assumindo react-router, se for 'react-router', avise
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link'; // MUI Link
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials.';
        try {
          const errorData = await response.json();
          // Seu backend retorna { error: "mensagem" } ou pode ter { error: { error: "mensagem" } }
          if (errorData && errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (
            errorData &&
            errorData.error &&
            errorData.error.error &&
            typeof errorData.error.error === 'string'
          ) {
            // Caso aninhado
            errorMessage = errorData.error.error;
          } else if (errorData && errorData.message) {
            // Fallback para .message
            errorMessage = errorData.message;
          }
        } catch (_e) {
          if (response.statusText) {
            errorMessage = response.statusText;
          }
        }
        throw new Error(errorMessage);
      }

      // Se chegou aqui, response.ok é true. O backend configurou o cookie httpOnly.
      // Não precisamos manipular tokens no frontend.
      setIsAuthenticated(true);
      navigate('/'); // Redireciona para a página principal/dashboard
    } catch (err: unknown) {
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
          {/* Mantendo sua estrutura de Grid para o link de registro */}
          <Grid container>
            <Grid size={{ xs: 12 }} sx={{ textAlign: 'right' }}>
              {' '}
              {/* Usando 'size' como no seu original */}
              {/* Para navegação com React Router, o Link do MUI deve usar o RouterLink como componente */}
              <Link component={RouterLink} to="/register" variant="body2">
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
