import type { Dispatch, SetStateAction } from 'react';
import { Outlet } from 'react-router';
import Box from '@mui/material/Box';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

const MainLayout = ({ isAuthenticated, setIsAuthenticated }: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;
