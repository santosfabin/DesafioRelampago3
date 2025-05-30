import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface LogoutProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Logout = ({ setIsAuthenticated }: LogoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        const response = await fetch('/api/logout', { method: 'DELETE' });

        if (!response.ok) {
          console.error('Server logout request failed, status:', response.status);
        }
      } catch (error) {
        console.error('Logout API call failed:', error);
      } finally {
        setIsAuthenticated(false);

        navigate('/login');
      }
    };

    performLogout();
  }, [navigate, setIsAuthenticated]);

  return (
    <Container component="main" maxWidth="xs" sx={{ textAlign: 'center', mt: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Logging out...
        </Typography>
      </Box>
    </Container>
  );
};

export default Logout;
