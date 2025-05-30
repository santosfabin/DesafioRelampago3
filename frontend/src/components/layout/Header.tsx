// frontend/src/components/layout/Header.tsx
import type { Dispatch, SetStateAction } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink, useNavigate } from 'react-router'; // USANDO 'react-router'
import Box from '@mui/material/Box';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Ícone opcional para o perfil
import IconButton from '@mui/material/IconButton'; // Se quiser usar um ícone como botão
import Tooltip from '@mui/material/Tooltip'; // Para o tooltip do ícone

interface HeaderProps {
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

const Header = ({ isAuthenticated, setIsAuthenticated }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to logout from server:', error);
    } finally {
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to={isAuthenticated ? '/' : '/login'}
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          AssetManager
        </Typography>
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {' '}
            {/* alignItems para alinhar ícone e botões */}
            <Button color="inherit" component={RouterLink} to="/assets">
              Assets
            </Button>
            {/* Ou, se preferir um botão de texto:
            <Button color="inherit" component={RouterLink} to="/profile">
              My Account
            </Button>
            */}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
            {/* === NOVO BOTÃO/LINK PARA O PERFIL === */}
            <Tooltip title="My Account">
              <IconButton
                color="inherit"
                component={RouterLink}
                to="/profile" // Navega para a rota do perfil
                aria-label="account of current user"
              >
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
