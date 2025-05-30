// frontend/src/components/layout/Header.tsx
import type { Dispatch, SetStateAction } from 'react'; // ADICIONAR Dispatch e SetStateAction
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink, useNavigate } from 'react-router'; // Ou 'react-router'
import Box from '@mui/material/Box';

// 1. DEFINIR A INTERFACE DE PROPS
interface HeaderProps {
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

// 2. RECEBER AS PROPS
const Header = ({ isAuthenticated, setIsAuthenticated }: HeaderProps) => {
  const navigate = useNavigate();

  // const isAuthenticated = !!localStorage.getItem('token'); // REMOVIDO - Agora vem via prop

  const handleLogout = async () => {
    try {
      // 3. CHAMAR API DE LOGOUT DO BACKEND
      await fetch('/api/logout', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to logout from server:', error);
      // Mesmo se a chamada ao servidor falhar, prosseguimos com o logout no cliente.
    } finally {
      // 4. ATUALIZAR ESTADO DE AUTENTICAÇÃO
      setIsAuthenticated(false);
      // 5. NAVEGAR PARA LOGIN
      navigate('/login');
      // localStorage.removeItem('token'); // REMOVIDO - Não usamos token no localStorage para sessão
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to={isAuthenticated ? '/' : '/login'} // Leva para home se logado, login se não
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          AssetManager
        </Typography>
        {/* 6. USAR A PROP isAuthenticated PARA RENDERIZAÇÃO CONDICIONAL */}
        {isAuthenticated ? (
          <Box>
            <Button color="inherit" component={RouterLink} to="/assets">
              Assets
            </Button>
            {/* Adicione outros botões de navegação para usuários logados aqui */}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
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
