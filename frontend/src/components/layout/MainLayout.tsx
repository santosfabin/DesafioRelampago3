// frontend/src/components/layout/MainLayout.tsx
import type { Dispatch, SetStateAction } from 'react'; // ReactNode pode ser removido se children for removido
import { Outlet } from 'react-router';
import Box from '@mui/material/Box';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  // children?: ReactNode; // REMOVIDO SE NÃO FOR USADO DIRETAMENTE
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

// 'children' removido dos parâmetros se não for usado
const MainLayout = ({ isAuthenticated, setIsAuthenticated }: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet /> {/* Outlet renderiza as rotas filhas */}
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;
