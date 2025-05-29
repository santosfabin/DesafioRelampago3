import Box from '@mui/material/Box';
import Header from './Header';
import Footer from './Footer';

// frontend/src/components/layout/MainLayout.tsx
import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
// ... outros imports

interface MainLayoutProps {
  children?: ReactNode; // Tornar children opcional se nem sempre é passado diretamente
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children ? children : <Outlet />} {/* Prioriza children se passado, senão usa Outlet */}
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;
